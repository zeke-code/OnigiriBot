import fs from "fs";
import path from "path";
import { Client } from "discord.js";
import logger from "../utils/logger";

interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => void;
}

function readEvents(client: Client, directory: string): void {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readEvents(client, filePath);
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      const event: Event = require(filePath).default || require(filePath);
      logger.info(`Loading event: ${event.name}`);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
}

export default readEvents;
