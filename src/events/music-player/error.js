const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');
const player = useMainPlayer();


player.events.on('error', (queue, error) => {
    console.log('Error while using discord-player. Logging error.');
    logger.error(`General error while using discord-player in guild ${queue.guild.guildId}: ${error}`);
    queue.metadata.channel.send('The music player has encountered an error... try again later.');
})
