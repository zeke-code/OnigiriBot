const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');
const player = useMainPlayer();


player.events.on('playerSkip', (queue, track) => {
  try {
  } catch (e) {
    logger.error(`Tried to skip song but this happened: ${e}`);
  }
});
