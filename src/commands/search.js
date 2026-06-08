const { all } = require('../database');
const { createPagination, createPaginatedEmbeds } = require('../utils/pagination');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, inlineCode, italic } = require('discord.js');
const { handleShowCommand } = require('./show');

async function handleSearchCommand(message, args) {
  const guildId = message.guild.id;
  const query = args[0];

  if (!query) {
    await message.reply(`❌ Usage: ${inlineCode('!search <term>')}`);
    return;
  }

  const searchTerm = `%${query}%`;

  const results = await all(`
    SELECT DISTINCT e.id, e.name, e.content, s.name as section_name
    FROM entries e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN tags t ON e.id = t.entry_id
    WHERE (e.name LIKE ? OR e.content LIKE ? OR t.tag LIKE ?)
    AND (s.guild_id = ? OR s.guild_id IS NULL)
  `, [searchTerm, searchTerm, searchTerm, guildId]);

  if (results.length === 0) {
    await message.reply(`❌ No results found for ${inlineCode(query)}.`);
    return;
  }

  const pages = createPaginatedEmbeds(results, (pageItems, pageIndex, totalPages) => {
    const resultList = pageItems
      .map(r => {
        const sectionPrefix = r.section_name ? `${italic(r.section_name)}.` : '';
        const preview = r.content?.substring(0, 60) || italic('no content');
        const ellipsis = r.content?.length > 60 ? '…' : '';
        return `📄 **${sectionPrefix}${r.name}**: ${preview}${ellipsis}`;
      })
      .join('\n');

    return new EmbedBuilder()
      .setTitle(`🔍 Search Results: "${query}"`)
      .setColor('#5865F2')
      .setDescription(resultList)
      .setFooter({ text: `${results.length} result(s) • Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp()
      .setAuthor({ name: 'LoreBot', iconURL: message.client.user?.displayAvatarURL() });
  }, 10);

  await createPagination(message, pages);

  // Send a select menu for the first page (up to 25 options, Discord limit)
  const selectOptions = results.slice(0, 25).map(r => {
    const label = (r.section_name ? `${r.section_name}.` : '') + r.name;
    const description = r.content?.substring(0, 50) || 'No content';
    return new StringSelectMenuOptionBuilder()
      .setLabel(label.substring(0, 100))
      .setDescription(description.substring(0, 100))
      .setValue(r.id.toString());
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('search_select')
    .setPlaceholder('📄 Show an entry from results…')
    .addOptions(selectOptions);

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);
  const selectMsg = await message.channel.send({ components: [selectRow] });

  const collector = selectMsg.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      await interaction.reply({ content: '❌ Only the command author can use this menu.', ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    const selectedId = interaction.values[0];
    const selectedEntry = results.find(r => r.id.toString() === selectedId);
    if (!selectedEntry) {
      await interaction.followUp({ content: '❌ Entry not found.', ephemeral: true });
      return;
    }
    collector.stop('selected');
    await handleShowCommand(message, [selectedEntry.name]);
  });

  collector.on('end', async () => {
    const disabledMenu = new StringSelectMenuBuilder()
      .setCustomId('search_select_disabled')
      .setPlaceholder('⏱️ Selection expired')
      .addOptions(selectOptions)
      .setDisabled(true);
    await selectMsg.edit({ components: [new ActionRowBuilder().addComponents(disabledMenu)] }).catch(() => {});
  });
}

module.exports = { handleSearchCommand };
