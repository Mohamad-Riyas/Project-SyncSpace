require("dotenv").config();
const mongoose = require("mongoose");

console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection SUCCESS");
    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB connection FAILED");
    console.error(err.message);
    process.exit(1);
  });