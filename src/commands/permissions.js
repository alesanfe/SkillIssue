const { run, get, all } = require('../database');
const { inlineCode, bold } = require('discord.js');

async function handlePermissionsCommand(message, args) {
  const subcommand = args[0];
  const permArgs = args.slice(1);
  const guildId = message.guild?.id || 'default';

  if (!subcommand) {
    await message.reply(`❌ Usage: ${inlineCode('!permissions <allow|deny|list> [role_id] [command]')}`);
    return;
  }

  try {
    switch (subcommand) {
      case 'allow': {
        if (permArgs.length < 2) {
          await message.reply(`❌ Usage: ${inlineCode('!permissions allow <role_id> <command>')}`);
          return;
        }
        const roleId = permArgs[0];
        const command = permArgs[1];
        await run('INSERT OR REPLACE INTO permissions (role_id, command, allowed, guild_id) VALUES (?, ?, 1, ?)',
          [roleId, command, guildId]);
        await message.reply(`✅ Allowed role ${inlineCode(roleId)} to use ${bold(command)}.`);
        break;
      }

      case 'deny': {
        if (permArgs.length < 2) {
          await message.reply(`❌ Usage: ${inlineCode('!permissions deny <role_id> <command>')}`);
          return;
        }
        const denyRoleId = permArgs[0];
        const denyCommand = permArgs[1];
        await run('INSERT OR REPLACE INTO permissions (role_id, command, allowed, guild_id) VALUES (?, ?, 0, ?)',
          [denyRoleId, denyCommand, guildId]);
        await message.reply(`🚫 Denied role ${inlineCode(denyRoleId)} from using ${bold(denyCommand)}.`);
        break;
      }

      case 'list': {
        const permissions = await all('SELECT * FROM permissions WHERE guild_id = ?', [guildId]);
        if (permissions.length === 0) {
          await message.reply('🔒 No permissions set.');
          return;
        }
        let listResponse = '🔒 **Permissions:**\n';
        permissions.forEach(p => {
          listResponse += `- Role ${inlineCode(p.role_id)}: ${bold(p.command)} (${p.allowed ? '✅' : '🚫'})\n`;
        });
        await message.reply(listResponse);
        break;
      }

      default:
        await message.reply(`❌ Unknown subcommand. Use: ${inlineCode('allow')}, ${inlineCode('deny')}, or ${inlineCode('list')}`);
    }
  } catch (error) {
    console.error('Error handling permissions:', error);
    await message.reply('❌ Error handling permissions.');
  }
}

module.exports = { handlePermissionsCommand };
