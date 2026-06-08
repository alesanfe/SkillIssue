const { run, get, all } = require('../database');
const { EmbedBuilder, inlineCode, italic, TimestampStyles, time } = require('discord.js');

async function handleShowCommand(message, args) {
  const guildId = message.guild.id;
  const name = args[0];

  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!show <name>')} or ${inlineCode('!show <section>.<name>')}`);
    return;
  }

  try {
    let entry;
    let sectionName = null;

    // Check if it's section.name format
    if (name.includes('.')) {
      const [section, entryName] = name.split('.');
      sectionName = section;

      const sectionData = await get('SELECT id FROM sections WHERE guild_id = ? AND name = ?', [guildId, section]);

      if (!sectionData) {
        await message.reply(`❌ Section ${inlineCode(section)} not found.`);
        return;
      }

      entry = await get('SELECT * FROM entries WHERE section_id = ? AND name = ?', [sectionData.id, entryName]);
    } else {
      // Check aliases first
      entry = await get(`
        SELECT e.* FROM entries e
        JOIN aliases a ON e.id = a.entry_id
        WHERE a.alias = ?
      `, [name]);

      if (!entry) {
        // Search in all sections
        entry = await get('SELECT * FROM entries WHERE name = ?', [name]);
      }
    }

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    // Increment use count
    await run('UPDATE entries SET uses = uses + 1 WHERE id = ?', [entry.id]);

    // Get attachments
    const attachments = await all('SELECT type, url FROM attachments WHERE entry_id = ?', [entry.id]);

    // Get section name for display
    const section = await get('SELECT name FROM sections WHERE id = ?', [entry.section_id]);

    const imageUrls = attachments.filter(a => a.type === 'image').map(a => a.url);
    const gifUrls = attachments.filter(a => a.type === 'gif').map(a => a.url);
    const videoUrls = attachments.filter(a => a.type === 'video').map(a => a.url);
    // Filter out invalid URLs (must start with http://, https://, or attachment:)
    const isValidUrl = (url) => url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('attachment://'));
    const allMedia = [...imageUrls, ...gifUrls].filter(isValidUrl);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📄 ${entry.name}`)
      .setDescription(entry.content || italic('No content'))
      .setFooter({ text: `📊 ${entry.uses} uses` });

    if (section) {
      embed.addFields({ name: 'Section', value: section.name, inline: true });
    }

    if (entry.created_at) {
      embed.setTimestamp(new Date(entry.created_at));
    }

    // Add image if available
    if (allMedia.length > 0) {
      embed.setImage(allMedia[0]);
    }

    // Add videos as field
    if (videoUrls.length > 0) {
      embed.addFields({ name: '🎥 Videos', value: videoUrls.join('\n') });
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in show command:', error);
    throw error;
  }
}

module.exports = { handleShowCommand };
