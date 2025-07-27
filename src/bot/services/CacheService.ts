// src/bot/services/CacheService.ts
import { createClient, RedisClientType } from "redis";

export class CacheService {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => console.error("Redis Client Error", err));
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.connected) return;
    const data = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, data);
    } else {
      await this.client.set(key, data);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) return;
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }
}
