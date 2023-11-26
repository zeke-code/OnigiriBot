const {useMainPlayer} = require('discord-player');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../utils/logger');
const player = useMainPlayer();


player.events.on('playerStart', (queue, track) => {
  const skipButton = new ButtonBuilder()
      .setCustomId('skip')
      .setLabel('⏭️');

  const pauseResume = new ButtonBuilder()
      .setCustomId('pauseresume')
      .setLabel('⏯️');

  const row = new ActionRowBuilder()
      .addComponents(pauseResume)
      .addComponents(skipButton);

  const embed = new EmbedBuilder()
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setTitle(track.title)
      .addFields(
          {name: `Now playing in ${queue.channel.name}`, value: `Requested by ${queue.metadata.requestedBy}`},
          {name: `Duration`, value: `${track.duration}`},
      )
      .setColor('#ffffff');
  queue.metadata.channel.send({embeds: [embed]});
});
