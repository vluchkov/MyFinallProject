import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler"; // Для обработки ошибок в асинхронных middleware
import User from "../models/userModel.js"; // Предполагаем, что модель пользователя здесь

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(" ")[1];

      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Находим пользователя по ID из токена, исключая пароль
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error("Authentication error:", error.message);
      res.status(401);
      // Разные сообщения об ошибках в зависимости от типа ошибки JWT
      if (error.name === "JsonWebTokenError") {
        throw new Error("Not authorized, token failed (invalid signature)");
      }
      if (error.name === "TokenExpiredError") {
        throw new Error("Not authorized, token expired");
      }
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

export { protect };
