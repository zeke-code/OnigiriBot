import { DiscordjsError, Events } from "discord.js";
import logger from "../utils/logger";

export default {
  name: Events.Error,
  async execute(error: DiscordjsError) {
    logger.error(`A critical error occurred: ${error}`);
  },
};
