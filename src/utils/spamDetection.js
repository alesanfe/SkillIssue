// Spam detection system
const spamMap = new Map();

/**
 * Check if a user is spamming
 * @param {string} userId - User ID to check
 * @param {Object} options - Options for spam detection
 * @param {number} options.maxMessages - Max messages per time window (default: 5)
 * @param {number} options.timeWindow - Time window in ms (default: 5000)
 * @returns {boolean} True if user is spamming
 */
function isSpamming(userId, options = {}) {
  const { maxMessages = 5, timeWindow = 5000 } = options;
  const now = Date.now();
  
  if (!spamMap.has(userId)) {
    spamMap.set(userId, []);
  }
  
  const userMessages = spamMap.get(userId);
  
  // Remove messages outside the time window
  const recentMessages = userMessages.filter(timestamp => now - timestamp < timeWindow);
  spamMap.set(userId, recentMessages);
  
  // Check if user exceeded the limit
  if (recentMessages.length >= maxMessages) {
    return true;
  }
  
  // Add current message
  recentMessages.push(now);
  spamMap.set(userId, recentMessages);
  
  return false;
}

/**
 * Clear spam data for a user
 * @param {string} userId - User ID to clear
 */
function clearSpamData(userId) {
  spamMap.delete(userId);
}

/**
 * Get spam statistics for a user
 * @param {string} userId - User ID to check
 * @returns {Object} Spam statistics
 */
function getSpamStats(userId) {
  const userMessages = spamMap.get(userId) || [];
  const now = Date.now();
  const recentMessages = userMessages.filter(timestamp => now - timestamp < 5000);
  
  return {
    totalMessages: userMessages.length,
    recentMessages: recentMessages.length,
    isSpamming: recentMessages.length >= 5
  };
}

/**
 * Clear all spam data (useful for cleanup)
 */
function clearAllSpamData() {
  spamMap.clear();
}

module.exports = { isSpamming, clearSpamData, getSpamStats, clearAllSpamData };
