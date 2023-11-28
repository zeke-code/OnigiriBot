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
    await interaction.deferReply();
    const query = interaction.options.getString('song', true);

    const guildQueue = player.nodes.create(interaction.guild, {
      metadata: {
        voiceChannel: interaction.member.voice.channel,
        channel: interaction.channel,
        requestedBy: interaction.user,
      },
    });

    const result = await player.search(query, {
      searchEngine: QueryType.AUTO
    })
    .catch(e => logger.error(`Error while trying to search ${query}`));
    if (!result) return interaction.reply({content: 'Results not found for your request. Try again!', ephemeral: true});

    try {
      if (!guildQueue.connection) await guildQueue.connect(interaction.member.voice.channel)
  } catch (e){
      guildQueue.delete();
      await interaction.followUp({content: 'Something went wrong while trying to connect to your voice channel. Try again!', ephemeral: true});
      logger.error(`Error while trying to connect to voice channel of guild ${interaction.guildId}: ${e}`)
  }

    try {
      guildQueue.addTrack(result.playlist ? result.tracks : result.tracks[0])
      logger.info(`Song enqueuing successful for ${query}`);
      if(!guildQueue.isPlaying()) await guildQueue.node.play();
    } catch (e) {
      logger.error(`Something went wrong while trying to use play command: ${e}`);
      console.log('Playback of a song failed. Returning.');
      return interaction.followUp('Something went wrong while trying to queue your song. Try again in a bit.');
    }

    const userAvatar = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 });

    const Embed = new EmbedBuilder()
                  .setAuthor({
                    name: `${interaction.member.user.username}`,
                    iconURL: userAvatar
                  })
                  .setDescription(`**${interaction.member.user.username}** added **${result.playlist ? result.tracks + ' playlist' : result.tracks[0]}**`)
    await interaction.followUp({embeds: [Embed]})
  },
};
