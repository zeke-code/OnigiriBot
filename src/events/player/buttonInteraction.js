// buttonInteractionHandler.js
const {Events} = require('discord.js');
const pauseCommand = require('../../commands/music/pause');
const skipCommand = require('../../commands/music/skip');
const stopCommand = require('../../commands/music/stop');
const shuffleCommand = require('../../commands/music/shuffle');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const buttonId = interaction.customId;

    switch (buttonId) {
      case 'pauseresume':
        await pauseCommand.execute(interaction);
        break;
      case 'skip':
        await skipCommand.execute(interaction);
        break;
      case 'stop':
        await stopCommand.execute(interaction);
        break;
      case 'shuffle':
        await shuffleCommand.execute(interaction);
    }
    
  },
};
