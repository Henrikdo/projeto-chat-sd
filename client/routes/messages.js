const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageControler');
const upload = require('../middleware/upload');

router.post('/', upload.single('image'), messageController.sendMessage);

module.exports = router;