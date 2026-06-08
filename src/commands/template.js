const { run, get, all } = require('../database');
const { inlineCode, bold, EmbedBuilder } = require('discord.js');

async function handleTemplateCommand(message, args) {
  const subcommand = args[0];
  const templateArgs = args.slice(1);

  if (!subcommand) {
    await message.reply(`❌ Usage: ${inlineCode('!template <create|use|list|delete> [args]')}`);
    return;
  }

  const guildId = message.guild?.id || 'default';

  try {
    switch (subcommand) {
      case 'create': {
        if (templateArgs.length < 2) {
          await message.reply(`❌ Usage: ${inlineCode('!template create <name> <content> [--img <url>] [--gif <url>]')}`);
          return;
        }
        const name = templateArgs[0];
        
        // Parse flags
        const imgMatch = templateArgs.join(' ').match(/--img\s+([^\s]+)/);
        const gifMatch = templateArgs.join(' ').match(/--gif\s+([^\s]+)/);
        const imageUrl = imgMatch ? imgMatch[1] : null;
        const gifUrl = gifMatch ? gifMatch[1] : null;
        
        // Remove flags from content
        let content = templateArgs.slice(1).join(' ');
        if (imageUrl) content = content.replace(/--img\s+[^\s]+/, '').trim();
        if (gifUrl) content = content.replace(/--gif\s+[^\s]+/, '').trim();

        const existing = await get('SELECT * FROM templates WHERE guild_id = ? AND name = ?', [guildId, name]);
        if (existing) {
          await message.reply(`❌ Template ${inlineCode(name)} already exists.`);
          return;
        }

        await run('INSERT INTO templates (name, content, image_url, gif_url, author_id, guild_id) VALUES (?, ?, ?, ?, ?, ?)',
          [name, content, imageUrl, gifUrl, message.author.id, guildId]);
        await message.reply(`✅ Template ${bold(name)} created.`);
        break;
      }

      case 'use': {
        if (templateArgs.length < 1) {
          await message.reply(`❌ Usage: ${inlineCode('!template use <name> [var=value ...]')}`);
          return;
        }
        const useName = templateArgs[0];
        const template = await get('SELECT * FROM templates WHERE guild_id = ? AND name = ?', [guildId, useName]);

        if (!template) {
          await message.reply(`❌ Template ${inlineCode(useName)} not found.`);
          return;
        }

        let result = template.content;
        templateArgs.slice(1).forEach(arg => {
          const [key, value] = arg.split('=');
          if (key && value) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
          }
        });

        // Render as embed
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`📋 ${template.name}`)
          .setDescription(result || 'No content')
          .setFooter({ text: `Template by ${message.author.tag}` });

        if (template.image_url) {
          embed.setImage(template.image_url);
        } else if (template.gif_url) {
          embed.setImage(template.gif_url);
        }

        await message.reply({ embeds: [embed] });
        break;
      }

      case 'list': {
        const templates = await all('SELECT * FROM templates WHERE guild_id = ?', [guildId]);
        if (templates.length === 0) {
          await message.reply('❌ No templates found.');
          return;
        }
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('📋 Templates')
          .setDescription(`${templates.length} template(s) available`);
        
        templates.forEach(t => {
          const preview = t.content.substring(0, 50) + (t.content.length > 50 ? '...' : '');
          const mediaInfo = t.image_url || t.gif_url ? ' 🖼️' : '';
          embed.addFields({ name: `${t.name}${mediaInfo}`, value: preview, inline: false });
        });
        
        await message.reply({ embeds: [embed] });
        break;
      }

      case 'delete': {
        if (templateArgs.length < 1) {
          await message.reply(`❌ Usage: ${inlineCode('!template delete <name>')}`);
          return;
        }
        const deleteName = templateArgs[0];
        const toDelete = await get('SELECT * FROM templates WHERE guild_id = ? AND name = ?', [guildId, deleteName]);

        if (!toDelete) {
          await message.reply(`❌ Template ${inlineCode(deleteName)} not found.`);
          return;
        }

        await run('DELETE FROM templates WHERE guild_id = ? AND name = ?', [guildId, deleteName]);
        await message.reply(`✅ Template ${bold(deleteName)} deleted.`);
        break;
      }

      default:
        await message.reply(`❌ Unknown subcommand. Use: ${inlineCode('create')}, ${inlineCode('use')}, ${inlineCode('list')}, or ${inlineCode('delete')}`);
    }
  } catch (error) {
    console.error('Error handling template command:', error);
    await message.reply('❌ Error handling template command.');
  }
}

module.exports = { handleTemplateCommand };
