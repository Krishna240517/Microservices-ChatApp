import { createClient } from "redis";
import "dotenv/config";
export const redisClient = createClient({
    url: process.env.REDIS_URL!,
    socket: {
        tls: true
    }
});

export const connectRedis = () => {
    redisClient.connect().then(() => {
        console.log("Chat Service -> Connected to Redis");
    }).catch((e) => {
        console.log('redis error');
        console.error(e);
    });
};
