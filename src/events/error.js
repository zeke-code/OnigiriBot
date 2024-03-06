const {Events} = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.Error,
  async execute(interaction, error) {
    logger.error(`A critical error occurred: ${error}`);
  },
};
