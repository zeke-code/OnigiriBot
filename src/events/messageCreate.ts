import { Events, Message } from "discord.js";
import logger from "../utils/logger";

export default {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot) {
      return;
    }
  },
};
