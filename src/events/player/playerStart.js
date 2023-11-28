const {useMainPlayer} = require('discord-player');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');
const player = useMainPlayer();


let embedMessageId = null;

player.events.on('playerStart', async(queue, track) => {

  const skipButton = new ButtonBuilder()
      .setCustomId('skip')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Skip')
      .setEmoji('⏭️');

  const pauseResumeButton = new ButtonBuilder()
      .setCustomId('pauseresume')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Pause/Resume')
      .setEmoji('⏯️');

    const stopButton = new ButtonBuilder()
    .setCustomId('stop')
    .setStyle(ButtonStyle.Secondary)
    .setLabel('Stop')
    .setEmoji('⏹️');

    const shuffleButton = new ButtonBuilder()
    .setCustomId('shuffle')
    .setStyle(ButtonStyle.Secondary)
    .setLabel('Shuffle')
    .setEmoji('🔀');

  const row = new ActionRowBuilder()
      .addComponents(pauseResumeButton)
      .addComponents(skipButton)
      .addComponents(stopButton)
      .addComponents(shuffleButton);

  const embed = new EmbedBuilder()
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setTitle(`${track.title}`)
      .setAuthor({
        name: 'OnigiriBot',
        iconURL: 'https://i.ibb.co/bFJ5GC1/Oni-Avatar.png'
      })
      .addFields(
          {name: `Now playing in ${queue.channel.name}`, value: `Requested by ${queue.metadata.requestedBy}`, inline: true},
          {name: `Duration`, value: `${track.duration}`, inline: true}
      )
      .setColor('#ffffff');
      
      
      if (embedMessageId) {
        try {
            const message = await queue.metadata.channel.messages.fetch(embedMessageId);
            await message.delete();
            embedMessageId = null;
        } catch (error) {
            logger.error('Error updating the embed:', error);
            embedMessageId = null;
        }
    }
    const sentMessage = await queue.metadata.channel.send({embeds: [embed], components: [row]});
    embedMessageId = sentMessage.id;
});
