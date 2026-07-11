import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sentOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: "Reset You password",
    html: `<p> your Otp for reset password <b> ${otp} </b> . It will expire after 5 minute </p>`,
  });
};
