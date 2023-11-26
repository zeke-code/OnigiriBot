const {SlashCommandBuilder} = require('discord.js');
const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Makes me stop playing music!'),
        async execute(interaction) {
            const player = useMainPlayer();
            const guildQueue = player.nodes.get(interaction.guildId);

            if (!guildQueue) return await interaction.reply({ content: `I'm not playing music in this server!`, ephemeral: true});
            await guildQueue.node.stop();
            await guildQueue.delete();
            await interaction.reply(`Stopped playing music and deleted the playlist under **${interaction.member}'s request!**`)
        }
}