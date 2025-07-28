import { GuildQueue, Player, useMainPlayer } from "discord-player";
import { QueueMetadata } from "../../../types/QueueMetadata";
import logger from "../../../utils/logger";

const player: Player | undefined = useMainPlayer();

if (player) {
  player.events.on(
    "playerError",
    (queue: GuildQueue<QueueMetadata>, error: Error) => {
      logger.error(
        `Something went wrong with queue in guild ${queue.guild.name}: ${error.message}`
      );

      const channel = queue.metadata?.textChannel;
      const currentTrack = queue.currentTrack;

      if (channel) {
        if (currentTrack) {
          channel.send(
            `Something went wrong while trying to playback ${currentTrack.title}. Skipping!`
          );
        } else {
          channel.send(
            "Something went wrong, but there is no track currently playing."
          );
        }
      } else {
        logger.warn(
          "No valid channel found in the queue metadata to send the error message."
        );
      }
    }
  );
} else {
  logger.error("Player instance is not available.");
}
