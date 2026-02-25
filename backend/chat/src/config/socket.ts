import { Server } from "socket.io";
import express from "express";
import http from "http";
import { redisClient } from "./redis.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
});

const userSocketMap = new Map<string, Set<string>>();


export function getReceiverSocketId(userId: string): string[] {
    return [...(userSocketMap.get(userId) || [])];
}

export function isUserOnline(userId: string): boolean {
    return userSocketMap.has(userId) && userSocketMap.get(userId)!.size > 0;
}

const emitOnlineUsers = () => {
    io.emit('getOnlineUsers', [...userSocketMap.keys()]);
}

io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    console.log(`A user connected: ${socket.id}`);
    if (!userId) {
        console.log('No userId provided');
        socket.disconnect(true);
        return;
    }
    if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
    }

    userSocketMap.get(userId)!.add(socket.id);
    socket.join(userId);

    emitOnlineUsers();

    socket.on('typing', (data: { conversationId: string; receiverIds: string[] }) => {
        data.receiverIds.forEach((receiverId) => {
            if (receiverId !== userId) {
                io.to(receiverId).emit('userTyping', {
                    conversationId: data.conversationId,
                    userId: userId,
                });
            }
        });
    });

    socket.on('stopTyping', (data: { conversationId: string; receiverIds: string[] }) => {
        data.receiverIds.forEach((receiverId) => {
            if (receiverId !== userId) {
                io.to(receiverId).emit('userStopTyping', {
                    conversationId: data.conversationId,
                    userId: userId,
                });
            }
        });
    });

    socket.on('disconnect', async (reason) => {
        const sockets = userSocketMap.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                userSocketMap.delete(userId);
                try {
                    await redisClient.set(`lastSeen:${userId}`, new Date().toISOString());
                } catch (e) {
                    console.log("Failed to store last seen", e);
                }
            }
        }
        emitOnlineUsers();
        console.log(`Disconnected User: ${socket.id}: ${reason}`);
    });
});

export { io, app, server };
