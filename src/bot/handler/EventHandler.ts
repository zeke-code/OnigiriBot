import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../client/BotClient";
import { Event } from "../events/base/Event";

export class EventHandler {
  private client: BotClient;

  constructor(client: BotClient) {
    this.client = client;
  }

  public async loadEvents() {
    const eventsPath = join(__dirname, "..", "events");
    const eventFolders = readdirSync(eventsPath);

    for (const folder of eventFolders) {
      if (folder === "base") continue;

      const folderPath = join(eventsPath, folder);
      const eventFiles = readdirSync(folderPath).filter(
        (file) => file.endsWith(".event.ts") || file.endsWith(".event.js")
      );

      for (const file of eventFiles) {
        const filePath = join(folderPath, file);
        const EventClass = require(filePath).default;

        if (EventClass && EventClass.prototype instanceof Event) {
          const event = new EventClass();

          if (event.once) {
            this.client.once(event.name, (...args) =>
              event.execute(this.client, ...args)
            );
          } else {
            this.client.on(event.name, (...args) =>
              event.execute(this.client, ...args)
            );
          }

          this.client.logger.info(`Loaded event: ${event.name}`);
        }
      }
    }
  }
}
