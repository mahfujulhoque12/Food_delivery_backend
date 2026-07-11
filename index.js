import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";

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

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});
