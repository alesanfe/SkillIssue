const { run, get, all } = require('../database');
const { EmbedBuilder, italic, inlineCode, bold, time, TimestampStyles } = require('discord.js');

async function handleRandomCommand(message, args) {
  const sectionName = args[0] || null;

  try {
    let entries;
    if (sectionName) {
      const section = await get('SELECT * FROM sections WHERE name = ?', [sectionName]);
      if (!section) {
        await message.reply(`❌ Section ${inlineCode(sectionName)} not found.`);
        return;
      }
      entries = await all('SELECT * FROM entries WHERE section_id = ? AND is_archived = 0', [section.id]);
    } else {
      entries = await all('SELECT * FROM entries WHERE is_archived = 0');
    }

    if (entries.length === 0) {
      await message.reply('❌ No entries found.');
      return;
    }

    const randomEntry = entries[Math.floor(Math.random() * entries.length)];

    await run('UPDATE entries SET uses = uses + 1 WHERE id = ?', [randomEntry.id]);

    const section = randomEntry.section_id ? await get('SELECT name FROM sections WHERE id = ?', [randomEntry.section_id]) : null;

    const embed = new EmbedBuilder()
      .setTitle('🎲 Random Entry')
      .setColor('#5865F2')
      .setDescription(randomEntry.content || italic('No content'))
      .addFields(
        { name: '📄 Name', value: bold(randomEntry.name), inline: true },
        { name: '📁 Section', value: section?.name ? italic(section.name) : italic('None'), inline: true },
        { name: '📊 Uses', value: inlineCode(randomEntry.uses.toString()), inline: true }
      )
      .setTimestamp()
      .setAuthor({ 
        name: 'LoreBot', 
        iconURL: message.client.user?.displayAvatarURL() 
      })
      .setFooter({ 
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      });

    if (randomEntry.created_at) {
      embed.addFields({ name: '🕐 Added', value: time(new Date(randomEntry.created_at), TimestampStyles.RelativeTime), inline: true });
    }

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error getting random entry:', error);
    await message.reply('❌ Error getting random entry.');
  }
}

module.exports = { handleRandomCommand };
