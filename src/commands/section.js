const { run, get, all } = require('../database');
const { createPagination, createPaginatedEmbeds } = require('../utils/pagination');
const { EmbedBuilder, inlineCode, bold } = require('discord.js');

async function handleSectionCommand(message, args) {
  const subcommand = args[0]?.toLowerCase();
  const guildId = message.guild.id;

  if (!subcommand) {
    await message.reply(`❌ Usage: ${inlineCode('!section <create|delete|list|view> [name]')}`);
    return;
  }

  switch (subcommand) {
    case 'create':
      await createSection(message, args, guildId);
      break;
    case 'delete':
      await deleteSection(message, args, guildId);
      break;
    case 'list':
      await listSections(message, guildId);
      break;
    case 'view':
      await viewSection(message, args, guildId);
      break;
    default:
      await message.reply(`❌ Invalid subcommand. Use: ${inlineCode('create')}, ${inlineCode('delete')}, ${inlineCode('list')}, ${inlineCode('view')}`);
  }
}

async function createSection(message, args, guildId) {
  const name = args[1];
  const description = args.slice(2).join(' ') || null;

  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!section create <name> [description]')}`);
    return;
  }

  try {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', [guildId, name, description]);
    await message.reply(`✅ Section ${bold(name)} created successfully.`);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      await message.reply(`❌ A section named ${inlineCode(name)} already exists in this server.`);
    } else {
      throw error;
    }
  }
}

async function deleteSection(message, args, guildId) {
  const name = args[1];

  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!section delete <name>')}`);
    return;
  }

  const result = await run('DELETE FROM sections WHERE guild_id = ? AND name = ?', [guildId, name]);

  if (result.changes === 0) {
    await message.reply(`❌ Section ${inlineCode(name)} not found.`);
  } else {
    await message.reply(`✅ Section ${bold(name)} deleted successfully.`);
  }
}

async function listSections(message, guildId) {
  const sections = await all('SELECT name, description FROM sections WHERE guild_id = ? ORDER BY name', [guildId]);

  if (sections.length === 0) {
    await message.reply('❌ No sections found in this server.');
    return;
  }

  const sectionList = sections
    .map(s => `📁 ${s.name}${s.description ? ` - ${s.description}` : ''}`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('📋 Server Sections')
    .setColor('#5865F2')
    .setDescription(sectionList)
    .setTimestamp()
    .setAuthor({ 
      name: 'LoreBot', 
      iconURL: message.client.user?.displayAvatarURL() 
    })
    .setFooter({ 
      text: `Requested by ${message.author.tag}`,
      iconURL: message.author.displayAvatarURL()
    });

  await message.reply({ embeds: [embed] });
}

async function viewSection(message, args, guildId) {
  const name = args[1];

  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!section view <name>')}`);
    return;
  }

  const section = await get('SELECT id, description FROM sections WHERE guild_id = ? AND name = ?', [guildId, name]);

  if (!section) {
    await message.reply(`❌ Section ${inlineCode(name)} not found.`);
    return;
  }

  const entries = await all('SELECT name, content FROM entries WHERE section_id = ? ORDER BY name', [section.id]);

  if (entries.length === 0) {
    await message.reply(`📁 Section ${bold(name)} is empty.`);
    return;
  }

  // Use pagination for large lists
  
  const pages = createPaginatedEmbeds(entries, (pageItems, pageIndex, totalPages) => {
    const entryList = pageItems
      .map(e => `📄 ${e.name}: ${e.content?.substring(0, 50) || '(no content)'}${e.content?.length > 50 ? '...' : ''}`)
      .join('\n');
    
    return new EmbedBuilder()
      .setTitle(`📁 Section: ${name}`)
      .setColor('#5865F2')
      .setDescription(section.description || 'No description')
      .addFields({ name: 'Entries', value: entryList, inline: false })
      .setTimestamp()
      .setAuthor({ 
        name: 'LoreBot', 
        iconURL: message.client.user?.displayAvatarURL() 
      })
      .setFooter({ 
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      });
  }, 10);

  await createPagination(message, pages);
}

module.exports = { handleSectionCommand };
