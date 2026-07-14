import Shop from "../models/shop.model.js";
import uploadCloudinary from "../utils/cloudinary.js";
export const createAndEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;

    const updateData = {
      name,
      city,
      state,
      address,
    };

    if (req.file) {
      updateData.image = await uploadCloudinary(req.file.path);
    }

    let shop = await Shop.findOne({ owner: req.userId });

    if (!shop) {
      shop = await Shop.create({
        ...updateData,
        owner: req.userId,
      });
    } else {
      shop = await Shop.findByIdAndUpdate(shop._id, updateData, {
        new: true,
      });
    }

    await shop.populate("owner");

    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({
      message: `Create/Edit Shop Error: ${error}`,
    });
  }
};

export const getCurrentShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId }).populate(
      "owner items",
    );

    if (!shop) {
      return res.status(200).json(null);
    }

    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Get Shop Error: ${error.message}`,
    });
  }
};
