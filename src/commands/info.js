const { get, all } = require('../database');

async function handleInfoCommand(message) {
  try {
    const guildId = message.guild?.id || 'default';

    const totalSections = await get('SELECT COUNT(*) as count FROM sections WHERE guild_id = ?', [guildId]);
    const totalEntries = await get('SELECT COUNT(*) as count FROM entries e JOIN sections s ON e.section_id = s.id WHERE s.guild_id = ?', [guildId]);
    const totalTags = await get('SELECT COUNT(*) as count FROM tags t JOIN entries e ON t.entry_id = e.id JOIN sections s ON e.section_id = s.id WHERE s.guild_id = ?', [guildId]);
    const totalAliases = await get('SELECT COUNT(*) as count FROM aliases a JOIN entries e ON a.entry_id = e.id JOIN sections s ON e.section_id = s.id WHERE s.guild_id = ?', [guildId]);

    // Build embed for better presentation
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle('ℹ️ LoreBot Info')
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
        { name: '📁 Sections', value: totalSections.count.toString(), inline: true },
        { name: '📝 Entries', value: totalEntries.count.toString(), inline: true },
        { name: '🏷️ Tags', value: totalTags.count.toString(), inline: true },
        { name: '🔗 Aliases', value: totalAliases.count.toString(), inline: true },
        { name: '🌐 Server', value: message.guild?.name || 'DM', inline: true }
      );

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error getting info:', error);
    await message.reply('[X] Error getting info.');
  }
}

module.exports = { handleInfoCommand };
