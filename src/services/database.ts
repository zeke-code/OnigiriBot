import { PrismaClient } from "../generated/prisma";
import logger from "../utils/logger";

export const prisma = new PrismaClient({
  log: [
    { emit: "stdout", level: "warn" },
    { emit: "stdout", level: "error" },
  ],
});

/**
 * Connects to the database by sending a test query.
 * If it fails, the application will exit.
 */
const connectToDatabase = async (): Promise<void> => {
  try {
    // prisma.$connect() establishes the connection pool.
    await prisma.$connect();
    logger.info("Successfully connected to PostgreSQL database!");
  } catch (error) {
    logger.error(
      `Could not connect to the database: ${(error as Error).message}`,
    );
    // If the database isn't available, the bot can't run.
    process.exit(1);
  }
};

export default connectToDatabase;
