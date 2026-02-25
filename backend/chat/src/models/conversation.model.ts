import mongoose, { Document, Model } from "mongoose";

export interface IConversation extends Document {
  type: "direct" | "group";

  participants: mongoose.Types.ObjectId[];

  admins: mongoose.Types.ObjectId[]; 

  groupName?: string;
  groupAvatar?: string;

  lastMessage?: string;
  lastMessageAt?: Date;

  unreadCounts: Map<string, number>;

  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new mongoose.Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    groupName: {
      type: String,
      trim: true,
    },

    groupAvatar: {
      type: String,
      default: "",
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
    },

    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation: Model<IConversation> = mongoose.model("Conversation", conversationSchema);