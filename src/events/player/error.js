const { Player, useMainPlayer } = require('discord-player');
const logger = require('../../utils/logger');

const player = useMainPlayer();

// Add an error event listener to the player
player.on('error', (queue, error) => {
    logger.error(`There was a problem in the queue ${queue.guild.name}, logging error.`);
    console.log(`There was a problem in the queue ${queue.guild.name}: ${error.message}`);
    // You can add more error handling logic here
});
