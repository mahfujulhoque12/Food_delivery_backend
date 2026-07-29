import DeliveryAssignment from "../models/deliveryAssaignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import { sentDeliveryOtpMail } from "../utils/mail.js";

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is Empty",
      });
    }
    if (
      !deliveryAddress.text ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res
        .status(400)
        .json({ message: "Please Complete Delivery Address" });
    }

    const groupItemsByShop = {};

    cartItems.forEach((item) => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) {
        groupItemsByShop[shopId] = [];
      }
      groupItemsByShop[shopId].push(item);
    });

    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");

        if (!shop) {
          throw new Error("Shop Not Found");
        }

        const items = groupItemsByShop[shopId];

        const subtotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.qty),
          0,
        );

        return {
          shop: shop._id,
          owner: shop.owner._id,
          subtotal,
          shopOrderItems: items.map((i) => ({
            item: i._id,
            price: i.price,
            qty: i.qty,
            name: i.name,
          })),
        };
      }),
    );
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });
    return res.status(200).json(newOrder);
  } catch (error) {
    return res.status(500).json({
      message: ` Order error ${error.message}`,
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role == "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({
          createdAt: -1,
        })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item");
      return res.status(200).json(orders);
    } else if (user.role == "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({
          createdAt: -1,
        })
        .populate("shopOrders.shop", "name")
        .populate("user")
        .populate("shopOrders.shopOrderItems.item")
        .populate("shopOrders.assignDeliveryBoy");

      const filterOrders = orders.map((order) => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        user: order.user,
        shopOrders: order.shopOrders.filter(
          (shopOrder) => shopOrder.owner._id.toString() === req.userId,
        ),
      }));
      return res.status(200).json(filterOrders);
    }
  } catch (error) {
    return res.status(500).json({ message: `get user order error ${error} ` });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const shopOrder = order.shopOrders.find(
      (o) => o.shop.toString() === shopId,
    );

    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }

    shopOrder.status = status;
    let deliveryBoysPayload = [];

    if (status === "out of delivery" || shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress;
      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            $maxDistance: 5000,
          },
        },
      });
      const nearByIds = nearByDeliveryBoys.map((b) => b._id);
      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["broadcasted", "completed"] },
      }).distinct("assignedTo");

      const busyIdSet = new Set(busyIds.map((id) => String(id)));
      const avaiableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdSet.has(String(b._id)),
      );
      const candidates = avaiableBoys.map((b) => b._id);
      if (candidates.length === 0) {
        await order.save();
        return res.status(200).json({
          message: "order updated but there is no delivery boy here",
          shopOrder,
          avaiableBoys: [],
        });
      }

      const deliveryAssignment = await DeliveryAssignment.create({
        order: order._id,
        shop: shopOrder.shop,

        shopOrderId: shopOrder._id,
        broadcastedTo: candidates,
        status: "broadcasted",
      });

      shopOrder.assignDeliveryBoy = deliveryAssignment.assignedTo;
      shopOrder.assignment = deliveryAssignment._id;

      deliveryBoysPayload = avaiableBoys.map((b) => ({
        id: b._id,
        full_name: b.full_name,
        longitude: b.location.coordinates[0],
        latitude: b.location.coordinates[1],
        mobile: b.mobile,
      }));
    }

    // সমাধান ২: শুধুমাত্র পুরো order ডকুমেন্টটি সেভ করলেই হবে
    await order.save();

    // প্রথমে ডাটা পপুলেট করে নিন, তারপর ফিল্টার করুন
    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignDeliveryBoy",
      "full_name email mobile",
    );

    // সমাধান ৩: .toString() ব্যবহার করে নিখুঁতভাবে ফিল্টার করা হয়েছে
    const updatedShopOrder = order.shopOrders.find(
      (o) => o.shop._id.toString() === shopId.toString(),
    );

    return res.status(200).json({
      message: "Status updated successfully",
      shopOrder: updatedShopOrder,
      assignedDeliveryBoy: updatedShopOrder?.assignDeliveryBoy,
      avaiableBoys: deliveryBoysPayload,
      assignment: updatedShopOrder?.assignment?._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: `Status update error: ${error.message}`,
    });
  }
};

