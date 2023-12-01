const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useQueue} = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('Skip the current track playing in the playlist!'),
  async execute(interaction) {
    if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
      return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});}
    const queue = useQueue(interaction.guildId);
    if(!queue) return interaction.reply({content: 'There doesn\'t seem to be any active playlist in this server.', ephemeral: true});
    const currentTrack = queue.currentTrack;
    queue.node.skip();
    if(queue.isEmpty()) queue.delete();

    const userAvatar = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
                  .setThumbnail(currentTrack.thumbnail)
                  .setAuthor({
                    name: `${interaction.member.user.username}`,
                    iconURL: userAvatar
                  })
                  .setDescription(`**${queue.metadata.requestedBy}** skipped **${currentTrack}**`)

    await interaction.reply({embeds: [embed]});
  },
};
