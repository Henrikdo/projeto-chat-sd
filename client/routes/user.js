const router = require('express').Router();
const userController = require('../controllers/userController');



router.post('/', (req, res) => {
    userController.userLogin(req, res);
});

router.put('/', (req, res) => {
    userController.userUpdate(req, res);
});


module.exports = router;