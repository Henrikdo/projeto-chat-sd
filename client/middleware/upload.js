const multer = require('multer');
const storage = multer.memoryStorage(); // we'll upload buffer to Cloudinary
module.exports = multer({ storage });