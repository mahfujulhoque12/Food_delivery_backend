import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide your password"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    mobile: {
      type: String,
      required: [true, "Please provide your mobile number"],
    },
    role: {
      type: String,
      enum: ["user", "owner", "deliveryBoy"],
      required: [true, "Please provide your role"],
    },
    resetOtp: {
      type: String,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    otpExpired: {
      type: Date,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
