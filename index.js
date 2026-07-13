import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import shopRouter from "./routes/shop.route.js";
import itemRouter from "./routes/item.route.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://food-delivery-frontned.vercel.app",
    ],
    credentials: true,
  }),
);

const port = process.env.PORT || 6000;
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});
