import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Burger",
        "Pizza",
        "Chicken",
        "Fried Chicken",
        "Sandwich",
        "Pasta",
        "Noodles",
        "Rice",
        "Biryani",
        "Morog Polow",
        "Kebab",
        "BBQ",
        "Seafood",
        "Vegan",
        "Others",
      ],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    foodType: {
      type: String,
      enum: ["Fast Food", "Deshi Food"],
      required: true,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const Item = mongoose.model("Item", itemSchema);
export default Item;
