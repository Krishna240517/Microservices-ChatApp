import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { app, server } from "./config/socket.js";
import connectDB from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { connectRedis } from "./config/redis.js";
import { startUserConsumers } from "./consumers/userConsumer.js";
import chatRoutes from "./routes/chat.route.js";

dotenv.config();

const port = process.env.PORT;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api/v1/chat', chatRoutes);

const main = async () => {
    try {
        await connectDB();
        await connectRabbitMQ();
        connectRedis();
        await startUserConsumers();
        server.listen(port, () => console.log(`Chat Server running on port ${port}`));
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};
main();