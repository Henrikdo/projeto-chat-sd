const express = require('express');
const Routes = require('./routes/routes'); // Importing the routes
const app = express();
const PORT = 3000;



app.use(express.json());
app.use("/", Routes); // Using the routes with a base path
// Routes

// Start server
app.listen(PORT, () => {
  console.log(`Client is running at http://localhost:${PORT}`);
});
