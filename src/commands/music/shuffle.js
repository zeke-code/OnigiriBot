const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffles the current playlist!"),
  async execute(interaction) {
    if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !==
        interaction.guild.members.me.voice.channelId
    ) {
      return interaction.reply({
        content: "You are not in my voice channel!",
        ephemeral: true,
      });
    }
    const queue = useQueue(interaction.guildId);
    if (!queue)
      return await interaction.reply({
        content: "There is no active playlist in this server.",
        ephemeral: true,
      });

    const userAvatar = interaction.member.displayAvatarURL({
      dynamic: true,
      size: 1024,
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${interaction.member.user.displayName}`,
        iconURL: userAvatar,
      })
      .setColor("Purple");

    try {
      if (queue.isShuffling) {
        queue.toggleShuffle();
        embed.setDescription(`${interaction.member} disabled shuffle mode!`);
      } else if (!queue.isShuffling) {
        queue.toggleShuffle();
        embed.setDescription(`${interaction.member} enabled shuffle mode!`);
      }
      return await interaction.reply({ embeds: [embed] });
    } catch (e) {
      logger.error(
        `Something went wrong while trying to toggle shuffle in guild ${interaction.guildId}: ${e}`
      );
      return await interaction.reply(
        `Something went wrong while trying to toggle shuffle. Try again!`
      );
    }
  },
};
