const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {useQueue} = require('discord-player');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
            .setName('back')
            .setDescription('Plays the previous song in the playlist!'),
        async execute(interaction) {
            if (!interaction.member.voice.channelId)
                return await interaction.reply({ content: 'You are not in a voice channel!', ephemeral: true });
            if (interaction.guild.members.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId) {
                return interaction.reply({content: 'You are not in my voice channel!', ephemeral: true});}
            const queue = useQueue(interaction.guildId);
            if (!queue) return interaction.reply({content: 'There doesn\'t seem to be any active playlist in this server.', ephemeral: true});

            const previousTracks = queue.history.tracks.toArray();
            if (!previousTracks[0]) return interaction.reply({content: 'There isn\'t any track history for this playlist.', ephemeral: true});

            const userAvatar = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 });

            const embed = new EmbedBuilder()
                            .setAuthor({
                                name: `${interaction.member.user.username}`,
                                iconURL: userAvatar
                            })
                            .setDescription(`**${interaction.member}** pressed the previous button. Now playing ${previousTracks[0].title}`);

            try {
                await queue.history.back();
                return await interaction.reply({embeds: [embed]});
            } catch (e) {
                await interaction.reply({content: 'There was a problem trying to go to the previous song in the playlist. Try again later.', ephemeral: true});
                logger.error(`There was a problem trying to use previous command in guild ${interaction.guildId}: ${e}`);
            }
        }

}
