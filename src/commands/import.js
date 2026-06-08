const { run, get, all } = require('../database');
const fs = require('fs');
const path = require('path');

async function handleImportCommand(message, args) {
  if (args.length < 1) {
    await message.reply('Usage: !import <filename>');
    return;
  }

  const filename = args[0];

  try {
    const filepath = path.join(__dirname, '..', '..', filename);

    if (!fs.existsSync(filepath)) {
      await message.reply('[X] File not found.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    let imported = 0;
    for (const entry of data) {
      // Find or create section
      let sectionId = null;
      if (entry.section_name) {
        const section = await get('SELECT * FROM sections WHERE name = ?', [entry.section_name]);
        if (section) {
          sectionId = section.id;
        } else {
          const guildId = message.guild?.id || 'default';
          const result = await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)',
            [guildId, entry.section_name, 'Imported']);
          sectionId = result.lastID;
        }
      }

      // Insert entry
      await run('INSERT INTO entries (section_id, name, content, author_id, uses, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [sectionId, entry.name, entry.content, message.author.id, entry.uses || 0, entry.created_at]);
      imported++;
    }

    await message.reply(`[OK] Imported ${imported} entries from ${filename}`);
  } catch (error) {
    console.error('Error importing:', error);
    await message.reply('[X] Error importing entries.');
  }
}

module.exports = { handleImportCommand };
