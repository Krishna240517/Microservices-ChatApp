import mongoose from "mongoose";
import { cloudinary } from "../config/cloudinary.js";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ChatUser } from "../models/chatUser.model.js";
import { redisClient } from "../config/redis.js";
import { io, getReceiverSocketId } from "../config/socket.js";
import type { Response } from "express";

export const createDirectConversation = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const myId = req.user?._id;
    const { id: otherUserId } = req.params;

    if (!myId) return res.status(401).json({ message: "Unauthorized" });
    if (!otherUserId) return res.status(400).json({ message: "User ID is required" });


    let conversation = await Conversation.findOne({
        type: "direct",
        participants: { $all: [myId, otherUserId], $size: 2 },
    });
    if (!conversation) {
        conversation = new Conversation({
            type: "direct",
            participants: [myId, otherUserId],
            unreadCounts: {
                [myId!.toString()]: 0,
                [otherUserId.toString()]: 0
            },
        });
        await conversation.save();

        // Notify the other user about the new conversation
        const receiverSockets = getReceiverSocketId(otherUserId.toString());
        if (receiverSockets.length > 0) {
            io.to(otherUserId.toString()).emit("newConversation", conversation);
        }
    }

    res.status(200).json(conversation);
});


export const createGroupConversation = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const { groupName, participantIds } = req.body;
    const creator = req.user?._id!;

    const allParticipants = [creator, ...(participantIds || [])];

    const unreadCounts: Record<string, number> = {};
    allParticipants.forEach((id: any) => {
        unreadCounts[id.toString()] = 0;
    });

    const conversation = await Conversation.create({
        type: "group",
        groupName,
        participants: allParticipants,
        admins: [creator],
        unreadCounts
    });

    // Notify all participants about the new group
    allParticipants.forEach((pId: any) => {
        if (pId.toString() !== creator!.toString()) {
            io.to(pId.toString()).emit("newConversation", conversation);
        }
    });

    res.status(200).json(conversation);
});

export const getUserConversations = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id!;
    const userIdstr = userId.toString();

    const conversations = await Conversation.find({
        participants: userId
    }).sort({ lastMessageAt: -1 }).lean();

    // Get all unique participant IDs
    const allParticipantIds = new Set<string>();
    conversations.forEach(conv => {
        conv.participants.forEach((p: any) => allParticipantIds.add(p.toString()));
    });

    // Fetch user details from ChatUser
    const users = await ChatUser.find({
        _id: { $in: [...allParticipantIds] }
    }).lean();

    const userMap = new Map<string, any>();
    users.forEach(u => userMap.set(u._id.toString(), u));

    const formattedConversation = conversations.map((conv) => {
        const unread = conv.unreadCounts?.get?.(userIdstr) ?? 0;
        const participantsWithInfo = conv.participants.map((p: any) => {
            const pId = p.toString();
            const userInfo = userMap.get(pId);
            return {
                _id: pId,
                name: userInfo?.name || "Unknown",
                email: userInfo?.email || "",
            };
        });

        return {
            _id: conv._id,
            type: conv.type,
            participants: participantsWithInfo,
            admins: conv.admins,
            groupName: conv.groupName,
            groupAvatar: conv.groupAvatar,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: unread,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
        };
    })

    res.status(200).json(formattedConversation);
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const conversationId = req.params.id;
    const senderId = req.user?._id;
    const { text, image } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ msg: "Not found" });


    const messageData: any = {
        conversationId: conversationId,
        senderId: senderId,
        text: text,
        seenBy: [senderId]
    }
    if (image) {
        const imgResult = await cloudinary.uploader.upload(image, { folder: "messages" });
        const imgUrl = imgResult.secure_url;
        messageData.image = imgUrl;
    }

    const message = await Message.create(messageData);

    conversation.participants.forEach((userId) => {
        if (userId.toString() !== senderId?.toString()) {
            const current = conversation.unreadCounts.get(userId.toString()) || 0;
            conversation.unreadCounts.set(userId.toString(), current + 1);
        }
    });

    conversation.lastMessage = text || (image ? "📷 Image" : "");
    conversation.lastMessageAt = new Date();

    await conversation.save();

    conversation.participants.forEach((userId) => {
        if (userId.toString() !== senderId?.toString()) {
            io.to(userId.toString()).emit("newMessage", {
                message,
                conversationId,
            });
            const unread = conversation.unreadCounts.get(userId.toString()) || 0;
            io.to(userId.toString()).emit("conversationUpdated", {
                conversationId,
                lastMessage: conversation.lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                unreadCount: unread,
            });
        }
    });

    res.status(201).json({ message });
});

export const getMessages = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const conversationId = new mongoose.Types.ObjectId(req.params.id as string);
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

    res.json({ messages: messages.reverse() });
});



export const markConversationAsSeen = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const conversationId = new mongoose.Types.ObjectId(req.params.id as string);
    const userId = req.user?._id!;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) return res.status(404).json({ msg: "Not Found" });

    conversation.unreadCounts.set(userId.toString(), 0);

    await conversation.save();

    await Message.updateMany(
        {
            conversationId,
            seenBy: { $ne: userId }
        },
        {
            $push: { seenBy: userId },
        }
    );

    conversation.participants.forEach((pId) => {
        if (pId.toString() !== userId.toString()) {
            io.to(pId.toString()).emit("messageSeen", {
                conversationId: conversationId.toString(),
                seenBy: userId.toString(),
            });
        }
    });

    res.json({ message: "Marked as seen" });
});


export const addMember = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const conversationId = new mongoose.Types.ObjectId(req.params.id as string);
    const requester = req.user?._id!;
    const { otherUserId } = req.body;

    const convo = await Conversation.findById(conversationId);

    if (!convo?.admins.includes(requester)) {
        return res.status(403).json({ msg: "Admin Only" })
    }

    convo.participants.push(otherUserId);
    await convo.save();

    io.to(otherUserId.toString()).emit("newConversation", convo);

    res.status(200).json({ msg: "User Added to the Group" });
});

export const removeMember = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const conversationId = new mongoose.Types.ObjectId(req.params.conversationId as string);
    const otherUserId = req.params.userId!;
    const currentUserId = req.user?._id!;

    const convo = await Conversation.findById(conversationId);
    if (!convo?.admins.includes(currentUserId)) {
        return res.status(403).json({ msg: "Admin Only" });
    };

    await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { participants: otherUserId }
    });

    io.to(otherUserId.toString()).emit("removedFromGroup", { conversationId: conversationId.toString() });

    res.json({ message: "Member removed" });

});


export const leaveGroup = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const conversationId = new mongoose.Types.ObjectId(req.params.conversationId as string);
    const userId = req.user?._id!;

    await Conversation.findByIdAndUpdate(conversationId, {
        $pull: {
            participants: userId
        }
    });

    res.json({
        message: "Left Group"
    });
});



export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const myId = req.user?._id!;
    const users = await ChatUser.find({ _id: { $ne: myId } }).select("name email").lean();
    res.status(200).json(users);
});

export const searchUsers = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const myId = req.user?._id!;
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({ msg: "Search query is required" });
    }

    const users = await ChatUser.find({
        _id: { $ne: myId },
        $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
        ]
    }).select("name email").lean();

    res.status(200).json(users);
});

export const getLastSeen = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const lastSeen = await redisClient.get(`lastSeen:${userId}`);
    res.json({ lastSeen: lastSeen || null });
});
