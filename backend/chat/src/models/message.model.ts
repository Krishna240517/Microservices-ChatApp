import mongoose, {Model, Document} from "mongoose";

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId,
    senderId: mongoose.Types.ObjectId,
    text?:string;
    image?:string;
    seenBy:mongoose.Types.ObjectId[],
    createdAt: Date;
    updatedAt: Date;
};

const messageSchema = new mongoose.Schema<IMessage>({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    text: {
        type: String,
        default:"",
        trim: true
    },
    image: {
        type: String,
        default:""
    },
    seenBy: [
        {
            type: mongoose.Schema.Types.ObjectId
        }
    ]
},{timestamps: true});

messageSchema.index({conversationId: 1,createdAt: -1});

export const Message:Model<IMessage> = mongoose.model<IMessage>("Message",messageSchema);

