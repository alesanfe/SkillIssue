const { run, get } = require('../database');
const { inlineCode, bold, italic, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require('discord.js');

async function handleEditCommand(message, args) {
  const name = args[0];

  if (!name) {
    await message.reply(`❌ Usage: ${inlineCode('!edit <name> [new content]')}`);
    return;
  }

  // Only name provided → open modal pre-filled with current content
  if (args.length === 1) {
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);
    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    const button = new ButtonBuilder()
      .setCustomId('edit_modal_open')
      .setLabel(`✏️ Edit "${name}"`)
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(button);
    const prompt = await message.reply({ content: `✏️ Click to edit ${bold(name)}:`, components: [row] });

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
        .setCustomId('edit_entry_modal')
        .setTitle(`Edit: ${name}`);

      const contentInput = new TextInputBuilder()
        .setCustomId('content')
        .setLabel('New Content')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(entry.content || '')
        .setMaxLength(2000);

      modal.addComponents(new ActionRowBuilder().addComponents(contentInput));
      await btnInteraction.showModal(modal);

      try {
        const modalSubmit = await btnInteraction.awaitModalSubmit({ time: 120000 });
        const newContent = modalSubmit.fields.getTextInputValue('content').trim();
        await prompt.edit({ components: [] }).catch(() => {});
        await run('UPDATE entries SET content = ? WHERE name = ?', [newContent, name]);
        await modalSubmit.reply(`✅ Entry ${bold(name)} updated successfully.`);
      } catch {
        await prompt.edit({ content: italic('⏱️ Edit form expired.'), components: [] }).catch(() => {});
      }
    });

    btnCollector.on('end', (collected) => {
      if (collected.size === 0) {
        prompt.edit({ content: '⏱️ Edit form expired.', components: [] }).catch(() => {});
      }
    });

    return;
  }

  // Name + inline content provided → direct edit
  const newContent = args.slice(1).join(' ');

  try {
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    await run('UPDATE entries SET content = ? WHERE name = ?', [newContent, name]);
    await message.reply(`✅ Entry ${bold(name)} updated successfully.`);
  } catch (error) {
    console.error('Error editing entry:', error);
    await message.reply('❌ Error editing entry.');
  }
}

module.exports = { handleEditCommand };
