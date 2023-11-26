const {SlashCommandBuilder} = require('discord.js');
const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play music by writing the link/name of the song!')
      .addStringOption((option) =>
        option.setName('query')
            .setDescription('I\'ll search for the title you provide me! (Links supported as well!)')
            .setRequired(true)),
  async execute(interaction) {
    const player = useMainPlayer();
    if (!interaction.member.voice.channel) return interaction.reply({content: 'You need to be connected to a voice channel to use this command.', ephemeral: true});
    await interaction.deferReply();
    const query = interaction.options.getString('query', true);

    const guildQueue = player.nodes.create(interaction.guild, {
      metadata: {
        voiceChannel: interaction.member.voice.channel,
        channel: interaction.channel,
        requestedBy: interaction.user,
      },
    });

    const result = await player.search(query);
    if (!result) return interaction.reply({content: 'Results not found for your request. Try again!', ephemeral: true});

    try {
      guildQueue.addTrack(result.tracks[0]);
      logger.info(`Song enqueuing successful for ${query}`);
      if (!guildQueue.connection) {
        await guildQueue.connect(guildQueue.metadata.voiceChannel);
        await guildQueue.node.play();
      }
    } catch (e) {
      logger.error(`Something went wrong while trying to use play command: ${e}`);
      console.log('Playback of a song failed. Returning.');
      return interaction.followUp('Something went wrong while trying to queue your song. Try again in a bit.');
    }
    await interaction.followUp(`**${result.tracks[0].title}** enqueued under **${interaction.member}**'s request!`);
  },
};
