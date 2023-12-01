const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('pause')
            .setDescription('Pauses/unpauses the music player!'),
        async execute(interaction) {
            if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});}
            queue = useQueue(interaction.guildId)
            await interaction.deferReply();
            if (!queue) return interaction.reply({content: 'There doesn\'t seem to be any active playlist in this server.', ephemeral: true});
            const userAvatar = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 });
            try{
              if(queue.node.isPlaying()){
                  queue.node.pause();

                  const embed = new EmbedBuilder()
                    .setAuthor({
                      name: `${interaction.member.user.username}`,
                      iconURL: userAvatar
                    })
                    .setDescription(`**${interaction.member}** paused the music player.`);
                  await interaction.followUp({embeds: [embed]});
              }
              else if(queue.node.isPaused()){
                  queue.node.resume();
                  const embed = new EmbedBuilder()
                    .setAuthor({
                      name: `${interaction.member.user.username}`,
                      iconURL: userAvatar
                    })
                    .setDescription(`**${interaction.member}** unpaused the music player.`);
                  await interaction.followUp({embeds: [embed]});
              }
            } catch (e) {
              await interaction.followUp(`Something went wrong while trying to pause the player. Try again.`);
              logger.error(e);
            }
        }
}