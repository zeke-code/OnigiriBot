const {SlashCommandBuilder} = require('discord.js');
const {useMainPlayer} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('shuffle')
            .setDescription('Shuffles the current playlist!'),
        async execute(interaction) {
            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guildId, {
                metadata: {
                    channel: interaction.member.channel,
                    requestedBy: interaction.member
                }
            });
            if(!queue) return await interaction.reply({content: 'There is no playlist active in this server.', ephemeral: true});
            if(queue.isShuffling){
                queue.toggleShuffle();
                return await interaction.reply(`Shuffling disabled under **${interaction.member}**'s request!`);
            }
            else if(!queue.isShuffling) {
                queue.toggleShuffle();
                return await interaction.reply(`Shuffling enabled under **${interaction.member}**'s request!`)
            }
        }
    }
