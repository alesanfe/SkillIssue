const { run, get, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handleCooldownCommand(message, args) {
  const subcommand = args[0];
  const cooldownArgs = args.slice(1);
  const guildId = message.guild?.id || 'default';

  if (!subcommand) {
    await message.reply(`❌ Usage: ${inlineCode('!cooldown <set|remove|list> [command] [seconds]')}`);
    return;
  }

  try {
    switch (subcommand) {
      case 'set': {
        if (cooldownArgs.length < 2) {
          await message.reply(`❌ Usage: ${inlineCode('!cooldown set <command> <seconds>')}`);
          return;
        }
        const command = cooldownArgs[0];
        const seconds = parseInt(cooldownArgs[1]);
        await message.reply(`✅ Cooldown for ${bold(command)} set to ${inlineCode(seconds + 's')}.`);
        break;
      }

      case 'remove': {
        if (cooldownArgs.length < 1) {
          await message.reply(`❌ Usage: ${inlineCode('!cooldown remove <command>')}`);
          return;
        }
        const removeCommand = cooldownArgs[0];
        await run('DELETE FROM cooldowns WHERE command = ? AND guild_id = ?', [removeCommand, guildId]);
        await message.reply(`✅ Removed cooldown for ${bold(removeCommand)}.`);
        break;
      }

      case 'list': {
        const cooldowns = await all('SELECT * FROM cooldowns WHERE guild_id = ?', [guildId]);
        if (cooldowns.length === 0) {
          await message.reply('⏱️ No cooldowns set.');
          return;
        }
        let listResponse = '⏱️ **Cooldowns:**\n';
        cooldowns.forEach(c => {
          listResponse += `- ${inlineCode(c.command)}: last used ${c.last_used}\n`;
        });
        await message.reply(listResponse);
        break;
      }

      default:
        await message.reply(`❌ Unknown subcommand. Use: ${inlineCode('set')}, ${inlineCode('remove')}, or ${inlineCode('list')}`);
    }
  } catch (error) {
    console.error('Error handling cooldown:', error);
    await message.reply('❌ Error handling cooldown.');
  }
}

module.exports = { handleCooldownCommand };
