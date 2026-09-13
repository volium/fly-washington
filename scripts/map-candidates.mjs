import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// M0 experiment. Large output is deliberately excluded from Git.
const executable = process.env.PMTILES_CLI || 'pmtiles';
const directory = resolve('map-work');
mkdirSync(directory, { recursive: true });
const source = 'https://build.protomaps.com/20260912.pmtiles';
const bounds = [-125.63, 45.03, -116.13, 49.51];
const run = args => {
  console.log(executable, ...args);
  const result = spawnSync(executable, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  if (result.error || result.status !== 0) throw result.error || new Error(`pmtiles exited ${result.status}`);
  return result.stdout;
};
const toolVersion = run(['version']).trim();
if (!toolVersion.includes('1.31.2')) throw new Error('Use pinned go-pmtiles 1.31.2');
const records = [];
const expected = JSON.parse(readFileSync('maps/candidates.json','utf8')).candidates;
for (const zoom of [13, 9, 10, 11, 12]) {
  const path = resolve(directory, `washington-z${zoom}.pmtiles`);
  const args = ['extract', zoom === 13 ? source : resolve(directory, 'washington-z13.pmtiles'), path, `--bbox=${bounds.join(',')}`, '--minzoom=0', `--maxzoom=${zoom}`];
  if (existsSync(path)) {
    const known = expected.find(candidate => candidate.maxNativeZoom === zoom);
    if (!known || createHash('sha256').update(readFileSync(path)).digest('hex') !== known.sha256) throw new Error(`Existing candidate differs from the recorded release: ${path}. Preserve or remove it explicitly before extracting again.`);
  } else run(args);
  const verification = run(['verify', path]).trim();
  records.push({ maxNativeZoom: zoom, minZoom: 0, sizeBytes: statSync(path).size, sha256: createHash('sha256').update(readFileSync(path)).digest('hex'), command: ['pmtiles', ...args], verification });
  writeFileSync(resolve(directory, 'candidates.json'), JSON.stringify({ source, sourceVersion: '4.15.2', sourceBlake3: '8c1e4037065b245be4249c133f0505e5a9372e17cb8f987e5ca38dcfe7ac8583', toolVersion, bounds, bufferMiles: 35, coverageMethod: 'Washington bounding rectangle expanded by approximately 35 miles (longitude expansion at northern edge)', content: 'Unmodified geographic/zoom extracts; presentation filtering does not reduce archive bytes.', candidates: records.sort((a,b) => a.maxNativeZoom-b.maxNativeZoom) }, null, 2) + '\n');
}
