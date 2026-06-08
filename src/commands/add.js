const { run, get, all } = require('../database');
const { inlineCode, bold, italic, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require('discord.js');

async function handleAddCommand(message, args) {
  const guildId = message.guild.id;
  const authorId = message.author.id;

  // No args → show a modal via button
  if (args.length === 0) {
    const button = new ButtonBuilder()
      .setCustomId('add_modal_open')
      .setLabel('📝 Open Add Form')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(button);
    const prompt = await message.reply({ content: '📝 Click to open the entry form:', components: [row] });

    const btnCollector = prompt.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    btnCollector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== message.author.id) {
        await btnInteraction.reply({ content: '❌ Only the command author can use this.', ephemeral: true });
        return;
      }
      btnCollector.stop('opened');

      const modal = new ModalBuilder()
        .setCustomId('add_entry_modal')
        .setTitle('Add New Entry');

      const sectionInput = new TextInputBuilder()
        .setCustomId('section')
        .setLabel('Section (optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder('e.g. memes');

      const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Entry Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('e.g. juan');

      const contentInput = new TextInputBuilder()
        .setCustomId('content')
        .setLabel('Content')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('The entry text content…')
        .setMaxLength(2000);

      modal.addComponents(
        new ActionRowBuilder().addComponents(sectionInput),
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(contentInput),
      );

      await btnInteraction.showModal(modal);

      try {
        const modalSubmit = await btnInteraction.awaitModalSubmit({ time: 120000 });
        const sectionName = modalSubmit.fields.getTextInputValue('section').trim() || null;
        const entryName = modalSubmit.fields.getTextInputValue('name').trim();
        const entryContent = modalSubmit.fields.getTextInputValue('content').trim();

        let sectionId = null;
        if (sectionName) {
          const sec = await get('SELECT id FROM sections WHERE guild_id = ? AND name = ?', [guildId, sectionName]);
          if (!sec) {
            await modalSubmit.reply(`❌ Section ${inlineCode(sectionName)} does not exist.`);
            return;
          }
          sectionId = sec.id;
        }

        await prompt.edit({ components: [] }).catch(() => {});
        try {
          await run(
            'INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)',
            [sectionId, entryName, entryContent, authorId]
          );
          let response = `✅ Message ${bold(entryName)} saved successfully`;
          if (sectionName) response += ` in section ${inlineCode(sectionName)}`;
          response += '.';
          await modalSubmit.reply(response);
        } catch (err) {
          if (err.message.includes('UNIQUE')) {
            await modalSubmit.reply(`❌ An entry named ${inlineCode(entryName)} already exists in this section.`);
          } else {
            await modalSubmit.reply('❌ Error saving entry.');
          }
        }
      } catch {
        await prompt.edit({ content: italic('⏱️ Form expired.'), components: [] }).catch(() => {});
      }
    });

    btnCollector.on('end', (collected) => {
      if (collected.size === 0) {
        prompt.edit({ content: '⏱️ Add form expired.', components: [] }).catch(() => {});
      }
    });

    return;
  }

  // Parse arguments
  let sectionName = null;
  let name = null;
  let content = null;
  let images = [];
  let gifs = [];
  let videos = [];

  // Check if first arg is a section name (followed by entry name)
  let argIndex = 0;
  
  // Parse section if provided
  if (args.length >= 2) {
    const potentialSection = args[0];
    const section = await get('SELECT id FROM sections WHERE guild_id = ? AND name = ?', [guildId, potentialSection]);
    
    if (section) {
      sectionName = potentialSection;
      argIndex = 1;
    }
  }

  name = args[argIndex];
  
  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!add [section] <name> "content" [--img url] [--gif url] [--video url]')}`);
    return;
  }

  // Find content (quoted string)
  const contentMatch = args.slice(argIndex + 1).join(' ').match(/"([^"]+)"/);
  if (contentMatch) {
    content = contentMatch[1];
  }

  // Parse multimedia flags
  const fullArgs = args.slice(argIndex + 1).join(' ');
  
  const imgMatch = fullArgs.match(/--img\s+([^\s]+)/);
  if (imgMatch) {
    images = [imgMatch[1]];
  }

  const gifMatch = fullArgs.match(/--gif\s+([^\s]+)/);
  if (gifMatch) {
    gifs = [gifMatch[1]];
  }

  const videoMatch = fullArgs.match(/--video\s+([^\s]+)/);
  if (videoMatch) {
    videos = [videoMatch[1]];
  }

  if (!content && images.length === 0 && gifs.length === 0 && videos.length === 0) {
    await message.reply('❌ You must provide content or at least one media attachment.');
    return;
  }

  try {
    // Get or create section
    let sectionId = null;
    if (sectionName) {
    const section = await get('SELECT id FROM sections WHERE guild_id = ? AND name = ?', [guildId, sectionName]);
      if (section) {
        sectionId = section.id;
      } else {
        await message.reply(`❌ Section ${inlineCode(sectionName)} does not exist.`);
        return;
      }
    }

    // Insert entry
    const result = await run(
      'INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)',
      [sectionId, name, content, authorId]
    );
    const entryId = result.lastID;

    // Insert attachments
    for (const img of images) {
      await run('INSERT INTO attachments (entry_id, type, url) VALUES (?, ?, ?)', [entryId, 'image', img]);
    }
    for (const gif of gifs) {
      await run('INSERT INTO attachments (entry_id, type, url) VALUES (?, ?, ?)', [entryId, 'gif', gif]);
    }
    for (const video of videos) {
      await run('INSERT INTO attachments (entry_id, type, url) VALUES (?, ?, ?)', [entryId, 'video', video]);
    }

    let response = `✅ Message ${bold(name)} saved successfully`;
    if (sectionName) {
      response += ` in section ${inlineCode(sectionName)}`;
    }
    response += '.';

    await message.reply(response);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      await message.reply(`❌ An entry named ${inlineCode(name)} already exists in this section.`);
    } else {
      throw error;
    }
  }
}

module.exports = { handleAddCommand };
