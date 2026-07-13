import Shop from "../models/shop.model.js";
import uploadCloudinary from "../utils/cloudinary.js";
export const createAndEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;
    if (req.file) {
      image = await uploadCloudinary(req.file.path);
    }
    let shop = await Shop.findOne({ owner: req.userId });

    if (!shop) {
      await Shop.create({
        name,
        city,
        state,
        address,
        image,
        owner: req.userId,
      });
    } else {
      await Shop.findByIdAndUpdate(shop._id)(
        {
          name,
          city,
          state,
          address,
          image,
          owner: req.userId,
        },
        { new: true },
      );
    }

    await Shop.populate("owner");
    res.status(201).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `Create Shop Error ${error}` });
  }
};

export const getCurrentShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId }).populate(
      "owner items",
    );

    if (!shop) {
      return null;
    }
    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({ message: `Get Shop Error ${error}` });
  }
};
