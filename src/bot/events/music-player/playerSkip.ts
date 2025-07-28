import { useMainPlayer, Track } from "discord-player";
import logger from "../../../utils/logger";

const player = useMainPlayer();

if (player) {
  player.events.on("playerSkip", (queue, track: Track) => {
    try {
    } catch (e) {
      logger.error(
        `Tried to skip song but this happened: ${(e as Error).message}`
      );
    }
  });
} else {
  logger.error("Player instance is not available.");
}
