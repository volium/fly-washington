import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { defaultBasemapStyle } from '@passport/core';

const zoom = Number(process.env.MAP_ZOOM || 12);
const version = `20260912-z${zoom}`;
const root = resolve(`public/maps/${version}`);
const prefix = `maps/${version}`;
const commit = '028c18f713baecad011301ff7a69acc39bcc2ae7';
const attribution = '<a href="https://protomaps.com">Protomaps</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> · ODbL';
await mkdir(root,{recursive:true});
const experiment=JSON.parse(await readFile('maps/candidates.json','utf8'));
const candidate=experiment.candidates.find(c=>c.maxNativeZoom===zoom);
if(!candidate)throw Error('Generate measured candidates first');
const archive = await readFile(`map-work/washington-z${zoom}.pmtiles`);
if(createHash('sha256').update(archive).digest('hex')!==candidate.sha256)throw Error('Candidate checksum mismatch');
await copyFile(`map-work/washington-z${zoom}.pmtiles`,`${root}/washington.pmtiles`);
const tree=JSON.parse(await readFile('maps/assets.json','utf8'));
const resources=[];
async function add(path,bytes,kind) {
  const destination=resolve(root,path);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,bytes);
  resources.push({id:path.replace(/[^a-zA-Z0-9._-]/g,'_'),url:`${prefix}/${path}`,kind,sizeBytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
let index=0;
await Promise.all(Array.from({length:12},async()=>{
  while(index<tree.length){const file=tree[index++];const path=file.path.replace('sprites/v4/','sprites/');let bytes;
    try {bytes=await readFile(resolve(root,path));}catch{/* Download missing pinned asset. */}
    if(!bytes || createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!==file.sha) {
      const response=await fetch(`https://raw.githubusercontent.com/protomaps/basemaps-assets/${commit}/${file.path}`,{signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw Error(`Asset ${file.path}: ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());
      if(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!==file.sha)throw Error('Pinned asset integrity mismatch');
    }
    await add(path,bytes,path.endsWith('OFL.txt')?'license':path.endsWith('.pbf')?'glyph':'sprite');
  }
}));
for(const theme of ['light','dark'])await add(`${theme}.json`,Buffer.from(JSON.stringify(defaultBasemapStyle(theme,`${prefix}/washington.pmtiles`,prefix,attribution))), 'style');
await add('attribution.txt',Buffer.from('Map data: © OpenStreetMap contributors, available under the Open Database License (ODbL) 1.0. https://www.openstreetmap.org/copyright\nProtomaps basemap: https://protomaps.com — ODbL Produced Work. Source build: '+experiment.source+'\nFonts: Noto Sans; see fonts/OFL.txt.\n'), 'license');
for (const name of ['sprites-MIT.txt','style-BSD.txt']) await add(name,await readFile(`maps/licenses/${name}`),'license');
resources.sort((a,b)=>a.id.localeCompare(b.id));
const [west,south,east,north]=experiment.bounds;
const manifest={id:'washington',name:'Washington basemap',version,url:`${prefix}/washington.pmtiles`,sizeBytes:candidate.sizeBytes,sha256:candidate.sha256,bounds:{west,south,east,north},minZoom:0,maxNativeZoom:zoom,attribution,sourceBuild:experiment.source,basemapSchemaVersion:'4',lightStyleResourceId:'light.json',darkStyleResourceId:'dark.json',licenses:[{name:'Mapzen sprites - MIT',url:'https://github.com/tangrams/icons/blob/master/LICENSE.md',resourceId:'sprites-MIT.txt'},{name:'Protomaps styles - BSD-3-Clause',url:'https://github.com/protomaps/basemaps/blob/main/LICENSE.md',resourceId:'style-BSD.txt'},{name:'OpenStreetMap / Protomaps — ODbL',url:'https://www.openstreetmap.org/copyright',resourceId:'attribution.txt'},{name:'Noto Sans — SIL OFL',url:`https://raw.githubusercontent.com/protomaps/basemaps-assets/${commit}/fonts/OFL.txt`,resourceId:'fonts_OFL.txt'}],resources};
await writeFile(`${root}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
const manifestPath = `src/program/maps/washington-z${zoom}.json`;
if (process.env.MAP_RELEASE_CHECK) {
  if (JSON.stringify(JSON.parse(await readFile(manifestPath,'utf8'))) !== JSON.stringify(manifest)) throw Error('Generated resources differ from committed release metadata. Create a new map version explicitly.');
} else {
  await mkdir('src/program/maps',{recursive:true}); await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log(version,'archive bytes',candidate.sizeBytes,'resources',resources.length,'resource bytes',resources.reduce((sum,r)=>sum+r.sizeBytes,0));
