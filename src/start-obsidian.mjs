const { spawn } = require('child_process');
require('dotenv').config();

const vaultPath = 'C:\\Users\\iamow\\obsidian-collab\\test-vault';

/** @type import('child_process').ChildProcess */
const cp = spawn(process.env.OBSIDIAN_PATH, [vaultPath], { detached: true });

module.exports = cp;
