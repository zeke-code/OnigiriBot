const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('pause')
      .setDescription('Pauses/unpauses the music player!'),
  async execute(interaction) {
    if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !==
        interaction.guild.members.me.voice.channelId
    ) {
      return interaction.reply({
        content: 'You are not in my voice channel!',
        ephemeral: true,
      });
    }
    queue = useQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        content: 'There doesn\'t seem to be any active playlist in this server.',
        ephemeral: true,
      });
    }
    await interaction.deferReply();
    const userAvatar = interaction.member.displayAvatarURL({
      dynamic: true,
      size: 1024,
    });

    const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.member.user.displayName}`,
          iconURL: userAvatar,
        })
        .setColor('LightGrey');

    try {
      const action = queue.node.isPaused() ? 'unpaused' : 'paused';
      queue.node.isPaused() ? queue.node.resume() : queue.node.pause();
      embed.setDescription(
          `${interaction.member.user} ${action} the music player.`,
      );
      await interaction.followUp({embeds: [embed]});
    } catch (e) {
      await interaction.followUp(
          `Something went wrong while trying to pause the player. Try again.`,
      );
      logger.error(
          `Something went wrong while trying to pause the player in guold ${interaction.guildId}: ${e}`,
      );
    }
  },
};
