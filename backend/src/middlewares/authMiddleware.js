import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.header("authorization")?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("decoded.id:", decoded.id);

        try {
            req.user = await User.findById(decoded.id).select("-password");
            console.log("req.user:", req.user);
            if (!req.user) {
                return res.status(401).json({ error: "Unauthorized, user not found" });
            }
            next();
        } catch (dbError) {
            console.error("Ошибка базы данных при поиске пользователя:", dbError);
            return res.status(500).json({ error: "Database error while fetching user" });
        }

    } catch (jwtError) {
        console.error("Ошибка верификации токена:", jwtError);
        return res.status(401).json({ error: "Unauthorized, invalid token" });
    }
};