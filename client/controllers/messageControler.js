const amqp = require('amqplib');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier'); // você precisa instalar isso: npm install streamifier
const admin = require('../firebase');

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

const validateToken = async (tokenId) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(tokenId);

        // Se quiser, pode verificar claims personalizados, por exemplo:
        // if (decodedToken.role !== "chatUser") return null;

        return decodedToken; // usuário autenticado
    } catch (error) {
        console.error("Token inválido:", error.message);
        return null;
    }
};
const messageController = {
        sendMessage: async (req, res) => {
            const conn = await amqp.connect('amqp://localhost');
            const ch = await conn.createChannel();
            const queue = 'chat-messages';
            const { queue: replyQueue } = await ch.assertQueue('', { exclusive: true });
            const correlationId = Math.random().toString();

            if (!req.body.tokenId) {
                return res.status(400).json("No tokenId provided");
            }
            
            if (!(await validateToken(req.body.tokenId))) {
                return res.status(401).json({ error: "Invalid token" });
            }

            let contentToSend = {
                tokenId: req.body.tokenId,
                message: req.body.message || null,
                imageUrl: null
            };
            if (req.file) {
                 try {
                    const result = await uploadToCloudinary(req.file.buffer);
                    contentToSend.imageUrl = result.secure_url;

                    ch.sendToQueue(queue, Buffer.from(JSON.stringify(contentToSend)), {
                        replyTo: replyQueue,
                        correlationId
                    });
                    console.log('Message with image sent:', result.secure_url);
                } catch (err) {
                    return res.status(500).json({ error: "Image upload failed", details: err });
                }
            }else {
                ch.sendToQueue(queue, Buffer.from(JSON.stringify(contentToSend)), {
                    replyTo: replyQueue,
                    correlationId
                });
                console.log('Message sent without image');
            }

            ch.consume(replyQueue, async (msg) => {
                if (msg.properties.correlationId === correlationId) {
                    console.log("Response from server:", msg.content.toString());
                    await ch.close();
                    await conn.close();
                }
            }, { noAck: true });

            return res.status(200).json({
                message: "Message sent successfully",
                data: contentToSend
            });
        }
}

module.exports = messageController;
