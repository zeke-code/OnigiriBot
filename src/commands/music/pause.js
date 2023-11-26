const {SlashCommandBuilder} = require('discord.js');
const {useMainPlayer} = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('pause')
            .setDescription('Pauses/unpauses the music player!'),
        async execute(interaction) {
            const player = useMainPlayer();
            queue = player.nodes.get(interaction.guildId);
            await interaction.deferReply();
            if (!queue) return interaction.reply({content: 'There doesn\'t seem to be any player in execution in this server.', ephemeral: true});
            if(queue.node.isPlaying()){
                queue.node.pause();
                await interaction.followUp(`Player paused under **${interaction.member}**'s request!`);
            }
            else if(queue.node.isPaused()){
                queue.node.resume();
                await interaction.followUp(`Player has resumed playing music under **${interaction.member}**'s request!`);
            }
        }
}