import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            port: 5672,
            hostname: process.env.RABBITMQ_HOSTNAME,
            username: process.env.RABBITMQ_USERNAME,
            password: process.env.RABBITMQ_PASSWORD,
        });

        channel = await connection.createChannel();
        console.log("Chat Service -> Connected to RabbitMQ");
    } catch (error) {
        console.log("Failed to connect to RabbitMQ", error);
    }
};

export const getChannel = () => channel;
