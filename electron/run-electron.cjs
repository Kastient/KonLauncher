const { spawn } = require('node:child_process');

delete process.env.ELECTRON_RUN_AS_NODE;

const electronBinary = require('electron');
const inputArgs = process.argv.slice(2);
const passthroughArgs = [];
let devServerUrl = '';

for (const arg of inputArgs) {
  if (arg === '--dev-server') {
    devServerUrl = 'http://127.0.0.1:5173';
    continue;
  }
  if (arg.startsWith('--dev-server=')) {
    devServerUrl = arg.slice('--dev-server='.length);
    continue;
  }
  passthroughArgs.push(arg);
}

const env = { ...process.env };
if (devServerUrl) {
  env.KON_DEV_SERVER_URL = devServerUrl;
}

const child = spawn(electronBinary, ['.', ...passthroughArgs], {
  stdio: 'inherit',
  env
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
