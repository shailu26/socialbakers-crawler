#!/usr/bin/env node

// Register the babel require hook
require('babel-register');

// Export the application
exports = module.exports = require('./app');
