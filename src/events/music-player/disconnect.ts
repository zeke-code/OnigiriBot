import { useMainPlayer } from "discord-player";
import { TextChannel } from "discord.js";
import logger from "../../utils/logger";

const player = useMainPlayer();

if (player) {
  player.events.on("disconnect", async (queue) => {
    try {
      const channel = queue.metadata?.channel as TextChannel | undefined;

      if (channel) {
        await channel.send(
          "Looks like my job here is done. Leaving the channel!"
        );
      } else {
        logger.warn("No channel found in metadata.");
      }
    } catch (e) {
      logger.error(`Error while trying to disconnect from a channel: ${e}`);
    }
  });
} else {
  logger.error("Player instance not available.");
}
