import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import { Client } from "discord.js";
import logger from "../../utils/logger";

const requireModule = createRequire(__filename);

interface Event {
  name: string;
  once?: boolean;
  execute: (...args: unknown[]) => void;
}

async function readEvents(client: Client, directory: string): Promise<void> {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await readEvents(client, filePath);
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      try {
        const eventModule = requireModule(filePath);

        const event: Event = eventModule.default || eventModule;

        logger.info(`Loading event: ${event.name}`);

        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
      } catch (error) {
        logger.error(`Error loading event ${filePath}:`, error);
      }
    }
  }
}

export default readEvents;
