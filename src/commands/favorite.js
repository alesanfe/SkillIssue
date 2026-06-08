const { run, get, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleFavoriteCommand(message, args) {
  if (args.length < 1) {
    await message.reply(`❌ Usage: ${inlineCode('!favorite <name>')}`);
    return;
  }

  const name = args[0];

  try {
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    const existing = await get('SELECT * FROM favorites WHERE entry_id = ? AND user_id = ?', [entry.id, message.author.id]);
    if (existing) {
      await run('DELETE FROM favorites WHERE entry_id = ? AND user_id = ?', [entry.id, message.author.id]);
      await message.reply(`❤️ Removed ${bold(name)} from favorites.`);
      return;
    }

    await run('INSERT INTO favorites (entry_id, user_id) VALUES (?, ?)', [entry.id, message.author.id]);
    await message.reply(`❤️ Added ${bold(name)} to favorites.`);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    await message.reply('❌ Error toggling favorite.');
  }
}

module.exports = { handleFavoriteCommand };
