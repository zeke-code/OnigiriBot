const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Makes me stop playing music and deletes current playlist!'),
        async execute(interaction) {
            if (!interaction.member.voice.channelId)
                return await interaction.reply({ content: 'You are not in a voice channel!', ephemeral: true });
            if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});}
            const queue = useQueue(interaction.guildId);

            if (!queue) return await interaction.reply({ content: `I'm not playing music in this server!`, ephemeral: true});
            try {
            queue.node.stop();
            queue.delete();
            const userAvatar = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 });const embed = new EmbedBuilder()
                    .setAuthor({
                      name: `${interaction.member.user.username}`,
                      iconURL: userAvatar
                    })
                    .setDescription(`**${interaction.member}** stopped the music player. Deleting playlist as well.`)
            await interaction.reply({embeds: [embed]});
            } catch (e) {
                logger.error(`Something went wrong trying to stop player: ${e}`);
                return await interaction.reply(`Something went wrong while trying to stop music player. Try again later!`);
            }
        }
}