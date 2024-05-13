const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skip the current track playing in the playlist!'),
  async execute(interaction) {
    if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
      return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});
    }
    const queue = useQueue(interaction.guildId);
    if (!queue) return interaction.reply({content: 'There doesn\'t seem to be any active playlist in this server.', ephemeral: true});
    const currentTrack = queue.currentTrack;
    try {
      queue.node.skip();
      if (queue.isEmpty()) queue.delete();

      const userAvatar = interaction.member.displayAvatarURL({dynamic: true, size: 1024});

      const embed = new EmbedBuilder()
          .setAuthor({
            name: `${interaction.member.user.username}`,
            iconURL: userAvatar,
          })
          .setDescription(`**${interaction.member}** skipped **${currentTrack}**`);
      
      if (track.thumbnail && track.thumbnail.trim() !== '') {
        embed.setThumbnail(track.thumbnail);
      }

      await interaction.reply({embeds: [embed]});
    } catch (e) {
      logger.error(`Something went wrong while trying to skip a song: ${e}`);
      return await interaction.reply('Something went wrong while trying to skip song. Try again later!');
    }
  },
};
