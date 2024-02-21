const {Events} = require('discord.js');
const commands = {
  pauseresume: require('../../commands/music/pause'),
  skip: require('../../commands/music/skip'),
  stop: require('../../commands/music/stop'),
  shuffle: require('../../commands/music/shuffle'),
  previous: require('../../commands/music/previous'),
  volume: require('../../commands/music/volume'),
};

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const buttonId = interaction.customId;
    const command = commands[buttonId];

    if (command) {
      await command.execute(interaction);
    }
  },
};
