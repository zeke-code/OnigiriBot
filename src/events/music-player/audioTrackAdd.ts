import { Player, useMainPlayer } from "discord-player";

import logger from "../../utils/logger";
const player: Player | undefined = useMainPlayer();

player.events.on("audioTrackAdd", (queue, track) => {
  logger.info(`Add a song requested by ${queue.metadata.requestedBy}`);
});
