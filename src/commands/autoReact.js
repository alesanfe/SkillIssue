const { run, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleAutoReactCommand(message, args) {
  const guildId = message.guild.id;
  const subCommand = args[0];

  if (!subCommand) {
    await message.reply(`❌ Usage: ${inlineCode('!autoreact add <emoji> <keyword> | !autoreact list | !autoreact remove <emoji> <keyword>')}`);
    return;
  }

  if (subCommand === 'list') {
    const reactions = await all('SELECT emoji, keyword FROM auto_reactions WHERE guild_id = ?', [guildId]);
    if (reactions.length === 0) {
      await message.reply('❌ No auto-reactions configured.');
      return;
    }
    const reactionList = reactions.map(r => `${r.emoji} → "${r.keyword}"`).join('\n');
    await message.reply(`**Auto-reactions:**\n${reactionList}`);
    return;
  }

  if (subCommand === 'remove') {
    const emoji = args[1];
    const keyword = args[2];
    if (!emoji || !keyword) {
      await message.reply(`❌ Usage: ${inlineCode('!autoreact remove <emoji> <keyword>')}`);
      return;
    }
    await run('DELETE FROM auto_reactions WHERE guild_id = ? AND emoji = ? AND keyword = ?', [guildId, emoji, keyword]);
    await message.reply(`✅ Auto-reaction ${bold(emoji)} for keyword "${keyword}" removed.`);
    return;
  }

  if (subCommand === 'add') {
    const emoji = args[1];
    const keyword = args.slice(2).join(' ');
    if (!emoji || !keyword) {
      await message.reply(`❌ Usage: ${inlineCode('!autoreact add <emoji> <keyword>')}`);
      return;
    }
    try {
      await run('INSERT INTO auto_reactions (guild_id, emoji, keyword) VALUES (?, ?, ?)', [guildId, emoji, keyword]);
      await message.reply(`✅ Auto-reaction ${bold(emoji)} configured for keyword "${keyword}".`);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        await message.reply(`❌ Auto-reaction ${bold(emoji)} for keyword "${keyword}" already exists.`);
      } else {
        throw error;
      }
    }
    return;
  }

  await message.reply(`❌ Unknown subcommand. Usage: ${inlineCode('!autoreact add <emoji> <keyword> | !autoreact list | !autoreact remove <emoji> <keyword>')}`);
}

module.exports = { handleAutoReactCommand };
