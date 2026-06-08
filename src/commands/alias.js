const { run, get } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleAliasCommand(message, args) {
  const name = args[0];
  const alias = args[1];

  if (!name || !alias) {
    await message.reply(`❌ Usage: ${inlineCode('!alias <name> <alias>')}`);
    return;
  }

  // Find the entry
  const entry = await get('SELECT id FROM entries WHERE name = ?', [name]);

  if (!entry) {
    await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
    return;
  }

  try {
    await run('INSERT INTO aliases (entry_id, alias) VALUES (?, ?)', [entry.id, alias]);
    await message.reply(`✅ Alias ${inlineCode(alias)} created for ${bold(name)}.`);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      await message.reply(`❌ Alias ${inlineCode(alias)} already exists.`);
    } else {
      throw error;
    }
  }
}

module.exports = { handleAliasCommand };
