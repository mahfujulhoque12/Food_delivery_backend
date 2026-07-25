import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ message: "User id is not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
      },
      { new: true },
    );
    if (!user) {
      res.status(400).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Location Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
