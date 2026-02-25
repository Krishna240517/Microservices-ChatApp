import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

export interface SafeUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  isVerified: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies["chattoken"];

    if (!token) {
      res.status(401).json({ message: "Please login - No token found" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded || !decoded.user) {
      res.status(401).json({ message: "Invalid Token" });
      return;
    }

    req.user = decoded.user as SafeUser;
    next();
  } catch (error) {
    res.status(500).json({ msg: "Please login - JWT Error" });
  }
};