import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const manifest=JSON.parse(await readFile('src/program/maps/washington-z12.json','utf8'));
const path='map-work/washington-z12.pmtiles';
await mkdir('map-work',{recursive:true});
if (!(await stat(path).catch(()=>null))) {
  if (process.env.MAP_ARCHIVE_URL) {
    const response=await fetch(process.env.MAP_ARCHIVE_URL);
    if (!response.ok) throw Error(`Released archive download failed: ${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    if (bytes.length!==manifest.sizeBytes || createHash('sha256').update(bytes).digest('hex')!==manifest.sha256) throw Error('Released archive integrity failed');
    await writeFile(path,bytes);
  } else {
    const result=spawnSync(process.execPath,['scripts/map-candidates.mjs'],{stdio:'inherit'});
    if (result.status!==0) throw Error('Map extraction failed. Supply the pinned PMTILES_CLI or MAP_ARCHIVE_URL pointing to the retained release archive. Daily source retention is not guaranteed.');
  }
}
const result=spawnSync(process.execPath,['scripts/map-resources.mjs'],{stdio:'inherit',env:{...process.env,MAP_RELEASE_CHECK:'1'}});
if (result.status!==0) process.exit(result.status??1);
