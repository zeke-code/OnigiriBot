const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');
const player = useMainPlayer();

player.events.on('disconnect', async (queue) => {
  try {
    await queue.metadata.channel.send(
        'Looks like my job here is done. Leaving the channel!',
    );
  } catch (e) {
    logger.error(`Error while trying to disconnect from a channel: ${e}`);
  }
});
