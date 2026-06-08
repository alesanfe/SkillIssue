const { get, all } = require('../database');
const { EmbedBuilder, bold, inlineCode, italic, time, TimestampStyles } = require('discord.js');

async function handleStatsCommand(message, args) {
  const guildId = message.guild.id;

  // Get total messages
  const totalMessages = await get('SELECT COUNT(*) as count FROM entries e JOIN sections s ON e.section_id = s.id WHERE s.guild_id = ?', [guildId]);

  // Get total sections
  const totalSections = await get('SELECT COUNT(*) as count FROM sections WHERE guild_id = ?', [guildId]);

  // Get top used messages
  const topUsed = await all(`
    SELECT e.name, e.uses, s.name as section_name
    FROM entries e
    JOIN sections s ON e.section_id = s.id
    WHERE s.guild_id = ?
    ORDER BY e.uses DESC
    LIMIT 5
  `, [guildId]);

  // Get unique authors
  const uniqueAuthors = await get(`
    SELECT COUNT(DISTINCT author_id) as count
    FROM entries e
    JOIN sections s ON e.section_id = s.id
    WHERE s.guild_id = ?
  `, [guildId]);

  const embed = new EmbedBuilder()
    .setTitle('📊 Server Statistics')
    .setColor('#5865F2')
    .setTimestamp()
    .setAuthor({ 
      name: 'LoreBot', 
      iconURL: message.client.user?.displayAvatarURL() 
    })
    .setFooter({ 
      text: `Requested by ${message.author.tag} • Generated ${time(new Date(), TimestampStyles.RelativeTime)}`,
      iconURL: message.author.displayAvatarURL()
    })
    .addFields(
      { name: '📝 Messages', value: bold(totalMessages.count.toString()), inline: true },
      { name: '📁 Sections', value: bold(totalSections.count.toString()), inline: true },
      { name: '👥 Authors', value: bold(uniqueAuthors.count.toString()), inline: true }
    );

  if (topUsed.length > 0) {
    const topUsedText = topUsed.map((msg, index) => {
      const sectionPrefix = msg.section_name ? `${italic(msg.section_name)}.` : '';
      return `${index + 1}. ${bold(sectionPrefix + msg.name)} — ${inlineCode(msg.uses + ' uses')}`;
    }).join('\n');
    
    embed.addFields({ name: '⭐ Top Used', value: topUsedText, inline: false });
  } else {
    embed.addFields({ name: '⭐ Top Used', value: italic('No entries used yet.'), inline: false });
  }

  await message.reply({ embeds: [embed] });
}

module.exports = { handleStatsCommand };
