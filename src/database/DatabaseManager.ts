import { PrismaClient } from "@prisma/client";
import { LoggerService } from "../bot/services/LoggerService";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private logger: LoggerService;

  private constructor() {
    this.logger = new LoggerService();
    this.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["warn", "error"],
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.info("Database connected successfully");
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    this.logger.info("Database disconnected");
  }

  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}

export const db = DatabaseManager.getInstance().getClient();
