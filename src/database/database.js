const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
    logger.info("Connected to MongoDB!");
  } catch (error) {
    logger.error(`Connection to DB could not be established: ${error}`);
  }
};

module.exports = connectToDatabase;
