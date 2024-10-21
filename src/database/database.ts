import mongoose from "mongoose";
import logger from "../utils/logger";

const connectToDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MongoDB connection string is not defined in the environment variables."
    );
  }

  try {
    await mongoose.connect(mongoUri, {});
    logger.info("Connected to MongoDB!");
  } catch (error) {
    logger.error(
      `Connection to DB could not be established: ${(error as Error).message}`
    );
  }
};

export default connectToDatabase;
