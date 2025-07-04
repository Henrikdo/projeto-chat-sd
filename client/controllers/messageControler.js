const amqp = require('amqplib');



const messageController = {
    sendMessage:async (req, res) => {
        const conn = await amqp.connect('amqp://localhost');
        const ch = await conn.createChannel();
        const queue = 'chat-messages';
        const { queue: replyQueue } = await ch.assertQueue('', { exclusive: true });
        const correlationId = Math.random().toString();
        

        if (!req.body || !req.body.message) {
            return res.status(400).json("No message provided");
        }
        if(!req.body.tokenId) {
            return res.status(400).json("No token not provided");
        }

        ch.consume(replyQueue, async (msg)=> {
        if (msg.properties.correlationId === correlationId) {
                console.log("Response from server:", msg.content.toString());
                await ch.close();
                await conn.close();
            }
        }, { noAck: true });

        ch.sendToQueue(queue, Buffer.from(JSON.stringify(req.body)), {
            replyTo: replyQueue,
            correlationId
        });

        console.log('Message sent');

        return res.status(200).json({
            message: "Message sent successfully",
            data: req.body
        });
    }
}


module.exports = messageController;