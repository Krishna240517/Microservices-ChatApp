    import jwt from "jsonwebtoken";
    import dotenv from "dotenv";
import type { SafeUser } from "../middlewares/isAuth.js";
    dotenv.config();

    export const generateToken = (user: SafeUser) => {
        return jwt.sign({user},process.env.JWT_SECRET as string,{expiresIn:"1d"});
    }