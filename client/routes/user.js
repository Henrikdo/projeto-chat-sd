const router = require('express').Router();
const userController = require('../controllers/userController');
const multer = require("multer");
const upload = multer();

router.post('/login', (req, res) => {
    userController.userLogin(req, res);
});

router.post('/verifyLogin', (req, res) => {
    userController.userVerifyLogin(req, res);
});

router.put('/', (req, res) => {
    userController.userUpdate(req, res);
});

router.put('/updateUserImage', upload.single('image'), (req, res) => {
    userController.userUpdateImage(req, res);
});

module.exports = router;
