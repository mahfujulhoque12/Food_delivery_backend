import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log({
  SMTP_USER: process.env.SMTP_USER,
  hasPassword: !!process.env.SMTP_PASS,
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP Verify Error:", err);
  } else {
    console.log("SMTP Connected Successfully");
  }
});

export const sentOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Reset Your Password",
    html: `
      <p>Your OTP for password reset is <b>${otp}</b>.</p>
      <p>This OTP will expire in 5 minutes.</p>
    `,
  });
};
