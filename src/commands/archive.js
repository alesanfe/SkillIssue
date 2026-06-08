const { run, get, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleArchiveCommand(message, args) {
  if (args.length < 1) {
    await message.reply(`❌ Usage: ${inlineCode('!archive <name>')}`);
    return;
  }

  const name = args[0];

  try {
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    const newStatus = entry.is_archived ? 0 : 1;
    await run('UPDATE entries SET is_archived = ? WHERE name = ?', [newStatus, name]);

    if (newStatus) {
      await message.reply(`📦 Archived ${bold(name)}.`);
    } else {
      await message.reply(`📦 Unarchived ${bold(name)}.`);
    }
  } catch (error) {
    console.error('Error toggling archive:', error);
    await message.reply('❌ Error toggling archive.');
  }
}

module.exports = { handleArchiveCommand };
