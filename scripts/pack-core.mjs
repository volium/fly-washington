import { mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const core = resolve('../passport-core');
const version = JSON.parse(readFileSync(resolve(core, 'package.json'), 'utf8')).version;
const expected = JSON.parse(readFileSync('package.json', 'utf8')).dependencies['@passport/core'];
if (expected !== `file:vendor/passport-core-${version}.tgz`) throw new Error('Update the app core dependency to the intended version before packing.');
mkdirSync('vendor', { recursive: true });
// Use npm's JS entry point so Windows does not need shell command interpolation.
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this through npm run core:pack.');
for (const args of [['pack', core, '--pack-destination', resolve('vendor')], ['install', `./vendor/passport-core-${version}.tgz`, '--no-audit', '--no-fund']]) {
  const result = spawnSync(process.execPath, [npmCli, ...args], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
