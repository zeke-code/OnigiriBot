// src/bot/services/ConfigService.ts
import { z } from "zod";

const ConfigSchema = z.object({
  bot: z.object({
    token: z.string(),
    clientId: z.string(),
    ownerId: z.string().optional(),
  }),
  database: z.object({
    url: z.string(),
  }),
  redis: z.object({
    url: z.string(),
  }),
  features: z.object({
    leveling: z.boolean().default(true),
    moderation: z.boolean().default(true),
    music: z.boolean().default(false),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigService {
  private config: Config;

  constructor() {
    this.config = ConfigSchema.parse({
      bot: {
        token: process.env.BOT_TOKEN,
        clientId: process.env.CLIENT_ID,
        ownerId: process.env.OWNER_ID,
      },
      database: {
        url: process.env.DATABASE_URL,
      },
      redis: {
        url: process.env.REDIS_URL || "redis://localhost:6379",
      },
      features: {
        leveling: process.env.FEATURE_LEVELING !== "false",
        moderation: process.env.FEATURE_MODERATION !== "false",
        music: process.env.FEATURE_MUSIC === "true",
      },
    });
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  isFeatureEnabled(feature: keyof Config["features"]): boolean {
    return this.config.features[feature];
  }
}
