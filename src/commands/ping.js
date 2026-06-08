async function handlePingCommand(message) {
  const { EmbedBuilder, inlineCode } = require('discord.js');
  
  const sent = await message.reply('Measuring...');
  const roundtrip = sent.createdTimestamp - message.createdTimestamp;
  const wsLatency = message.client.ws.ping;

  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .setColor('#5865F2')
    .setTimestamp()
    .setAuthor({ 
      name: 'LoreBot', 
      iconURL: message.client.user?.displayAvatarURL() 
    })
    .setFooter({ 
      text: `Requested by ${message.author.tag}`,
      iconURL: message.author.displayAvatarURL()
    })
    .addFields(
      { name: '📡 Roundtrip', value: inlineCode(`${roundtrip}ms`), inline: true },
      { name: '💓 WebSocket', value: inlineCode(`${wsLatency}ms`), inline: true }
    );
  
  await sent.edit({ content: null, embeds: [embed] });
}

module.exports = { handlePingCommand };
