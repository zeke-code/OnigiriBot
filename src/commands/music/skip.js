const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
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
    if(queue.isEmpty()) queue.delete();

    const userAvatar = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
                  .setAuthor({
                    name: `${interaction.member.user.username}`,
                    iconURL: userAvatar
                  })
                  .setDescription(`**${queue.metadata.requestedBy}** skipped **${currentTrack}**`)

    await queue.metadata.channel.send({embeds: [embed]});
  },
};
