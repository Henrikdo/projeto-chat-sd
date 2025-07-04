const express = require('express')
const router = express.Router()

const user = require('./user')
const messages = require('./messages')

router.use("/user", user)
router.use("/messages", messages)

module.exports = router