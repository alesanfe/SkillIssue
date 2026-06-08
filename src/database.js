const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'lorebot.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run queries as promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Initialize database schema
async function initDatabase() {
  // Sections table
  await exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, name)
    )
  `);

  // Entries table
  await exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER,
      name TEXT NOT NULL,
      content TEXT,
      author_id TEXT,
      uses INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(section_id, name)
    )
  `);

  // Attachments table
  await exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
    )
  `);

  // Tags table
  await exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
      UNIQUE(entry_id, tag)
    )
  `);

  // Aliases table
  await exec(`
    CREATE TABLE IF NOT EXISTS aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      alias TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
      UNIQUE(entry_id, alias)
    )
  `);

  // Auto-reactions config table
  // Migrate from old schema (threshold) to new schema (keyword)
  try {
    await exec(`DROP TABLE IF EXISTS auto_reactions`);
  } catch (error) {
    // Ignore if table doesn't exist
  }
  await exec(`
    CREATE TABLE IF NOT EXISTS auto_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      keyword TEXT NOT NULL,
      UNIQUE(guild_id, emoji, keyword)
    )
  `);

  // Saved messages table
  await exec(`
    CREATE TABLE IF NOT EXISTS saved_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER,
      message_id TEXT NOT NULL,
      author_id TEXT,
      content TEXT,
      channel_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    )
  `);

  // Favorites table
  await exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
      UNIQUE(entry_id, user_id)
    )
  `);

  // Pins table
  await exec(`
    CREATE TABLE IF NOT EXISTS pins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
      UNIQUE(entry_id, user_id)
    )
  `);

  // Templates table
  // Migrate to add image_url and gif_url columns
  try {
    await exec(`DROP TABLE IF EXISTS templates`);
  } catch (error) {
    // Ignore if table doesn't exist
  }
  await exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      gif_url TEXT,
      author_id TEXT,
      guild_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, name)
    )
  `);

  // Global variables table
  await exec(`
    CREATE TABLE IF NOT EXISTS global_variables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, name)
    )
  `);

  // Permissions table
  await exec(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id TEXT NOT NULL,
      command TEXT NOT NULL,
      allowed BOOLEAN DEFAULT 1,
      guild_id TEXT NOT NULL,
      UNIQUE(role_id, command, guild_id)
    )
  `);

  // Cooldowns table
  await exec(`
    CREATE TABLE IF NOT EXISTS cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(command, user_id, guild_id)
    )
  `);

  // Entry reactions table
  await exec(`
    CREATE TABLE IF NOT EXISTS entry_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
      UNIQUE(entry_id, emoji)
    )
  `);

  // Add is_archived column to entries (if not exists)
  try {
    await exec(`
      ALTER TABLE entries ADD COLUMN is_archived BOOLEAN DEFAULT 0
    `);
  } catch (error) {
    // Column likely already exists, ignore error
  }

  console.log('Database initialized successfully');
}

module.exports = { db, run, get, all, exec, initDatabase };
