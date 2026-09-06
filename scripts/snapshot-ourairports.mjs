import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

const [airportFile,runwayFile,retrievedAt,outputFile]=process.argv.slice(2);
if (!airportFile || !runwayFile || !/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt ?? '') || !outputFile) throw new Error('Usage: node scripts/snapshot-ourairports.mjs <airports.csv> <runways.csv> <YYYY-MM-DD> <output.json>');
const crosswalk=JSON.parse(readFileSync('data/sources/airport-crosswalk.json','utf8'));
const ids=new Set(crosswalk.map(row=>row.ourAirportsId));
const airportBytes=readFileSync(airportFile),runwayBytes=readFileSync(runwayFile);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const airports=parse(airportBytes,{columns:true,skip_empty_lines:true}).filter(a=>ids.has(a.id));
if (airports.length!==ids.size) throw new Error('Reference airports are missing; review the crosswalk before refreshing.');
const snapshot={retrievedAt,sources:{airports:{url:'https://davidmegginson.github.io/ourairports-data/airports.csv',sha256:hash(airportBytes)},runways:{url:'https://davidmegginson.github.io/ourairports-data/runways.csv',sha256:hash(runwayBytes)}},airports,runways:parse(runwayBytes,{columns:true,skip_empty_lines:true}).filter(r=>ids.has(r.airport_ref))};
writeFileSync(outputFile,JSON.stringify(snapshot,null,2)+'\n');
console.log(`Saved ${airports.length} public airport records and ${snapshot.runways.length} runway records.`);
