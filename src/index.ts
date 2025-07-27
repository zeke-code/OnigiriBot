import "dotenv/config";
import { BotClient } from "./bot/client/BotClient";
import { DatabaseManager } from "./database/DatabaseManager";
import { LoggerService } from "./bot/services/LoggerService";
import { CommandHandler } from "./bot/handler/CommandHandler";
import { EventHandler } from "./bot/handler/EventHandler";
import { IntentsBitField } from "discord.js";

const logger = new LoggerService();

async function bootstrap() {
  try {
    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.connect();

    // Create bot client
    const client = new BotClient({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
      ],
    });

    // Load handlers
    const commandHandler = new CommandHandler(client);
    const eventHandler = new EventHandler(client);

    await commandHandler.loadCommands();
    await eventHandler.loadEvents();

    // Login
    await client.login(process.env.BOT_TOKEN);

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down...");
      client.destroy();
      await dbManager.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start bot", error);
    process.exit(1);
  }
}

bootstrap();
