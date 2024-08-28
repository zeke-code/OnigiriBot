const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const axios = require('axios');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('cat')
      .setDescription('Sends a random cat picture!'),
  async execute(interaction) {
    try {
      const response = await axios.get(
          'https://api.thecatapi.com/v1/images/search',
      );
      const url = response.data[0].url;

      if (!url) {
        throw new Error('No URL found in the response');
      }

      const embed = new EmbedBuilder().setImage(url).setColor('#ffffff');

      await interaction.reply({embeds: [embed]});
    } catch (error) {
      logger.error(
          `Error while trying to retrieve cat image from API: ${error}`,
      );
      await interaction.reply({
        content: 'Something went wrong with the request. Try again.',
        ephemeral: true,
      });
    }
  },
};