export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const assignments = await DeliveryAssignment.find({
      broadcastedTo: deliveryBoyId,
      status: "broadcasted",
    })

      .populate({
        path: "order",
        populate: {
          path: "user",
          select: "full_name mobile",
        },
      })
      .populate("shop");

    const formatted = assignments.map((d) => {
      const shopOrder = d.order.shopOrders.find((so) =>
        so._id.equals(d.shopOrderId),
      );

      return {
        assignmentId: d._id,
        orderId: d.order._id,
        shopName: d.shop.name,
        deliveryAddress: d.order.deliveryAddress,
        customerName: d.order.user.full_name,
        customerPhone: d.order.user.mobile,
        items: shopOrder?.shopOrderItems || [],
        subtotal: shopOrder?.subtotal || 0,
      };
    });

    if (formatted.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(formatted);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: ` Delivery Boy Assignment error: ${error.message}`,
    });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await DeliveryAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(400).json({ message: "Assignment Not Found" });
    }

    if (assignment.status !== "broadcasted") {
      return res.status(400).json({ message: "Assignment is Expired" });
    }
    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["broadcasted", "completed"] },
    });

    if (alreadyAssigned) {
      return res
        .status(400)
        .json({ message: "You are already assigned to another project" });
    }
    assignment.assignedTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();
    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.status(400).json({ message: "Order Not Found" });
    }

    const shopOrder = order.shopOrders.find(
      (so) => so._id.toString() === assignment.shopOrderId.toString(),
    );
    shopOrder.assignDeliveryBoy = req.userId;
    await order.save();
    return res.status(200).json({ message: "Order Accepted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: ` Accepted Order Error: ${error.message}`,
    });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned",
    })
      .populate("shop")
      .populate("assignedTo")
      .populate({
        path: "order",
        populate: [{ path: "user", select: "full_name email location mobile" }],
      });
    // No current order
    if (!assignment) {
      return res.status(200).json({
        hasCurrentOrder: false,
        data: null,
      });
    }

    if (!assignment.order) {
      return res.status(200).json({
        hasCurrentOrder: false,
        data: null,
      });
    }

    const shopOrder = assignment.order.shopOrders.find(
      (so) => so._id?.toString() === assignment.shopOrderId?.toString(),
    );
    if (!shopOrder) {
      return res.status(400).json({ message: "shop order not found" });
    }

    let deliveryBoyLocation = { lat: null, lon: null };

    if (assignment.assignedTo.location.coordinates.length == 2) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }

    let customerLocation = { lat: null, lon: null };
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress.latitude;
      customerLocation.lon = assignment.order.deliveryAddress.longitude;
    }
    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: `current order error: ${error.message}`,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })
      .populate({ path: "shopOrders.assignDeliveryBoy", model: "User" })
      .populate({ path: "shopOrders.shopOrderItems.item", model: "Item" })
      .lean();
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: ` get  Order Id Error: ${error.message}`,
    });
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;
    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res
        .status(400)
        .json({ message: "enter valid order or shop order id" });
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpired = Date.now() + 5 * 60 * 1000;
    await order.save();
    await sentDeliveryOtpMail(order.user, otp);

    return res
      .status(200)
      .json({ message: `Otp send successfully to ${order.user.full_name}` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: ` get  delivery otp error: ${error.message}`,
    });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;
    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res
        .status(400)
        .json({ message: "enter valid order or shop order id" });
    }
    if (
      shopOrder.deliveryOtp !== otp ||
      !shopOrder.otpExpired ||
      shopOrder.otpExpired < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid / Expired Otp" });
    }
    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();
    await order.save();
    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignDeliveryBoy,
    });

    return res.status(200).json({ message: "Delivery order Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: `verify Delivery Error: ${error.message}`,
    });
  }
};
