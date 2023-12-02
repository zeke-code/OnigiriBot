const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');
const player = useMainPlayer();

player.events.on('playerError', (queue, error) => {
  logger.error(`Something went wrong with ${queue}: ${error}`);
  queue.metadata.channel.send(`Something went wrong while trying to playback ${queue.currentTrack.title}. Skipping!`);
});
