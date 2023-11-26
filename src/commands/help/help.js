const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Gives you a list of things that I can do!'),
  async execute(interaction) {
    const commands = interaction.client.commands;

    const helpEmbed = new EmbedBuilder()
        .setColor('#f5f7f5')
        .setTitle('🍙OnigiriBot Help🍙')
        .setImage('https://i.ibb.co/2tYNK54/Oni-Avatar.png')
        .setFooter({text: '🍙 I\'ll be happy to assist you at the best of my abilities! 🍙'});

    commands.forEach((command) => {
      // Assuming each command has a 'data' property with 'name' and 'description'
      helpEmbed.addFields({name: `/${command.data.name}`, value: command.data.description});
    });

    await interaction.reply({embeds: [helpEmbed], ephemeral: true});
  },
};
