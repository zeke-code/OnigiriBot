const {SlashCommandBuilder} = require('discord.js');
const {useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('shuffle')
            .setDescription('Shuffles the current playlist!'),
        async execute(interaction) {
            if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});}
            const queue = useQueue(interaction.guildId);
            if(!queue) return await interaction.reply({content: 'There is no active playlist in this server.', ephemeral: true});

            try{
               if(queue.isShuffling){
                   queue.toggleShuffle();
                   return await interaction.reply(`Shuffling disabled under **${interaction.member}**'s request!`);
               }
               else if(!queue.isShuffling) {
                   queue.toggleShuffle();
                   return await interaction.reply(`Shuffling enabled under **${interaction.member}**'s request!`)
               }
        } catch (e) {
            logger.error(`Something went wrong while trying to toggle shuffle in guild ${interaction.guildId}: ${e}`);
            return await interaction.reply(`Something went wrong while trying to toggle shuffle. Try again!`);
        }
    }
}
