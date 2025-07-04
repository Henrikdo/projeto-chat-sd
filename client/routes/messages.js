const router = require('express').Router();

const messageController = require('../controllers/messageControler');


router.post('/', (req, res) => {
    messageController.sendMessage(req, res);
});


module.exports = router;