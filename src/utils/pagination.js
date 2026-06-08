const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

/**
 * Creates a paginated embed system
 * @param {Object} message - Discord message object
 * @param {Array} pages - Array of embed objects
 * @param {Object} options - Options for pagination
 * @param {number} options.timeout - Time in ms before buttons disable (default: 60000)
 * @param {string} options.userId - User ID who can interact (default: message.author.id)
 */
async function createPagination(message, pages, options = {}) {
  const { timeout = 60000, userId = message.author.id } = options;
  
  if (pages.length === 0) {
    await message.reply('[X] No pages to display.');
    return;
  }

  if (pages.length === 1) {
    await message.reply({ embeds: [pages[0]] });
    return;
  }

  let currentPage = 0;

  const buildRow = (page, total) => new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('page_indicator')
        .setLabel(`${page + 1} / ${total}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === total - 1)
    );

  const row = buildRow(currentPage, pages.length);

  const sentMessage = await message.reply({ 
    embeds: [pages[currentPage]], 
    components: [row] 
  });

  const collector = sentMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeout,
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== userId) {
      await i.reply({ content: '❌ Only the command author can navigate pages.', ephemeral: true });
      return;
    }

    await i.deferUpdate();

    if (i.customId === 'prev') {
      currentPage = Math.max(0, currentPage - 1);
    } else if (i.customId === 'next') {
      currentPage = Math.min(pages.length - 1, currentPage + 1);
    }

    await i.editReply({ 
      embeds: [pages[currentPage]], 
      components: [buildRow(currentPage, pages.length)] 
    });
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time') {
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('page_indicator')
            .setLabel(`${currentPage + 1} / ${pages.length}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
      
      await sentMessage.edit({ components: [disabledRow] }).catch(() => {});
    }
  });
}

/**
 * Creates paginated embeds from an array of items
 * @param {Array} items - Array of items to paginate
 * @param {Function} embedBuilder - Function that takes (item, index, totalPages) and returns an embed
 * @param {number} itemsPerPage - Items per page (default: 10)
 * @returns {Array} Array of embeds
 */
function createPaginatedEmbeds(items, embedBuilder, itemsPerPage = 10) {
  const pages = [];
  const totalPages = Math.ceil(items.length / itemsPerPage);

  for (let i = 0; i < totalPages; i++) {
    const pageItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
    const embed = embedBuilder(pageItems, i, totalPages);
    const existingFooter = embed.data?.footer;
    if (existingFooter) {
      embed.setFooter({ text: `${existingFooter.text} • Page ${i + 1}/${totalPages}`, iconURL: existingFooter.icon_url });
    } else {
      embed.setFooter({ text: `Page ${i + 1}/${totalPages}` });
    }
    pages.push(embed);
  }

  return pages;
}

module.exports = { createPagination, createPaginatedEmbeds };
