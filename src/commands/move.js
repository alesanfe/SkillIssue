const { run, get, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleMoveCommand(message, args) {
  if (args.length < 2) {
    await message.reply(`❌ Usage: ${inlineCode('!move <name> <target_section>')}`);
    return;
  }

  const name = args[0];
  const targetSection = args[1];

  try {
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    const section = await get('SELECT * FROM sections WHERE name = ?', [targetSection]);

    if (!section) {
      await message.reply(`❌ Section ${inlineCode(targetSection)} not found.`);
      return;
    }

    const existing = await get('SELECT * FROM entries WHERE section_id = ? AND name = ?', [section.id, name]);
    if (existing) {
      await message.reply(`❌ Entry ${inlineCode(name)} already exists in ${inlineCode(targetSection)}.`);
      return;
    }

    await run('UPDATE entries SET section_id = ? WHERE name = ?', [section.id, name]);
    await message.reply(`✅ Entry ${bold(name)} moved to ${inlineCode(targetSection)}.`);
  } catch (error) {
    console.error('Error moving entry:', error);
    await message.reply('❌ Error moving entry.');
  }
}

module.exports = { handleMoveCommand };
