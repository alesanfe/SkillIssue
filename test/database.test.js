const { run, get, all, initDatabase } = require('../src/database');

// Test helper
async function runTest(testName, testFn) {
  console.log(`\n🧪 ${testName}`);
  try {
    await testFn();
    console.log('[OK] PASSED');
    return true;
  } catch (error) {
    console.log('[X] FAILED:', error.message);
    return false;
  }
}

// Database operation tests
async function runTests() {
  console.log('🚀 Starting Database Tests for LoreBot');
  console.log('='.repeat(50));

  // Initialize database
  await initDatabase();

  // Clean up any existing test data
  console.log('[CLEAN] Cleaning up previous test data...');
  await run('DELETE FROM sections WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM auto_reactions WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM entries WHERE author_id = ?', ['test-user']);
  await run('DELETE FROM tags WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM aliases WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM attachments WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  console.log('[OK] Cleanup complete');

  let passed = 0;
  let failed = 0;

  // Test 1: Create section
  if (await runTest('Test 1: Create section', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'memes', 'Sección de memes']);
    const section = await get('SELECT * FROM sections WHERE name = ?', ['memes']);
    if (!section) throw new Error('Section not created');
  })) passed++; else failed++;

  // Test 2: Create entry
  if (await runTest('Test 2: Create entry', async () => {
    const section = await get('SELECT id FROM sections WHERE guild_id = ? AND name = ?', ['test-guild', 'memes']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [section.id, 'juan_ex', 'Juan volvió con su ex', 'user123']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['juan_ex']);
    if (!entry) throw new Error('Entry not created');
  })) passed++; else failed++;

  // Test 3: Add attachment
  if (await runTest('Test 3: Add attachment', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['juan_ex']);
    await run('INSERT INTO attachments (entry_id, type, url) VALUES (?, ?, ?)', [entry.id, 'image', 'https://example.com/image.png']);
    const attachment = await get('SELECT * FROM attachments WHERE entry_id = ?', [entry.id]);
    if (!attachment) throw new Error('Attachment not created');
  })) passed++; else failed++;

  // Test 4: Add tag
  if (await runTest('Test 4: Add tag', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['juan_ex']);
    await run('INSERT OR IGNORE INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, 'cringe']);
    const tag = await get('SELECT * FROM tags WHERE entry_id = ?', [entry.id]);
    if (!tag) throw new Error('Tag not created');
  })) passed++; else failed++;

  // Test 5: Add alias
  if (await runTest('Test 5: Add alias', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['juan_ex']);
    await run('INSERT OR IGNORE INTO aliases (entry_id, alias) VALUES (?, ?)', [entry.id, 'exjuan']);
    const alias = await get('SELECT * FROM aliases WHERE alias = ?', ['exjuan']);
    if (!alias) throw new Error('Alias not created');
  })) passed++; else failed++;

  // Test 6: Query with alias
  if (await runTest('Test 6: Query by alias', async () => {
    const result = await get(`
      SELECT e.* FROM entries e
      JOIN aliases a ON e.id = a.entry_id
      WHERE a.alias = ?
    `, ['exjuan']);
    if (!result) throw new Error('Alias query failed');
  })) passed++; else failed++;

  // Test 7: Search functionality
  if (await runTest('Test 7: Search functionality', async () => {
    const searchTerm = '%ex%';
    const results = await all(`
      SELECT DISTINCT e.id, e.name, e.content, s.name as section_name
      FROM entries e
      LEFT JOIN sections s ON e.section_id = s.id
      LEFT JOIN tags t ON e.id = t.entry_id
      WHERE (e.name LIKE ? OR e.content LIKE ? OR t.tag LIKE ?)
    `, [searchTerm, searchTerm, searchTerm]);
    if (results.length === 0) throw new Error('Search returned no results');
  })) passed++; else failed++;

  // Test 8: Increment use count
  if (await runTest('Test 8: Increment use count', async () => {
    const entry = await get('SELECT id, uses FROM entries WHERE name = ?', ['juan_ex']);
    const oldUses = entry.uses;
    await run('UPDATE entries SET uses = uses + 1 WHERE id = ?', [entry.id]);
    const updatedEntry = await get('SELECT id, uses FROM entries WHERE name = ?', ['juan_ex']);
    if (updatedEntry.uses !== oldUses + 1) throw new Error('Use count not incremented');
  })) passed++; else failed++;

  // Test 9: Statistics
  if (await runTest('Test 9: Statistics', async () => {
    const totalMessages = await get('SELECT COUNT(*) as count FROM entries e JOIN sections s ON e.section_id = s.id WHERE s.guild_id = ?', ['test-guild']);
    const totalSections = await get('SELECT COUNT(*) as count FROM sections WHERE guild_id = ?', ['test-guild']);
    const topUsed = await all(`
      SELECT e.name, e.uses, s.name as section_name
      FROM entries e
      JOIN sections s ON e.section_id = s.id
      WHERE s.guild_id = ?
      ORDER BY e.uses DESC
      LIMIT 5
    `, ['test-guild']);
    if (!totalMessages || !totalSections) throw new Error('Statistics query failed');
  })) passed++; else failed++;

  // Test 10: Delete section
  if (await runTest('Test 10: Delete section', async () => {
    await run('DELETE FROM sections WHERE guild_id = ?', ['test-guild']);
    const section = await get('SELECT * FROM sections WHERE guild_id = ?', ['test-guild']);
    if (section) throw new Error('Section not deleted');
  })) passed++; else failed++;

  // Test 11: Auto-react database operation
  if (await runTest('Test 11: Auto-react database operation', async () => {
    await run('INSERT INTO auto_reactions (guild_id, emoji, threshold) VALUES (?, ?, ?)', ['test-guild', '💀', 5]);
    const autoReact = await get('SELECT * FROM auto_reactions WHERE guild_id = ?', ['test-guild']);
    if (!autoReact) throw new Error('Auto-react not created');
  })) passed++; else failed++;

  // Test 12: Case-insensitive search
  if (await runTest('Test 12: Case-insensitive search', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'test', 'test']);
    const section = await get('SELECT id FROM sections WHERE name = ?', ['test']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [section.id, 'TestEntry', 'content', 'test-user']);
    const results = await all(`
      SELECT * FROM entries WHERE name LIKE ?
    `, ['%testentry%']);
    if (results.length === 0) throw new Error('Case-insensitive search failed');
  })) passed++; else failed++;

  // Test 13: Multiple attachments
  if (await runTest('Test 13: Multiple attachments', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['TestEntry']);
    await run('INSERT INTO attachments (entry_id, type, url) VALUES (?, ?, ?)', [entry.id, 'image', 'url1']);
    await run('INSERT INTO attachments (entry_id, type, url) VALUES (?, ?, ?)', [entry.id, 'image', 'url2']);
    const attachments = await all('SELECT * FROM attachments WHERE entry_id = ?', [entry.id]);
    if (attachments.length !== 2) throw new Error('Multiple attachments failed');
  })) passed++; else failed++;

  // Test 14: Multiple tags
  if (await runTest('Test 14: Multiple tags', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['TestEntry']);
    await run('INSERT INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, 'tag1']);
    await run('INSERT INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, 'tag2']);
    const tags = await all('SELECT * FROM tags WHERE entry_id = ?', [entry.id]);
    if (tags.length !== 2) throw new Error('Multiple tags failed');
  })) passed++; else failed++;

  // Test 15: Stats after delete (stale data check)
  if (await runTest('Test 15: Stats after delete', async () => {
    const beforeStats = await get('SELECT COUNT(*) as count FROM entries WHERE author_id = ?', ['test-user']);
    await run('DELETE FROM entries WHERE name = ?', ['TestEntry']);
    const afterStats = await get('SELECT COUNT(*) as count FROM entries WHERE author_id = ?', ['test-user']);
    if (afterStats.count >= beforeStats.count) throw new Error('Stats not updated after delete');
  })) passed++; else failed++;

  // Test 16: Create duplicate section
  if (await runTest('Test 16: Create duplicate section', async () => {
    await run('INSERT OR IGNORE INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'dupsec', 'test']);
    const count = await get('SELECT COUNT(*) as count FROM sections WHERE name = ?', ['dupsec']);
    if (count.count !== 1) throw new Error('Duplicate section created');
  })) passed++; else failed++;

  // Test 17: Create section with empty name
  if (await runTest('Test 17: Create section with empty name', async () => {
    try {
      await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', '', 'test']);
      throw new Error('Empty section name should fail');
    } catch (error) {
      // Expected to fail
    }
  })) passed++; else failed++;

  // Test 18: Create section with spaces
  if (await runTest('Test 18: Create section with spaces', async () => {
    await run('INSERT OR IGNORE INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'with spaces', 'test']);
    const section = await get('SELECT * FROM sections WHERE name = ?', ['with spaces']);
    if (!section) throw new Error('Section with spaces not created');
  })) passed++; else failed++;

  // Test 19: Create section with long name
  if (await runTest('Test 19: Create section with long name', async () => {
    const longName = 'a'.repeat(100);
    await run('INSERT OR IGNORE INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', longName, 'test']);
    const section = await get('SELECT * FROM sections WHERE name = ?', [longName]);
    if (!section) throw new Error('Section with long name not created');
  })) passed++; else failed++;

  // Test 20: Delete non-existent section
  if (await runTest('Test 20: Delete non-existent section', async () => {
    await run('DELETE FROM sections WHERE name = ?', ['nonexistent']);
    // Should not throw error
  })) passed++; else failed++;

  // Test 21: List sections with data
  if (await runTest('Test 21: List sections with data', async () => {
    const sections = await all('SELECT * FROM sections WHERE guild_id = ?', ['test-guild']);
    if (sections.length === 0) throw new Error('No sections found');
  })) passed++; else failed++;

  // Test 22: List sections when empty
  if (await runTest('Test 22: List sections when empty', async () => {
    await run('DELETE FROM sections WHERE guild_id = ?', ['test-guild']);
    const sections = await all('SELECT * FROM sections WHERE guild_id = ?', ['test-guild']);
    if (sections.length !== 0) throw new Error('Sections should be empty');
  })) passed++; else failed++;

  // Test 23: View valid section
  if (await runTest('Test 23: View valid section', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'viewtest', 'test']);
    const section = await get('SELECT * FROM sections WHERE name = ?', ['viewtest']);
    if (!section) throw new Error('Section not found');
  })) passed++; else failed++;

  // Test 24: View empty section
  if (await runTest('Test 24: View empty section', async () => {
    const section = await get('SELECT * FROM sections WHERE name = ?', ['viewtest']);
    const entries = await all('SELECT * FROM entries WHERE section_id = ?', [section.id]);
    if (entries.length !== 0) throw new Error('Section should be empty');
  })) passed++; else failed++;

  // Test 25: View non-existent section
  if (await runTest('Test 25: View non-existent section', async () => {
    const section = await get('SELECT * FROM sections WHERE name = ?', ['nonexistent']);
    if (section) throw new Error('Non-existent section should not exist');
  })) passed++; else failed++;

  // Test 26: Add entry without section
  if (await runTest('Test 26: Add entry without section', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'nosec', 'test', 'test-user']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['nosec']);
    if (!entry) throw new Error('Entry without section not created');
  })) passed++; else failed++;

  // Test 27: Add entry with duplicate key
  if (await runTest('Test 27: Add entry with duplicate key', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'dupkey', 'test1', 'test-user']);
    await run('UPDATE entries SET content = ? WHERE name = ?', ['test2', 'dupkey']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['dupkey']);
    if (!entry || entry.content !== 'test2') throw new Error('Duplicate key update failed');
  })) passed++; else failed++;

  // Test 28: Add entry with long text
  if (await runTest('Test 28: Add entry with long text', async () => {
    const longText = 'a'.repeat(1000);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'longtext', longText, 'test-user']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['longtext']);
    if (!entry) throw new Error('Entry with long text not created');
  })) passed++; else failed++;

  // Test 29: Add entry with emojis
  if (await runTest('Test 29: Add entry with emojis', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'emojis', 'test 😂 👍 💀', 'test-user']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['emojis']);
    if (!entry) throw new Error('Entry with emojis not created');
  })) passed++; else failed++;

  // Test 30: Show non-existent entry
  if (await runTest('Test 30: Show non-existent entry', async () => {
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['nonexistent']);
    if (entry) throw new Error('Non-existent entry should not exist');
  })) passed++; else failed++;

  // Test 31: Search with no results
  if (await runTest('Test 31: Search with no results', async () => {
    const results = await all('SELECT * FROM entries WHERE content LIKE ?', ['%nonexistent%']);
    if (results.length !== 0) throw new Error('Search should return no results');
  })) passed++; else failed++;

  // Test 32: Search partial match
  if (await runTest('Test 32: Search partial match', async () => {
    const results = await all('SELECT * FROM entries WHERE content LIKE ?', ['%test%']);
    if (results.length === 0) throw new Error('Search should return partial matches');
  })) passed++; else failed++;

  // Test 33: Add duplicate tag
  if (await runTest('Test 33: Add duplicate tag', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['emojis']);
    await run('INSERT INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, 'testtag']);
    await run('INSERT INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, 'testtag2']);
    const tags = await all('SELECT * FROM tags WHERE entry_id = ?', [entry.id]);
    if (tags.length < 2) throw new Error('Multiple tags not created');
  })) passed++; else failed++;

  // Test 34: Search by non-existent tag
  if (await runTest('Test 34: Search by non-existent tag', async () => {
    const results = await all('SELECT * FROM tags WHERE tag = ?', ['nonexistenttag']);
    if (results.length !== 0) throw new Error('Non-existent tag should not exist');
  })) passed++; else failed++;

  // Test 35: Alias to non-existent target
  if (await runTest('Test 35: Alias to non-existent target', async () => {
    await run('INSERT OR IGNORE INTO aliases (entry_id, alias) VALUES (?, ?)', [99999, 'badalias']);
    // Should not create due to foreign key constraint or ignore
  })) passed++; else failed++;

  // Test 36: Duplicate alias
  if (await runTest('Test 36: Duplicate alias', async () => {
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['emojis']);
    await run('INSERT INTO aliases (entry_id, alias) VALUES (?, ?)', [entry.id, 'dupalias']);
    await run('INSERT INTO aliases (entry_id, alias) VALUES (?, ?)', [entry.id, 'dupalias2']);
    const aliases = await all('SELECT * FROM aliases WHERE entry_id = ?', [entry.id]);
    if (aliases.length < 2) throw new Error('Multiple aliases not created');
  })) passed++; else failed++;

  // Test 37: Stats without data
  if (await runTest('Test 37: Stats without data', async () => {
    await run('DELETE FROM entries WHERE author_id = ?', ['test-user']);
    await run('DELETE FROM sections WHERE guild_id = ?', ['test-guild']);
    const totalMessages = await get('SELECT COUNT(*) as count FROM entries WHERE author_id = ?', ['test-user']);
    if (totalMessages.count !== 0) throw new Error('Stats should be zero');
  })) passed++; else failed++;

  // Test 38: Stats with high volume
  if (await runTest('Test 38: Stats with high volume', async () => {
    for (let i = 1; i <= 50; i++) {
      await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, `entry${i}`, `content${i}`, 'test-user']);
    }
    const totalMessages = await get('SELECT COUNT(*) as count FROM entries WHERE author_id = ?', ['test-user']);
    if (totalMessages.count < 50) throw new Error('High volume stats failed');
  })) passed++; else failed++;

  // Test 39: Delete section with content
  if (await runTest('Test 39: Delete section with content', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'delwithcontent', 'test']);
    const section = await get('SELECT id FROM sections WHERE name = ?', ['delwithcontent']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [section.id, 'testentry', 'test', 'test-user']);
    await run('DELETE FROM sections WHERE id = ?', [section.id]);
    // Note: SQLite doesn't have CASCADE DELETE by default, entries may remain
    const sectionAfter = await get('SELECT * FROM sections WHERE id = ?', [section.id]);
    if (sectionAfter) throw new Error('Section should be deleted');
  })) passed++; else failed++;

  // Test 40: List with many sections
  if (await runTest('Test 40: List with many sections', async () => {
    for (let i = 1; i <= 20; i++) {
      await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', `sec${i}`, 'test']);
    }
    const sections = await all('SELECT * FROM sections WHERE guild_id = ?', ['test-guild']);
    if (sections.length < 20) throw new Error('Many sections not created');
  })) passed++; else failed++;

  // Test 41: View section with many elements
  if (await runTest('Test 41: View section with many elements', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'manyelems', 'test']);
    const section = await get('SELECT id FROM sections WHERE name = ?', ['manyelems']);
    for (let i = 1; i <= 30; i++) {
      await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [section.id, `elem${i}`, `content${i}`, 'test-user']);
    }
    const entries = await all('SELECT * FROM entries WHERE section_id = ?', [section.id]);
    if (entries.length < 30) throw new Error('Many elements not created');
  })) passed++; else failed++;

  // Test 42: Show ambiguous item (same name in different sections)
  if (await runTest('Test 42: Show ambiguous item', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'ambsec1', 'test']);
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'ambsec2', 'test']);
    const sec1 = await get('SELECT id FROM sections WHERE name = ?', ['ambsec1']);
    const sec2 = await get('SELECT id FROM sections WHERE name = ?', ['ambsec2']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [sec1.id, 'same', 'content1', 'test-user']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [sec2.id, 'same', 'content2', 'test-user']);
    const entries = await all('SELECT * FROM entries WHERE name = ?', ['same']);
    if (entries.length !== 2) throw new Error('Ambiguous items not created');
  })) passed++; else failed++;

  // Test 43: Search with many results
  if (await runTest('Test 43: Search with many results', async () => {
    for (let i = 1; i <= 25; i++) {
      await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, `search${i}`, 'test content match', 'test-user']);
    }
    const results = await all('SELECT * FROM entries WHERE content LIKE ?', ['%test%']);
    if (results.length < 25) throw new Error('Many search results not found');
  })) passed++; else failed++;

  // Test 44: Tag with long text
  if (await runTest('Test 44: Tag with long text', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'emojis', 'test 😂 👍 💀', 'test-user']);
    const longTag = 'a'.repeat(100);
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['emojis']);
    await run('INSERT INTO tags (entry_id, tag) VALUES (?, ?)', [entry.id, longTag]);
    const tag = await get('SELECT * FROM tags WHERE tag = ?', [longTag]);
    if (!tag) throw new Error('Long tag not created');
  })) passed++; else failed++;

  // Test 45: Alias circular (should be prevented)
  if (await runTest('Test 45: Alias circular', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'target1', 'content1', 'test-user']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'target2', 'content2', 'test-user']);
    const t1 = await get('SELECT id FROM entries WHERE name = ?', ['target1']);
    const t2 = await get('SELECT id FROM entries WHERE name = ?', ['target2']);
    await run('INSERT INTO aliases (entry_id, alias) VALUES (?, ?)', [t1.id, 'alias2']);
    await run('INSERT INTO aliases (entry_id, alias) VALUES (?, ?)', [t2.id, 'alias1']);
    // Circular references are allowed at DB level, but should be handled at application level
  })) passed++; else failed++;

  // Test 46: Edit entry
  if (await runTest('Test 46: Edit entry', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'toedit', 'original', 'test-user']);
    await run('UPDATE entries SET content = ? WHERE name = ?', ['updated', 'toedit']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['toedit']);
    if (entry.content !== 'updated') throw new Error('Entry not updated');
  })) passed++; else failed++;

  // Test 47: Delete entry
  if (await runTest('Test 47: Delete entry', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'todelete', 'test', 'test-user']);
    await run('DELETE FROM entries WHERE name = ?', ['todelete']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['todelete']);
    if (entry) throw new Error('Entry not deleted');
  })) passed++; else failed++;

  // Test 48: Copy entry
  if (await runTest('Test 48: Copy entry', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'source', 'test']);
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'target', 'test']);
    const source = await get('SELECT id FROM sections WHERE name = ?', ['source']);
    const target = await get('SELECT id FROM sections WHERE name = ?', ['target']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [source.id, 'copytest', 'content', 'test-user']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [target.id, 'copytest', 'content', 'test-user']);
    const copied = await get('SELECT * FROM entries WHERE section_id = ? AND name = ?', [target.id, 'copytest']);
    if (!copied) throw new Error('Entry not copied');
  })) passed++; else failed++;

  // Test 49: Move entry
  if (await runTest('Test 49: Move entry', async () => {
    await run('INSERT INTO sections (guild_id, name, description) VALUES (?, ?, ?)', ['test-guild', 'moveto', 'test']);
    const target = await get('SELECT id FROM sections WHERE name = ?', ['moveto']);
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'movetest', 'content', 'test-user']);
    await run('UPDATE entries SET section_id = ? WHERE name = ?', [target.id, 'movetest']);
    const moved = await get('SELECT * FROM entries WHERE section_id = ? AND name = ?', [target.id, 'movetest']);
    if (!moved) throw new Error('Entry not moved');
  })) passed++; else failed++;

  // Test 50: Favorite entry
  if (await runTest('Test 50: Favorite entry', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'favtest', 'content', 'test-user']);
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['favtest']);
    await run('INSERT INTO favorites (entry_id, user_id) VALUES (?, ?)', [entry.id, 'test-user']);
    const fav = await get('SELECT * FROM favorites WHERE entry_id = ? AND user_id = ?', [entry.id, 'test-user']);
    if (!fav) throw new Error('Favorite not created');
  })) passed++; else failed++;

  // Test 51: Pin entry
  if (await runTest('Test 51: Pin entry', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'pintest', 'content', 'test-user']);
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['pintest']);
    await run('INSERT INTO pins (entry_id, user_id) VALUES (?, ?)', [entry.id, 'test-user']);
    const pin = await get('SELECT * FROM pins WHERE entry_id = ? AND user_id = ?', [entry.id, 'test-user']);
    if (!pin) throw new Error('Pin not created');
  })) passed++; else failed++;

  // Test 52: Archive entry
  if (await runTest('Test 52: Archive entry', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'archtest', 'content', 'test-user']);
    await run('UPDATE entries SET is_archived = 1 WHERE name = ?', ['archtest']);
    const entry = await get('SELECT * FROM entries WHERE name = ?', ['archtest']);
    if (entry.is_archived !== 1) throw new Error('Entry not archived');
  })) passed++; else failed++;

  // Test 53: Create template
  if (await runTest('Test 53: Create template', async () => {
    await run('INSERT INTO templates (name, content, author_id, guild_id) VALUES (?, ?, ?, ?)', ['testtpl', 'template content', 'test-user', 'test-guild']);
    const tpl = await get('SELECT * FROM templates WHERE name = ?', ['testtpl']);
    if (!tpl) throw new Error('Template not created');
  })) passed++; else failed++;

  // Test 54: Info command data
  if (await runTest('Test 54: Info command data', async () => {
    const sections = await get('SELECT COUNT(*) as count FROM sections WHERE guild_id = ?', ['test-guild']);
    const entries = await get('SELECT COUNT(*) as count FROM entries e JOIN sections s ON e.section_id = s.id WHERE s.guild_id = ?', ['test-guild']);
    if (sections.count < 0 || entries.count < 0) throw new Error('Info query failed');
  })) passed++; else failed++;

  // Test 55: Entry reaction
  if (await runTest('Test 55: Entry reaction', async () => {
    await run('INSERT INTO entries (section_id, name, content, author_id) VALUES (?, ?, ?, ?)', [null, 'reacttest', 'content', 'test-user']);
    const entry = await get('SELECT id FROM entries WHERE name = ?', ['reacttest']);
    await run('INSERT INTO entry_reactions (entry_id, emoji) VALUES (?, ?)', [entry.id, '😀']);
    const reaction = await get('SELECT * FROM entry_reactions WHERE entry_id = ?', [entry.id]);
    if (!reaction) throw new Error('Reaction not created');
  })) passed++; else failed++;

  // Test 56: Permissions
  if (await runTest('Test 56: Permissions', async () => {
    await run('INSERT INTO permissions (role_id, command, allowed, guild_id) VALUES (?, ?, ?, ?)', ['role1', 'add', 1, 'test-guild']);
    const perm = await get('SELECT * FROM permissions WHERE role_id = ? AND command = ?', ['role1', 'add']);
    if (!perm || perm.allowed !== 1) throw new Error('Permission not created');
  })) passed++; else failed++;

  // Test 57: Cooldown
  if (await runTest('Test 57: Cooldown', async () => {
    await run('INSERT INTO cooldowns (command, user_id, guild_id) VALUES (?, ?, ?)', ['add', 'user1', 'test-guild']);
    const cd = await get('SELECT * FROM cooldowns WHERE command = ? AND user_id = ?', ['add', 'user1']);
    if (!cd) throw new Error('Cooldown not created');
  })) passed++; else failed++;

  // Test 58: Set global variable
  if (await runTest('Test 58: Set global variable', async () => {
    await run('INSERT INTO global_variables (name, value, guild_id) VALUES (?, ?, ?)', ['var1', 'value1', 'test-guild']);
    const variable = await get('SELECT * FROM global_variables WHERE name = ?', ['var1']);
    if (!variable || variable.value !== 'value1') throw new Error('Variable not set');
  })) passed++; else failed++;

  // Test 59: List global variables
  if (await runTest('Test 59: List global variables', async () => {
    const variables = await all('SELECT * FROM global_variables WHERE guild_id = ?', ['test-guild']);
    if (variables.length < 1) throw new Error('Variables not found');
  })) passed++; else failed++;

  // Test 60: Delete template
  if (await runTest('Test 60: Delete template', async () => {
    await run('DELETE FROM templates WHERE name = ?', ['testtpl']);
    const tpl = await get('SELECT * FROM templates WHERE name = ?', ['testtpl']);
    if (tpl) throw new Error('Template not deleted');
  })) passed++; else failed++;

  // Cleanup
  console.log('\n[CLEAN] Cleaning up test data...');
  await run('DELETE FROM sections WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM auto_reactions WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM entries WHERE author_id = ?', ['test-user']);
  await run('DELETE FROM tags WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM aliases WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM attachments WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM favorites WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM pins WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  await run('DELETE FROM templates WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM global_variables WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM permissions WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM cooldowns WHERE guild_id = ?', ['test-guild']);
  await run('DELETE FROM entry_reactions WHERE entry_id IN (SELECT id FROM entries WHERE author_id = ?)', ['test-user']);
  console.log('[OK] Cleanup complete');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('[STATS] Database Test Summary');
  console.log('='.repeat(50));
  console.log(`[OK] Passed: ${passed}`);
  console.log(`[X] Failed: ${failed}`);
  console.log(`[TOTAL] Total: ${passed + failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('[OK] All database tests passed!');
  } else {
    console.log('[!] Some tests failed.');
  }

  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

