const router = require('express').Router();
const userController = require('../controllers/userController');



router.post('/login', (req, res) => {
    userController.userLogin(req, res);
});

router.post('/verifyLogin', (req, res) => {
    userController.userVerifyLogin(req, res);
});

router.put('/', (req, res) => {
    userController.userUpdate(req, res);
});


module.exports = router;