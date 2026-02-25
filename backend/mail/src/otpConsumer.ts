import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendOtpConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol:"amqp",
            port:5672,
            username:process.env.RABBITMQ_USERNAME,
            hostname:process.env.RABBITMQ_HOSTNAME,
            password:process.env.RABBITMQ_PASSWORD
        });

        const channel = await connection.createChannel();
        const queueName='send-otp';

        await channel.assertQueue(queueName, {durable: true});

        console.log("Mail Service -> Connected to RabbitMQ");

        channel.consume(queueName, async(msg) => {
            if(msg) {
                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString());
                    const transporter = nodemailer.createTransport({
                        host:"smtp.gmail.com",
                        port:465,
                        secure: true,
                        auth: {
                            user: process.env.NODEMAILER_USER,
                            pass: process.env.NODEMAILER_PASS
                        }
                    });

                    await transporter.sendMail({
                        from:"Chat App",
                        to,
                        subject,
                        text: body
                    });

                    console.log(`OTP sent successfully to ${to}`);

                    channel.ack(msg);
                } catch (e) {
                    console.log('Failed to send OTP')
                    console.log(e);
                }
            }
        })
    } catch (error) {
        console.log("Failed to connect to RABBITMQ");
        console.log(error);
    }
}