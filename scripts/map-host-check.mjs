import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base=process.env.MAP_SITE_URL;
if(!base)throw Error('Set MAP_SITE_URL to the deployed site root including its repository subpath and trailing slash');
const manifest=JSON.parse(await readFile('src/program/maps/washington-z12.json','utf8'));
const url=new URL(manifest.url,base);
const range=await fetch(url,{headers:{Range:'bytes=0-126'},cache:'no-store'});
if(range.status!==206 || range.headers.get('content-range')!==`bytes 0-126/${manifest.sizeBytes}`)throw Error('Actual host does not return the required byte Range response');
const bytes=new Uint8Array(await range.arrayBuffer());
if(bytes.length!==127 || new TextDecoder().decode(bytes.subarray(0,7))!=='PMTiles')throw Error('Host altered the archive or returned a fallback HTML page');
let index=0;
await Promise.all(Array.from({length:8},async()=>{
  while(index<manifest.resources.length) {
    const resource=manifest.resources[index++];
    const response=await fetch(new URL(resource.url,base),{cache:'no-store'});
    if(response.status!==200)throw Error(`Published resource unavailable: ${resource.id} (${response.status})`);
    const content=new Uint8Array(await response.arrayBuffer());
    if(content.length!==resource.sizeBytes || createHash('sha256').update(content).digest('hex')!==resource.sha256)throw Error(`Published resource differs from release: ${resource.id}`);
  }
}));
console.log('Actual static endpoint Range and all resource integrity checks passed:',url.href);
