const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({viewport:{width:360,height:640}})).newPage();
  const err=[]; p.on('pageerror',e=>err.push(e.message)); p.on('dialog',d=>d.accept());
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');

  console.log('\n1) Podjela trenutaka');
  const v = await p.evaluate(()=>({
    tren: CARD_DB.filter(c=>c.deck==='TRENUCI').length,
    vedri: CARD_DB.filter(c=>c.vedar).length,
    teskiVedri: CARD_DB.filter(c=>c.vedar&&c.teska).length,
    nevedarPrimjer: ['gorka pobjeda','prekršeno obećanje','ukradene zasluge','oteta igračka']
      .map(t=>CARD_DB.find(c=>c.term===t)).map(c=>c&&c.vedar),
    vedarPrimjer: ['prvi snijeg','mačka koja prede','pun mjesec']
      .map(t=>CARD_DB.find(c=>c.term===t)).map(c=>c&&c.vedar),
    nijedanNeTrenutakVedar: CARD_DB.filter(c=>c.deck!=='TRENUCI'&&c.vedar).length,
  }));
  C(`76 vedrih od ${v.tren} trenutaka`, v.vedri===76, String(v.vedri));
  C('teške teme nikad nisu vedre', v.teskiVedri===0, String(v.teskiVedri));
  C('emocionalno nabijeni trenuci nisu vedri', v.nevedarPrimjer.every(x=>x===false), JSON.stringify(v.nevedarPrimjer));
  C('osjetilni trenuci jesu vedri', v.vedarPrimjer.every(x=>x===true), JSON.stringify(v.vedarPrimjer));
  C('oznaka postoji samo na trenucima', v.nijedanNeTrenutakVedar===0, String(v.nijedanNeTrenutakVedar));

  console.log('\n2) Uputa na kartici traži trenutak, ne osjećaj');
  await p.click('#screen-naslovna button.btn');
  await p.click('#screen-postavke button.btn-wide');
  await p.waitForSelector('#screen-predaja.active');
  await p.evaluate(()=>{ state.snop[state.cardIndex]={card:CARD_DB.find(c=>c.term==='prvi snijeg'),isRepeat:false}; });
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  const note = await p.$eval('#card-note',e=>e.textContent);
  C('piše da se pogađa TRENUTAK', /pogađa TRENUTAK/.test(note), note);
  C('ne traži više pogađanje emocije', !/pogađa EMOCIJU/.test(note), note);

  console.log('\n3) Vedar trenutak → „Tko je najčešće u ovome?“');
  await p.evaluate(()=>{ state.mehBrojac=99; session.tkoJeOvoOn=true; });
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-tkojeovo.active',{timeout:3000});
  C('otvara se ekran s prstom', true);
  C('naslov prilagođen trenutku', (await p.$eval('#tko-naslov',e=>e.textContent))==='Tko je od nas najčešće u ovome?',
     await p.$eval('#tko-naslov',e=>e.textContent));
  await p.waitForSelector('#tko-phase-pick',{state:'visible',timeout:6000});
  await p.click('#tko-grid .pick-btn');
  const tit = await p.$eval('#tko-titula',e=>e.textContent);
  C('titula je „rekorder“, ne „stručnjak“', /REKORDER/.test(tit), tit.slice(0,60));
  await p.click('#tko-phase-title button.btn');
  await p.waitForSelector('#screen-predaja.active',{timeout:3000});

  console.log('\n4) Nabijen trenutak → „Kako se ti osjećaš u ovome?“');
  await p.evaluate(()=>{ state.snop[state.cardIndex]={card:CARD_DB.find(c=>c.term==='prekršeno obećanje'),isRepeat:false}; state.mehBrojac=99; });
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-osjecaj.active',{timeout:3000});
  C('otvara se ekran s osjećajem, ne s prstom', true);
  C('prikazuje o kojem se trenutku radi', (await p.$eval('#osjecaj-term',e=>e.textContent))==='prekršeno obećanje');
  const sub = await p.$eval('#screen-osjecaj .pick-sub:last-of-type',e=>e.textContent);
  C('naglašava da nema točnog odgovora ni bodova', /nema točnog odgovora/i.test(sub)&&/nema bodova/i.test(sub), sub);
  await p.click('#screen-osjecaj button.btn');
  await p.waitForSelector('#screen-predaja.active',{timeout:3000});
  C('DALJE vodi na sljedeću karticu', true);

  console.log('\n5) Emocije i dalje idu u „Tko je ovo od nas?“');
  await p.evaluate(()=>{ state.snop[state.cardIndex]={card:CARD_DB.find(c=>c.deck==='EMOCIJE'&&c.sigurno),isRepeat:false}; state.mehBrojac=99; });
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-tkojeovo.active',{timeout:3000});
  C('naslov je stari za emocije', (await p.$eval('#tko-naslov',e=>e.textContent))==='Tko je ovo od nas?');

  console.log('\n6) Dodaci se i dalje pale povremeno');
  const rit = await p.evaluate(()=>{ state.mehBrojac=0; state.mehPrag=novRazmak();
    let n=0; for(let i=0;i<300;i++) if(okidaMehaniku('mehBrojac','mehPrag')) n++; return n/300; });
  C(`okidaju se na ~1 od 3 kartice (${(rit*100).toFixed(0)}%)`, rit>0.28&&rit<0.42, String(rit));

  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.slice(0,4).forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
