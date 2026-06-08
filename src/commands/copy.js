const { run, get, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleCopyCommand(message, args) {
  if (args.length < 2) {
    await message.reply(`❌ Usage: ${inlineCode('!copy <name> <target_section>')}`);
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

    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)',
      [section.id, name, entry.content, message.author.id]);

    await message.reply(`✅ Entry ${bold(name)} copied to ${inlineCode(targetSection)}.`);
  } catch (error) {
    console.error('Error copying entry:', error);
    await message.reply('❌ Error copying entry.');
  }
}

module.exports = { handleCopyCommand };
