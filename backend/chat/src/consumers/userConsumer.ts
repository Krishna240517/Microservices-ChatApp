import { getChannel } from "../config/rabbitmq.js";
import { ChatUser } from "../models/chatUser.model.js";

export const startUserConsumers = async () => {
    const channel = getChannel();
    if (!channel) {
        console.log("RabbitMQ channel not ready for user consumers");
        return;
    }

    // Consume user-created events
    const createdQueue = "user-created";
    await channel.assertQueue(createdQueue, { durable: true });

    channel.consume(createdQueue, async (msg: any) => {
        if (msg) {
            try {
                const userData = JSON.parse(msg.content.toString());
                await ChatUser.findByIdAndUpdate(
                    userData._id,
                    { name: userData.name, email: userData.email },
                    { upsert: true, new: true }
                );
                console.log(`ChatUser synced (created): ${userData.email}`);
                channel.ack(msg);
            } catch (e) {
                console.log("Failed to process user-created event", e);
                channel.nack(msg, false, true);
            }
        }
    });

    // Consume user-updated events
    const updatedQueue = "user-updated";
    await channel.assertQueue(updatedQueue, { durable: true });

    channel.consume(updatedQueue, async (msg: any) => {
        if (msg) {
            try {
                const userData = JSON.parse(msg.content.toString());
                await ChatUser.findByIdAndUpdate(
                    userData._id,
                    { name: userData.name, email: userData.email },
                    { upsert: true, new: true }
                );
                console.log(`ChatUser synced (updated): ${userData.email}`);
                channel.ack(msg);
            } catch (e) {
                console.log("Failed to process user-updated event", e);
                channel.nack(msg, false, true);
            }
        }
    });

    console.log("Chat Service -> User consumers started");
};
