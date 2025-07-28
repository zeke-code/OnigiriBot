import { useMainPlayer } from "discord-player";
import { TextChannel } from "discord.js";
import logger from "../../../utils/logger";

const player = useMainPlayer();

if (player) {
  player.events.on("error", (queue, error: Error) => {
    console.log("Error while using discord-player. Logging error.");

    logger.error(
      `General error while using discord-player in guild ${queue.guild.id}: ${error.message}`
    );

    const channel = queue.metadata?.channel as TextChannel | undefined;

    if (channel) {
      channel.send(
        "The music player has encountered an error... try again later."
      );
    } else {
      logger.warn("No channel found in metadata.");
    }
  });
} else {
  logger.error("Player instance not available.");
}
