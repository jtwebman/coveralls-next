#!/usr/bin/env node

'use strict';

const { handleInput } = require('..');

process.stdin.resume();
process.stdin.setEncoding('utf8');

let input = '';

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', async () => {
  try {
    await handleInput(input);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
});
