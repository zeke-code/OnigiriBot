import { Event } from "../base/Event";
import { BotClient } from "../../client/BotClient";

export default class ReadyEvent extends Event {
  constructor() {
    super("ready", true);
  }

  public async execute(client: BotClient) {
    client.logger.info(`Bot is ready! Logged in as ${client.user?.tag}`);

    client.user?.setPresence({
      activities: [{ name: "yabadabadoo!" }],
      status: "online",
    });
  }
}
