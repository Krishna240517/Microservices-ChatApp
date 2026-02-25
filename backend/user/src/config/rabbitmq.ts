import amqp from "amqplib";


let channel:amqp.Channel;

export const connectRabbitMQ = async() => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            port: 5672,
            hostname: process.env.RABBITMQ_HOSTNAME,
            username: process.env.RABBITMQ_USERNAME,
            password: process.env.RABBITMQ_PASSWORD,
        });

        channel = await connection.createChannel();
        console.log('Successfully Connected to RabbitMQ');
    } catch (error) {
        console.log('Failed to connect to RabbitMQ',error);
    }
};

export const publishToQueue = async(queueName: string, message: any) => {
    if(!channel) {
        console.log('RabbitMQ channel is not initialized');
        return;
    }
    await channel.assertQueue(queueName, {durable: true});

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)),{
        persistent: true
    });
}