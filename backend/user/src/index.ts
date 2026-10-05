import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { connectRedis } from "./config/redis.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route.js";
const app = express();
const port = process.env.PORT!;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/user', userRoutes);
connectRabbitMQ();
connectRedis();
const main = async () => {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        })
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
main();