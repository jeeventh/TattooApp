const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file types
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db',
  // Add other file extensions you need
  'svg'
);

module.exports = config;
