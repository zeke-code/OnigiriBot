import { Client, Events, ActivityType } from "discord.js";
import logger from "../../utils/logger";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client): void {
    logger.info(`Ready! Logged in as ${client.user?.tag}`);
    client.user?.setActivity("Glad to serve you! (˶ᵔ ᵕ ᵔ˶)", {
      type: ActivityType.Custom,
    });
  },
};
