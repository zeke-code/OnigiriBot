const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useMainPlayer, QueryType, useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play music by writing the link/name of the song!')
      .addStringOption((option) =>
        option.setName('song')
            .setDescription('I\'ll search for the title you provide me! (Links supported as well!)')
            .setRequired(true)),
  async execute(interaction) {
    const player = useMainPlayer();
    if (!interaction.member.voice.channel) return interaction.reply({content: 'You need to be connected to a voice channel to use this command.', ephemeral: true});
    if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
      return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});
    }
    await interaction.deferReply();
    const query = interaction.options.getString('song', true);
    let queue = useQueue(interaction.guildId);

    if (!queue) {
      queue = player.nodes.create(interaction.guild, {
        metadata: {
          voiceChannel: interaction.member.voice.channel,
          channel: interaction.channel,
          requestedBy: interaction.user,
        },
      });
    };

    const result = await player.search(query, {
      searchEngine: QueryType.AUTO,
    })
        .catch((e) => logger.error(`Error while trying to search ${query}`));
    if (!result) return interaction.followUp({content: 'Results not found for your request. Try again!', ephemeral: true});
    if (result.tracks[0] === undefined) return interaction.followUp('There was an error trying to accomplish your request. Try with a different playlist or song.');

    try {
      if (!queue.connection) await queue.connect(interaction.member.voice.channel);
    } catch (e) {
      queue.delete();
      await interaction.followUp({content: 'Something went wrong while trying to connect to your voice channel. Try again!', ephemeral: true});
      logger.error(`Error while trying to connect to voice channel of guild ${interaction.guildId}: ${e}`);
    }

    try {
      queue.addTrack(result.playlist ? result.tracks : result.tracks[0]);
      logger.info(`Song enqueuing successful for ${query}`);
      if (!queue.isPlaying()) await queue.node.play();
    } catch (e) {
      logger.error(`Something went wrong while trying to use play command: ${e}`);
      console.log('Playback of a song failed. Returning.');
      return interaction.followUp('Something went wrong while trying to queue your song. Try again in a bit.');
    }

    const userAvatar = interaction.member.displayAvatarURL({dynamic: true, size: 1024});

    const Embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.member.user.displayName}`,
          iconURL: userAvatar,
        })
        .setThumbnail(`${result.playlist ? result.playlist.thumbnail : result.tracks[0].thumbnail}`)
        .setDescription(`**${interaction.user}** added **${result.playlist ? result.playlist.title + ' playlist' : result.tracks[0]}**`);
    await interaction.followUp({embeds: [Embed]});
  },
};
