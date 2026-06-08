const { all } = require('../database');
const { EmbedBuilder, italic, bold, inlineCode, time, TimestampStyles } = require('discord.js');

async function handleTrendingCommand(message, args) {
  const limit = parseInt(args[0]) || 5;

  try {
    const entries = await all(`
      SELECT e.*, s.name as section_name
      FROM entries e
      LEFT JOIN sections s ON e.section_id = s.id
      WHERE e.is_archived = 0
      AND e.created_at >= datetime('now', '-7 days')
      ORDER BY e.uses DESC
      LIMIT ?
    `, [limit]);

    if (entries.length === 0) {
      await message.reply('❌ No trending entries found in the last 7 days.');
      return;
    }

    const entryList = entries.map((entry, index) => {
      const sectionPart = entry.section_name ? ` · ${italic(entry.section_name)}` : '';
      const timePart = entry.created_at ? ` · ${time(new Date(entry.created_at), TimestampStyles.RelativeTime)}` : '';
      return `${index + 1}. ${bold(entry.name)}${sectionPart} — ${inlineCode(entry.uses + ' uses')}${timePart}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`📈 Trending Entries (Last 7 Days, Top ${limit})`)
      .setColor('#5865F2')
      .setDescription(entryList)
      .setTimestamp()
      .setAuthor({ 
        name: 'LoreBot', 
        iconURL: message.client.user?.displayAvatarURL() 
      })
      .setFooter({ 
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      });

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error getting trending entries:', error);
    await message.reply('❌ Error getting trending entries.');
  }
}

module.exports = { handleTrendingCommand };
