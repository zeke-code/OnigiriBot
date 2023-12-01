const {SlashCommandBuilder} = require('discord.js');
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
            queue.node.stop();
            queue.delete();
            await interaction.reply(`Stopped playing music and deleted the playlist under **${interaction.member}'s request!**`)
        }
}