import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const harness = process.env.MAP_HARNESS_URL;
if (!harness) throw Error('Set MAP_HARNESS_URL to the running independent core map harness URL');
const candidates = JSON.parse(await readFile('maps/candidates.json','utf8')).candidates;
const manifest = JSON.parse(await readFile('src/program/maps/washington-z12.json','utf8'));
const airports = JSON.parse(await readFile('src/program/airports.generated.json','utf8'));
const regions = JSON.parse(await readFile('src/program/regions.json','utf8'));
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--enable-unsafe-swiftshader']});
await mkdir('map-work/comparison',{recursive:true});
const records=[];
try {
  for (const candidate of candidates) {
    const archive=await readFile(`map-work/washington-z${candidate.maxNativeZoom}.pmtiles`);
    const page=await browser.newPage({viewport:{width:412,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const url = new URL(harness); url.searchParams.set('manifest','/candidate.json');
    await page.route('**/candidate.json',route=>route.fulfill({json:{...manifest,...candidate,version:`comparison-z${candidate.maxNativeZoom}`,url:'/candidate.pmtiles'}}));
    await page.route('**/candidate.pmtiles',route=>{
      const range=route.request().headers().range?.match(/bytes=(\d+)-(\d+)/);
      const start=range?Number(range[1]):0,end=range?Math.min(Number(range[2]),archive.length-1):archive.length-1;
      return route.fulfill({status:range?206:200,body:archive.subarray(start,end+1),headers:{'content-type':'application/octet-stream',...(range?{'content-range':`bytes ${start}-${end}/${archive.length}`}:{})}});
    });
    await page.goto(url.href);
    await page.waitForFunction(()=>window.testMap?.map.loaded());
    await page.evaluate(({airports,regions})=>window.testMap.airports(airports,regions,new Set(),undefined,true,new Set()),{airports,regions});
    for(const id of ['statewide','S16','KORS','KRNT','KOMK','KS52','W55']) {
      const airport=airports.find(a=>a.id===id);
      const start=Date.now();
      await page.evaluate(a=>window.testMap.map.jumpTo(a?{center:[a.location.longitude,a.location.latitude],zoom:13.5}:{center:[-120.7,47.3],zoom:5.5}),airport);
      await page.waitForFunction(()=>window.testMap.map.loaded());
      const elapsed=Date.now()-start;
      await page.screenshot({path:`map-work/comparison/z${candidate.maxNativeZoom}-${id}.png`});
      const session=await page.context().newCDPSession(page);await session.send('Performance.enable'); const {metrics}=await session.send('Performance.getMetrics');await session.detach();
      records.push({zoom:candidate.maxNativeZoom,scene:id,renderWaitMs:elapsed,jsHeapUsedBytes:metrics.find(m=>m.name==='JSHeapUsedSize')?.value});
    }
    await page.close();
    console.log('Compared z'+candidate.maxNativeZoom);
  }
} finally { await browser.close(); }
await writeFile('map-work/comparison/results.json',JSON.stringify({browser:'Chromium software rendering; mobile viewport emulation, not physical-device performance',records},null,2)+'\n');
