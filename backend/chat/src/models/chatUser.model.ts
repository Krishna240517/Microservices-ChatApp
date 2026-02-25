import mongoose, { Document, Model } from "mongoose";

export interface IChatUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
}

const chatUserSchema = new mongoose.Schema<IChatUser>({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
}, { timestamps: true });

export const ChatUser: Model<IChatUser> = mongoose.model<IChatUser>("ChatUser", chatUserSchema);
