const { all } = require('../database');
const { inlineCode, bold } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function handleExportCommand(message, args) {
  const sectionName = args[0] || null;

  try {
    let entries;
    if (sectionName) {
      const section = await all('SELECT * FROM sections WHERE name = ?', [sectionName]);
      if (section.length === 0) {
        await message.reply(`❌ Section ${inlineCode(sectionName)} not found.`);
        return;
      }
      entries = await all('SELECT e.*, s.name as section_name FROM entries e JOIN sections s ON e.section_id = s.id WHERE s.name = ?', [sectionName]);
    } else {
      entries = await all('SELECT e.*, s.name as section_name FROM entries e LEFT JOIN sections s ON e.section_id = s.id');
    }

    if (entries.length === 0) {
      await message.reply('❌ No entries to export.');
      return;
    }

    const exportData = JSON.stringify(entries, null, 2);
    const filename = `export_${Date.now()}.json`;
    const filepath = path.join(__dirname, '..', '..', filename);

    fs.writeFileSync(filepath, exportData);

    await message.reply(`✅ Exported ${bold(entries.length.toString())} entries to ${inlineCode(filename)}`);
  } catch (error) {
    console.error('Error exporting:', error);
    await message.reply('❌ Error exporting entries.');
  }
}

module.exports = { handleExportCommand };
