import { describe, expect, it } from 'vitest';
import { calculateProgress, filterAirports, validateBackup, validateProgram, type CheckIn } from '@passport/core';
import { flyWashingtonProgram } from '../../src/program/program';
import dataset from '../../src/program/airports.generated.json';
import report from '../../data/reconciliation-report.json';
import crosswalk from '../../data/sources/airport-crosswalk.json';

describe('official map dataset through the public core API', () => {
  it('covers every source airport and all seven regions with valid references', () => {
    expect(() => validateProgram(flyWashingtonProgram)).not.toThrow();
    expect(flyWashingtonProgram.airports).toHaveLength(115);
    expect(flyWashingtonProgram.regions).toHaveLength(7);
    expect(new Set(dataset.map(a => a.id)).size).toBe(115);
    expect(new Set(dataset.map(a => a.provenance.ourAirportsId)).size).toBe(115);
    expect(new Set(dataset.map(a => a.id))).toEqual(new Set(crosswalk.map(a => a.airportId)));
    expect(report.unmatchedAirports).toEqual([]);
    expect(report.regions.map(r => r.count)).toEqual([24,19,13,20,23,12,4]);
    expect(dataset.every(a => a.provenance.stampInstructions.trim())).toBe(true);
    // Optional source fields remain absent rather than becoming fabricated facts.
    expect(dataset.filter(a=>!a.address)).toHaveLength(56);
    expect(dataset.flatMap(a=>a.runways)).toHaveLength(153);
    expect(calculateProgress(flyWashingtonProgram, []).total).toBe(115);
  });
  it('preserves existing IDs, corrected regions, code aliases, and out-of-state participants', () => {
    for (const id of ['KBVS','KORS','KCLM','KOLM','KCLS']) expect(dataset.some(a=>a.id===id)).toBe(true);
    for (const id of ['KOLM','KCLM']) expect(dataset.find(a=>a.id===id)?.regionId).toBe('olympic');
    for (const code of ['OLM','70S','RLD','DLS']) {
      expect(filterAirports(flyWashingtonProgram,[],{query:code,regionId:'',visited:'all'}).length).toBeGreaterThan(0);
    }
    expect(dataset.find(a=>a.identifiers.faa==='DLS')?.description).toContain('OR');
    expect(dataset.find(a=>a.identifiers.faa==='83Q')?.regionId).toBe('seaplane-bases');
  });
  it('keeps genuine multi-location instructions and coordinate discrepancies without inventing GPS targets', () => {
    expect(dataset.find(a=>a.id==='KBVS')?.stampLocations).toHaveLength(1);
    expect(dataset.find(a=>a.id==='KPWT')?.stampLocations.map(s=>s.access)).toEqual(['business-hours','always']);
    expect(dataset.flatMap(a=>a.stampLocations).every(s=>!('location' in s))).toBe(true);
    expect(report.discrepancies.filter(d=>d.kind==='coordinate-distance').map(d=>d.airportId)).toEqual(['S16','KS94']);
    expect(dataset.find(a=>a.id==='KS94')?.cautions.length).toBe(0);
  });
  it('uses the owner-approved Copalis map position while preserving the conflicting source evidence', () => {
    const copalis = dataset.find(a => a.id === 'S16')!;
    expect(copalis.location).toEqual({latitude:47.144664,longitude:-124.189073});
    expect(copalis.provenance.mapLocation).toEqual({latitude:47.144664,longitude:-124.189073});
    expect(copalis.provenance.referenceLocation).toEqual({latitude:47.124802,longitude:-124.184998});
    expect(copalis.cautions).toEqual([]);
    expect(report.discrepancies.find(d => d.airportId === 'S16')).toMatchObject({status:'resolved',meters:2230,resolution:{reviewedBy:'Project owner'}});
  });
  it('retains the owner-confirmed Whitman reference position and resolved source disagreement', () => {
    const whitman = dataset.find(a => a.id === 'KS94')!;
    expect(whitman.location).toEqual({latitude:46.8587,longitude:-117.414001});
    expect(whitman.provenance.mapLocation).toEqual({latitude:46.8754045,longitude:-117.3627113});
    expect(whitman.provenance.referenceLocation).toEqual(whitman.location);
    expect(report.discrepancies.find(d => d.airportId === 'KS94')).toMatchObject({status:'resolved',meters:4319,resolution:{reviewedBy:'Project owner',location:whitman.location}});
  });
  it('counts seaplane airports identically and deduplicates visits', () => {
    const ids=dataset.filter(a=>a.regionId==='seaplane-bases').map(a=>a.id);
    const visits=ids.map(visit);
    const progress=calculateProgress(flyWashingtonProgram,[...visits,visit(ids[0],'repeat')]);
    expect(progress.visited).toBe(4);
    expect(progress.total).toBe(115);
    expect(progress.regions.find(r=>r.id==='seaplane-bases')?.complete).toBe(true);
  });
  it('accepts backups created with the original five-airport fixture', () => {
    const backup={format:'aviation-passport',schemaVersion:1,programId:flyWashingtonProgram.id,exportedAt:'2026-09-06T12:00:00Z',checkIns:['KBVS','KORS','KCLM','KOLM','KCLS'].map(visit),attachments:[]};
    expect(validateBackup(backup,flyWashingtonProgram).checkIns).toHaveLength(5);
  });
});

function visit(airportId: string, id: string | number = airportId): CheckIn {
  return {id:String(id),airportId,programId:flyWashingtonProgram.id,visitedAt:'2026-08-10',timeKnown:false,createdAt:'2026-08-10T12:00:00Z',updatedAt:'2026-08-10T12:00:00Z',notes:'',verification:{status:'unverified'}};
}
