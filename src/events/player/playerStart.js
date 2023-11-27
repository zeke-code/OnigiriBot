const {useMainPlayer} = require('discord-player');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');
const player = useMainPlayer();


player.events.on('playerStart', (queue, track) => {

  const skipButton = new ButtonBuilder()
      .setCustomId('skip')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('⏭️');

  const pauseResumeButton = new ButtonBuilder()
      .setCustomId('pauseresume')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('⏯️');

    const stopButton = new ButtonBuilder()
    .setCustomId('stop')
    .setStyle(ButtonStyle.Secondary)
    .setLabel('⏹️');

  const row = new ActionRowBuilder()
      .addComponents(pauseResumeButton)
      .addComponents(skipButton)
      .addComponents(stopButton);

  const embed = new EmbedBuilder()
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setTitle(track.title)
      .addFields(
          {name: `Now playing in ${queue.channel.name}`, value: `Requested by ${queue.metadata.requestedBy}`},
          {name: `Duration`, value: `${track.duration}`},
          {name: 'Control Panel', value: `${row}`}
      )
      .setColor('#ffffff');
  queue.metadata.channel.send({embeds: [embed], components: [row]});
});
