const {SlashCommandBuilder} = require('discord.js');
const {useMainPlayer, GuildNodeManager} = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skip the current track playing in the playlist!'),
  async execute(interaction) {
    const player = useMainPlayer();
    const queue = player.nodes.get(interaction.guildId, {
      metadata: {
        channel: interaction.member.channel,
        requestedBy: interaction.member
      }
    });
    if(!queue) return interaction.reply({content: 'No queue found for this server.', ephemeral: true});
    const currentTrack = queue.currentTrack;
    queue.node.skip();
    await interaction.reply(`Skipped **${currentTrack}** under **${interaction.member}**'s request successfully.`)
  },
};
