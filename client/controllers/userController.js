const admin = require('../firebase');
const axios = require('axios');



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
    }
}


module.exports = userController;