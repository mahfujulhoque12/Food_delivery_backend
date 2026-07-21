import Item from "../models/items.model.js";
import Shop from "../models/shop.model.js";
import uploadCloudinary from "../utils/cloudinary.js";

export const addItem = async (req, res) => {
  try {
    const { name, category, price, foodType } = req.body;

    let image;
    if (req.file) {
      image = await uploadCloudinary(req.file.buffer);
    }
    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) {
      return res.status(400).json({ message: "Shop not found" });
    }
    const item = await Item.create({
      name,
      category,
      price,
      foodType,
      image,
      shop: shop._id,
      rating: {
        average: Number(req.body["rating.average"]),
        count: Number(req.body["rating.count"]),
      },
    });
    shop.items.push(item._id);
    await shop.save();
    await shop.populate({
      path: "items",
      options: {
        sort: { updatedAt: -1 },
      },
    });
    return res.status(201).json(shop);
  } catch (error) {
    return res.status(500).json({
      message: `Item add Error ${error}`,
    });
  }
};

export const editItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, price, foodType } = req.body;

    let image;
    if (req.file) {
      image = await uploadCloudinary(req.file.buffer);
    }
    const item = await Item.findByIdAndUpdate(
      itemId,
      {
        name,
        category,
        price,
        foodType,
        rating: {
          average: Number(req.body["rating.average"]),
          count: Number(req.body["rating.count"]),
        },
      },
      { new: true },
    );
    if (!item) {
      return res.status(400).json({ message: "Item not found" });
    }
    const shop = await Shop.findOne({ owner: req.userId }).populate({
      path: "items",
      options: { sort: { updatedAt: -1 } },
    });
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({
      message: `Item Edit Error ${error.message}`,
    });
  }
};

export const getItemById = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({
      message: `Single  Item  Error ${error.message}`,
    });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findByIdAndDelete(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
      data: item,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Delete Item  Error ${error.message}`,
    });
  }
};
