import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { redisClient } from "../config/redis.js";
import TryCatch from "../config/TryCatch.js";
import crypto from "crypto";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import type { Response } from "express";

const setAuthCookie = (res: any, token: string) => {
    res.cookie("chattoken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });
};

const sendOTP = async (email: string) => {
    const rateLimitKey = `otp:rateLimit:${email}`;
    const isAllowed = await redisClient.set(rateLimitKey, "true", { EX: 60, NX: true });

    if (!isAllowed) {
        throw new Error("Too many requests, Please wait before requesting new OTP");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpKey = `otp:${email}`;

    await redisClient.set(otpKey, otp, { EX: 300 });

    const message = {
        to: email,
        subject: "Your OTP code",
        body: `Your OTP code is ${otp}. Mind that the OTP code is valid for only 5 minutes.`
    };

    await publishToQueue('send-otp', message);
};

export const signup = TryCatch(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ msg: "Please Enter all fields" });
    }

    let user = await User.findOne({ email });

    if (user) {
        if (user.isVerified) {
            return res.status(409).json({ msg: "User Already Exists" });
        }
        try {
            await sendOTP(email);
            return res.status(200).json({ msg: "Account already exists but unverified, A new OTP has been sent.", email });
        } catch (otpError: unknown) {
            const msg = otpError instanceof Error ? otpError.message : "Failed to send OTP";
            return res.status(429).json({ msg });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    try {
        await sendOTP(email);
    } catch (otpError: unknown) {
        return res.status(201).json({
            msg: "User created, but we couldn't send the OTP right now. Please request a resend",
            _id: user._id,
            email
        });
    }

    return res.status(201).json({
        msg: "User created successfully",
        _id: user._id,
        name,
        email
    });
});

export const verifyOTP = TryCatch(async (req, res) => {
    const { email, otp: enteredOtp } = req.body;
    if (!email || !enteredOtp) {
        return res.status(400).json({ msg: "Email and OTP are required" });
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp || storedOtp !== enteredOtp) {
        return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email }).select('-password');

    if (!user) {
        return res.status(404).json({ msg: "User not found" });
    }
    if (user.isVerified) {
        return res.status(400).json({ msg: "User already verified" });
    }

    user.isVerified = true;
    await user.save();
    await publishToQueue('user-created',user);
    await redisClient.del(otpKey);

    const token = generateToken({
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
    });
    setAuthCookie(res, token);

    return res.status(200).json({
        msg: "Account verified successfully",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        }
    });
});

export const login = TryCatch(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: "All fields are required" });
    }

    const loginLimitKey = `login:limit:${email}`;
    const currentAttempts = await redisClient.incr(loginLimitKey);
    if (currentAttempts === 1) {
        await redisClient.expire(loginLimitKey, 300);
    }
    if (currentAttempts > 5) {
        return res.status(429).json({ msg: "Too many login attempts. Please try again in 5 minutes." });
    }

    const user = await User.findOne({ email });
    const matchPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !matchPassword) {
        return res.status(401).json({ msg: "Invalid credentials" });
    }

    if (!user.isVerified) {
        try {
            await sendOTP(email);
            return res.status(403).json({ msg: "Account not verified. OTP sent to your email." });
        } catch (otpError: unknown) {
            return res.status(403).json({ msg: "Account not verified, and rate limit reached for OTP. Try later." });
        }
    }

    await redisClient.del(loginLimitKey);

    const token = generateToken({
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
    });
    setAuthCookie(res, token);

    return res.status(200).json({
        msg: "Logged in successfully",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        }
    });
});

export const logout = TryCatch(async (req, res) => {
    res.cookie("chattoken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0),
    });
    return res.status(200).json({ msg: "Logged out successfully" });
});
export const profile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user?._id).select("-password");
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.status(200).json(user);
});

export const updateProfile = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
  const { newName } = req.body;
  if (!newName) {
    return res.status(400).json({ msg: "Missing field to update name" });
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { name: newName },
    { new: true }
  ).select("-password");

  if (!user) return res.status(404).json({ msg: "User not found" });
  await publishToQueue('user-updated',user);
  return res.status(200).json({
    msg: "Updated the name successfully",
    _id: user._id,
    name: user.name,
    email: user.email,
  });
});