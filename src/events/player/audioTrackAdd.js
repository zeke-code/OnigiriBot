const {useMainPlayer} = require('discord-player');

const logger = require('../../utils/logger');
const player = useMainPlayer();

player.events.on('audioTrackAdd', (queue, track) => {
  logger.info(`Add a song requested by ${queue.metadata.requestedBy}`);
});
