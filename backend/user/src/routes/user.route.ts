import express from "express";
import { login, logout, signup, profile, updateProfile, verifyOTP } from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/isAuth.js";
const router = express.Router();

router.post('/signup',signup);
router.post('/login',login);
router.post('/logout',logout);
router.get('/profile',isAuth, profile);
router.patch('/update',isAuth, updateProfile);
router.post('/verify-otp',verifyOTP);

export default router;