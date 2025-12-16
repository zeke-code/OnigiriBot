import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import logger from "../utils/logger";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "stdout", level: "warn" },
    { emit: "stdout", level: "error" },
  ],
});

const connectToDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("Successfully connected to PostgreSQL database!");
  } catch (error) {
    logger.error(
      `Could not connect to the database: ${(error as Error).message}`,
    );
    process.exit(1);
  }
};

export default connectToDatabase;
