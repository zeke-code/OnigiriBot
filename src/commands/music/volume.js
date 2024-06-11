const {
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
} = require("discord.js");
const { useQueue } = require("discord-player");
const logger = require("../../utils/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Change the global volume of the bot."),
  async execute(interaction) {
    if (!interaction.member.voice.channelId) {
      return interaction.reply({
        content: "You are not in a voice channel!",
        ephemeral: true,
      });
    }
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
      return interaction.reply({
        content: "There doesn't seem to be any active playlist in this server.",
        ephemeral: true,
      });
    const modal = new ModalBuilder()
      .setCustomId(`adjust_volume_${interaction.guild.id}`)
      .setTitle(`Adjust Volume - Currently at ${queue.node.volume}%`)
      .addComponents([
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("volume-input")
            .setLabel("Insert the desired volume level (0-100)")
            .setStyle(1)
            .setMinLength(1)
            .setMaxLength(6)
            .setPlaceholder("New volume level...")
            .setRequired(true)
        ),
      ]);
    await interaction.showModal(modal);
    const filter = (interaction) =>
      interaction.customId.includes(`adjust_volume_${interaction.guild.id}`);
    interaction
      .awaitModalSubmit({ filter, time: 240000 })
      .then(async (submit) => {
        const userResponse = submit.fields.getTextInputValue("volume-input");

        if (userResponse < 0 || userResponse > 100 || isNaN(userResponse))
          return submit.reply({
            content: "❌ | Volume input must be between 0-100.",
            ephemeral: true,
          });

        const volumeembed = new EmbedBuilder()
          .setAuthor({
            name: "OnigiriBot",
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
          .setColor("#FFFFFF")
          .setTitle(`Volume adjusted 🎧`)
          .setDescription(`The volume has been set to **${userResponse}%**!`)
          .setTimestamp()
          .setFooter({
            text: `Requested by: ${
              interaction.user.discriminator != 0
                ? interaction.user.tag
                : interaction.user.username
            }`,
          });

        try {
          queue.node.setVolume(Number(userResponse));
          submit.reply({ embeds: [volumeembed] });
        } catch (err) {
          console.log(err);
          submit.reply({
            content: `❌ | Ooops... something went wrong, there was an error adjusting the volume. Please try again.`,
            ephemeral: true,
          });
        }
      })
      .catch(console.error);
  },
};
