import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
const readJson = path => JSON.parse(read(path));
const hash = value => createHash('sha256').update(value).digest('hex');
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const regionId = name => name.toLowerCase().replace(/ region$/, '').replace(/^seaplane base$/, 'seaplane bases').replaceAll(' ', '-');
const numeric = value => value?.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined;
const distance = (a, b) => {
  const rad = degrees => degrees * Math.PI / 180;
  const h = Math.sin(rad(b.latitude-a.latitude)/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};

export function generateData() {
  const kml = read('data/sources/google-map-2026-09-06.kml');
  if (XMLValidator.validate(kml) !== true || /<!DOCTYPE/i.test(kml)) throw new Error('Invalid source KML');
  const map = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: true }).parse(kml);
  const crosswalk = readJson('data/sources/airport-crosswalk.json');
  const reference = readJson('data/sources/ourairports-2026-09-06.json');
  const regions = readJson('src/program/regions.json');
  const locationOverrides = readJson('data/sources/airport-location-overrides.json');
  const points = array(map.kml.Document.Folder).flatMap(folder => array(folder.Placemark).map(point => ({ point, layer: folder.name })));
  const unique = (values, label) => { if (values.some(v => !v) || new Set(values).size !== values.length) throw new Error(`Missing or duplicate ${label}`); };
  unique(crosswalk.map(row => row.mapName), 'crosswalk name');
  unique(crosswalk.map(row => row.airportId), 'airport ID');
  unique(crosswalk.map(row => row.ourAirportsId), 'reference airport ID');
  unique(locationOverrides.map(row => row.airportId), 'location override airport ID');
  for (const override of locationOverrides) {
    if (!crosswalk.some(row => row.airportId === override.airportId) || !override.reason?.trim() || !override.reviewedBy?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(override.reviewedAt)) throw new Error('Invalid location override');
  }
  if (crosswalk.length !== points.length || reference.airports.length !== points.length) throw new Error('Source coverage mismatch');
  const discrepancies = [];
  const airports = points.map(({point, layer}) => {
    const match = crosswalk.find(row => row.mapName === point.name);
    if (!match) throw new Error(`Unmapped airport: ${point.name}`);
    const oa = reference.airports.find(row => row.id === match.ourAirportsId);
    if (!oa || ![oa.ident, oa.gps_code, oa.local_code].includes(match.code)) throw new Error(`Identifier mismatch: ${match.mapName}`);
    const fields = Object.fromEntries(array(point.ExtendedData?.Data).map(field => [field['@_name'], String(field.value ?? '')]));
    const region = regionId(layer);
    if (!regions.some(r => r.id === region) || (fields.Region?.trim() && regionId(fields.Region) !== region)) throw new Error(`Invalid region: ${point.name}`);
    if (!fields.Region?.trim()) discrepancies.push({airportId:match.airportId,kind:'empty-region-field',resolution:`Used source layer ${layer}`});
    const coordinates = point.Point?.coordinates?.split(',').map(Number);
    if (!coordinates || coordinates.length < 2 || coordinates.some(v => !Number.isFinite(v))) throw new Error(`Missing map coordinates: ${point.name}`);
    const mapLocation = { latitude: coordinates[1], longitude: coordinates[0] };
    const referenceLocation = { latitude: numeric(oa.latitude_deg), longitude: numeric(oa.longitude_deg) };
    const locationOverride = locationOverrides.find(row => row.airportId === match.airportId);
    if (locationOverride) {
      for (const [actual, expected] of [[mapLocation, locationOverride.expectedMapLocation], [referenceLocation, locationOverride.expectedReferenceLocation]]) {
        if (actual.latitude !== expected?.latitude || actual.longitude !== expected?.longitude) throw new Error(`Source coordinates changed; review location override for ${match.airportId}`);
      }
    }
    const location = locationOverride ? locationOverride.location : referenceLocation;
    for (const position of [mapLocation, referenceLocation, location]) if (!position || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude) || Math.abs(position.latitude)>90 || Math.abs(position.longitude)>180) throw new Error('Invalid coordinates');
    const meters = Math.round(distance(mapLocation,referenceLocation));
    const cautions = [];
    if (meters>2000) {
      if (!locationOverride) cautions.push(`The program map point and OurAirports reference position differ by ${(meters/1000).toFixed(1)} km. Airport marker uses OurAirports; verify stamp directions independently.`);
      discrepancies.push({ airportId:match.airportId, kind:'coordinate-distance', status:locationOverride ? 'resolved' : 'open', meters, mapLocation, airportLocation:referenceLocation, ...(locationOverride ? {resolution:locationOverride} : {}) });
    }
    if (oa.type === 'closed') { cautions.push('OurAirports lists this facility as closed, although it remains on the program map.'); discrepancies.push({airportId:match.airportId,kind:'closed-reference-airport'}); }
    const instruction = fields['Stamp Location'];
    if (!instruction?.trim()) throw new Error(`Missing stamp instructions: ${point.name}`);
    const stamps = [{ id:`${match.airportId}-stamp-instructions`, airportId:match.airportId, name:'Stamp location', description:instruction, access:'unknown' }];
    // The source explicitly separates these locations. Preserve its full text
    // in provenance and retain the undated construction notice for both.
    if (match.code === 'PWT') {
      const [locations, notice] = instruction.split('NOTE:');
      const parts = locations.split('– OR –');
      if (parts.length !== 2) throw new Error('Bremerton instructions changed; review the split');
      stamps.splice(0,1,
        { id:`${match.airportId}-avian`,airportId:match.airportId,name:'Avian Flight Center',description:parts[0].trim() + (notice ? `\nSource notice (year unspecified): ${notice.trim()}` : ''),access:'business-hours' },
        { id:`${match.airportId}-lounge`,airportId:match.airportId,name:'Pilot lounge',description:parts[1].trim() + (notice ? `\nSource notice (year unspecified): ${notice.trim()}` : ''),access:'always' });
    }
    const runways = reference.runways.filter(r => r.airport_ref === oa.id).map(r => ({ id:r.id, name:[r.le_ident,r.he_ident].filter(Boolean).join(' / ') || 'Unspecified runway', lengthFeet:numeric(r.length_ft),widthFeet:numeric(r.width_ft),surface:r.surface || undefined, lighted:r.lighted === '1' ? true : r.lighted === '0' ? false : undefined,closed:r.closed === '1' ? true : r.closed === '0' ? false : undefined }));
    const name = point.name.replace(/\s*(?:\([A-Z0-9]{3,4}\)|\b[A-Z0-9]{3,4})\s*$/, '').trim();
    return {
      id:match.airportId, name, regionId:region, identifiers:{faa:oa.local_code || match.code, ...(oa.gps_code && /^K[A-Z]{3}$/.test(oa.gps_code) ? {icao:oa.gps_code} : {}), local:match.code},
      location, participation:{participating:true},
      description:`Participating location in the Fly Washington program map (${reference.retrievedAt}).${oa.municipality ? ` ${oa.municipality}, ${oa.iso_region.replace('US-','')}.` : ''}`,
      address:fields['Address (Pilot to Verify Data)'] || fields.Address || undefined,
      stampLocations:stamps, runways, cautions,
      sources:[{name:'Program map',url:'https://www.google.com/maps/d/viewer?mid=1AnHLrRdeYV6TR6qCFDnM4bcp2kSe45j-',retrievedAt:'2026-09-06'},{name:'OurAirports',url:`https://ourairports.com/airports/${encodeURIComponent(oa.ident)}/`,retrievedAt:reference.retrievedAt}],
      provenance:{mapName:point.name,mapLayer:layer,mapLocation,estimatedCoordinatesText:fields['Lat / Long (Estimated)'] || fields['Lat / Long'] || fields['Lat/Long Estimated'],stampInstructions:instruction,ourAirportsId:oa.id,ourAirportsName:oa.name,facilityType:oa.type,elevationFeet:numeric(oa.elevation_ft),coordinateDistanceMeters:meters,...(locationOverride ? {referenceLocation,locationOverride} : {})},
    };
  });
  unique(airports.map(a=>a.id),'generated airport ID');
  for (const id of ['KBVS','KORS','KCLM','KOLM','KCLS']) if (!airports.some(a=>a.id===id)) throw new Error(`Lost legacy ID ${id}`);
  const report = { datasetVersion:'2026-09-06', sources:{mapSha256:hash(kml),referenceSha256:hash(read('data/sources/ourairports-2026-09-06.json')),crosswalkSha256:hash(read('data/sources/airport-crosswalk.json'))}, airportCount:airports.length,runwayCount:airports.reduce((n,a)=>n+a.runways.length,0),regions:regions.map(r=>({id:r.id,count:airports.filter(a=>a.regionId===r.id).length})),unmatchedAirports:[],discrepancies,limitations:['Map membership is not a dated award-eligibility roster.','Map positions are preserved as estimated source points, not GPS verification targets.','Unknown access stays unknown; source directions may contain undated notices.','Public source photographs and personal spreadsheet history are not bundled.'] };
  report.sources.locationOverridesSha256 = hash(read('data/sources/airport-location-overrides.json'));
  return { airports, report };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { airports,report }=generateData();
  const files={'src/program/airports.generated.json':airports,'data/reconciliation-report.json':report};
  for (const [path,value] of Object.entries(files)) {
    const content=JSON.stringify(value,null,2)+'\n';
    if (process.argv.includes('--check')) { if (read(path)!==content) throw new Error(`${path} is stale; run npm run data:generate`); }
    else writeFileSync(resolve(root,path),content);
  }
  console.log(`Validated ${airports.length} airports in ${report.regions.length} regions; ${report.discrepancies.length} documented source discrepancies.`);
}
