const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('whisper')
      .setDescription('I will send your message anonymously in a text channel!')
      .addStringOption((option) =>
        option.setName('message')
            .setDescription('Your anonymous message!')
            .setMaxLength(500)
            .setRequired(true)),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    try {
      const embed = new EmbedBuilder()
          .setColor('#ffffff')
          .setTitle('Someone whispered...')
          .setDescription(message)
          .setTimestamp();
      await interaction.channel.send({embeds: [embed]});
      await interaction.reply({content: 'Your whisper has been sent!', ephemeral: true});
    } catch (e) {
      await interaction.reply({content: 'Something went wrong. Try again!', ephemeral: true});
      logger.error(`Something went wrong while trying to whisper a message: ${e}`);
      return;
    }
  },
};
