const admin = require('../firebase');
const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const streamifier = require("streamifier");


const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const userController = {
    userLogin: async (req, res) => {

        const { email, password } = req.body;
        console.log("User login attempt with email:", email);
        try {
            const response = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
                {
                    email,
                    password,
                    returnSecureToken: true
                }
            );
            res.status(200).json({
                message: "Login successful",
                data: response.data
            });
            return response.data;
        } catch (error) {
            const message = error.message || 'Unknown error';
            if (error.status === 400 ){
                console.error("Invalid Email or Password",error);
                res.status(400).json({ error: "Invalid Email or Password" });
            }else{
                res.status(500).json({ error: `Error during login: ${message}` });
            }
        }
        
    },
    userUpdate: async (req, res) => {
        const { tokenId, displayName } = req.body;
        console.log("User update attempt with tokenId:", tokenId);
        try {
            const decodedToken = await admin.auth().verifyIdToken(tokenId);
            const uid = decodedToken.uid;

            await admin.auth().updateUser(uid, {
                displayName
            });

            res.status(200).json({
                message: "User updated successfully",
                data: { uid, displayName }
            });
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ error: "Error updating user" });
        }
    },
    userUpdateImage: async (req, res) => {
        const { tokenId, displayName } = req.body;
        const fileBuffer = req.file?.buffer;

        if (!tokenId) return res.status(400).json({ error: "tokenId is required" });
        if (!fileBuffer) return res.status(400).json({ error: "Image file is required" });

        try {
            const decodedToken = await admin.auth().verifyIdToken(tokenId);
            const uid = decodedToken.uid;

            const userRecord = await admin.auth().getUser(uid);
            const oldPhotoURL = userRecord.photoURL;

            let publicId = null;
            if (oldPhotoURL) {
            const regex = /\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)$/i;
            const match = oldPhotoURL.match(regex);
            if (match && match[1]) {
                publicId = match[1];
            }
            }

            // Deleta a imagem antiga
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (deleteError) {
                    console.error("Erro ao deletar imagem antiga:", deleteError);
                    return res.status(500).json({ error: "Falha ao deletar imagem antiga" });
                }
            }

            const uploadResult = await uploadToCloudinary(fileBuffer);
            const photoURL = uploadResult.secure_url;
            
            await admin.auth().updateUser(uid, {
            displayName,
            photoURL,
            });
            await axios.put('http://localhost:8000/messages/update-photo', {
            uuid: uid,
            new_photo_url: photoURL,
            });
            res.status(200).json({
            message: "User updated successfully",
            data: { uid, displayName, photoURL },
            });
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ error: "Error updating user" });
        }
    },
    userVerifyLogin: async (req, res) => {
        const { tokenId } = req.body;

        try {
            const decoded = await admin.auth().verifyIdToken(tokenId);
            console.log("User verified with UID:", decoded.uid);
            res.json({ valid: true, uid: decoded.uid, name: decoded.name });
        } catch (err) {
            res.status(401).json({ valid: false });
        }
    },
    getUserPhoto: async (req, res) => {
        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'UID is required' });
        }

        try {
            const userRecord = await admin.auth().getUser(uid);
            const { photoURL, displayName } = userRecord;

            res.status(200).json({
                success: true,
                photoURL,
                displayName
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(404).json({ success: false, message: "User not found" });
        }
    }
}


module.exports = userController;