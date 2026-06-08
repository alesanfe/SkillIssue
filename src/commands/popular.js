const { all } = require('../database');
const { EmbedBuilder, italic, bold, inlineCode } = require('discord.js');

async function handlePopularCommand(message, args) {
  const limit = parseInt(args[0]) || 5;

  try {
    const entries = await all(`
      SELECT e.*, s.name as section_name
      FROM entries e
      LEFT JOIN sections s ON e.section_id = s.id
      WHERE e.is_archived = 0
      ORDER BY e.uses DESC
      LIMIT ?
    `, [limit]);

    if (entries.length === 0) {
      await message.reply('❌ No entries found.');
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const entryList = entries.map((entry, index) => {
      const prefix = medals[index] || `${index + 1}.`;
      const sectionPart = entry.section_name ? ` · ${italic(entry.section_name)}` : '';
      return `${prefix} ${bold(entry.name)}${sectionPart} — ${inlineCode(entry.uses + ' uses')}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`🔥 Popular Entries (Top ${limit})`)
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
    console.error('Error getting popular entries:', error);
    await message.reply('❌ Error getting popular entries.');
  }
}

module.exports = { handlePopularCommand };
