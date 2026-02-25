import express from "express";
import dotenv from "dotenv";
import { sendOtpConsumer } from "./otpConsumer.js";
dotenv.config();



const app = express();
const port = process.env.PORT;

sendOtpConsumer();

app.listen(port,() => {
    console.log(`Successfully Connected to the PORT${port}`);
});

