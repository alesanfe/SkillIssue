const { run, get } = require('../database');
const { inlineCode, bold, italic, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

async function handleDeleteCommand(message, args) {
  if (args.length < 1) {
    await message.reply(`❌ Usage: ${inlineCode('!delete <name>')}`);
    return;
  }

  const name = args[0];

  try {
    const entry = await get('SELECT * FROM entries WHERE name = ?', [name]);

    if (!entry) {
      await message.reply(`❌ Entry ${inlineCode(name)} not found.`);
      return;
    }

    const confirmBtn = new ButtonBuilder()
      .setCustomId('delete_confirm')
      .setLabel('🗑️ Delete')
      .setStyle(ButtonStyle.Danger);

    const cancelBtn = new ButtonBuilder()
      .setCustomId('delete_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);
    const prompt = await message.reply({
      content: `⚠️ Are you sure you want to delete ${bold(name)}? This cannot be undone.`,
      components: [row],
    });

    const collector = prompt.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id) {
        await i.reply({ content: '❌ Only the command author can confirm this.', ephemeral: true });
        return;
      }

      collector.stop(i.customId);

      if (i.customId === 'delete_confirm') {
        await run('DELETE FROM entries WHERE name = ?', [name]);
        await i.update({ content: `✅ Entry ${bold(name)} deleted.`, components: [] });
      } else {
        await i.update({ content: italic('Deletion cancelled.'), components: [] });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        prompt.edit({ content: italic('⏱️ Deletion timed out.'), components: [] }).catch(() => {});
      }
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    await message.reply('❌ Error deleting entry.');
  }
}

module.exports = { handleDeleteCommand };
