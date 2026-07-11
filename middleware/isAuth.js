import jwt from "jsonwebtoken";
const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "token is not found" });
    }
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodeToken) {
      return res.status(400).json({ message: "user  not found" });
    }
    console.log(decodeToken);
    req.userId = decodeToken.userId;
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Auth Error" });
  }
};

export default isAuth;
