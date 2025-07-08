const express = require('express');
const Routes = require('./routes/routes'); // Importing the routes
const cors = require("cors");
const app = express();
const PORT = 3003;

app.use(cors({
  origin: "http://localhost:3000", // or "*" to allow all (not recommended for production)
  credentials: true
}));

app.use(express.json());
app.use("/", Routes); // Using the routes with a base path

// Routes

// Start server
app.listen(PORT, () => {
  console.log(`Client is running at http://localhost:${PORT}`);
});
