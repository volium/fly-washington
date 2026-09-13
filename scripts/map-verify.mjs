import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { validateMapPackage, validateStyleResources } from '@passport/core';
const manifest=JSON.parse(await readFile('src/program/maps/washington-z12.json','utf8'));
validateMapPackage(manifest);
const root=resolve('public');
for(const resource of [manifest,...manifest.resources]) {
  const path=resolve(root,resource.url);
  if(!path.startsWith(root+sep))throw Error('Map resource must remain inside public/');
  const size=await stat(path).catch(()=>{throw Error('Map assets missing. Run npm run map:prepare before building.');});
  const hash=createHash('sha256');for await(const bytes of createReadStream(path)) hash.update(bytes);
  if(size.size!==resource.sizeBytes || hash.digest('hex')!==resource.sha256)throw Error(`Map asset differs from immutable manifest: ${resource.url}`);
}
for(const id of [manifest.lightStyleResourceId,manifest.darkStyleResourceId]) {
  const resource=manifest.resources.find(r=>r.id===id);
  validateStyleResources(JSON.parse(await readFile(resolve(root,resource.url),'utf8')),manifest);
}
console.log('Verified complete map release:',manifest.version);
