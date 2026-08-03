const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/Proba/docs/sto-ti-je.html');
let pass = 0, fail = 0;
const check = (n, c, e = '') => c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + '  ' + e));

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 360, height: 640 } })).newPage();
  const jsErr = [];
  page.on('pageerror', e => jsErr.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) jsErr.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);

  console.log('\n1) Svaka kartica ima fazu i tempo');
  const tag = await page.evaluate(() => ({
    total: CARD_DB.length,
    bezFaze: CARD_DB.filter(c => ![1, 2, 3].includes(c.faza)).length,
    bezTempa: CARD_DB.filter(c => !['brzo', 'normalno', 'duboko'].includes(c.tempo)).length,
    aktivne: CARD_DB.filter(c => !c.iskljucena).length,
    poFazi: [1, 2, 3].map(f => CARD_DB.filter(c => !c.iskljucena && c.faza === f).length),
  }));
  check('sve kartice imaju fazu', tag.bezFaze === 0, String(tag.bezFaze));
  check('sve kartice imaju tempo', tag.bezTempa === 0, String(tag.bezTempa));
  check('svaka faza ima dovoljno kartica', tag.poFazi.every(n => n >= 40), JSON.stringify(tag.poFazi));

  console.log('\n2) Faza je razvojna, ne skala apstraktnosti');
  const dev = await page.evaluate(() => {
    const f = t => (CARD_DB.find(c => c.term === t) || {}).faza;
    return {
      lazniOsmijeh: f('lažni osmijeh'),          // skrivanje osjecaja -> mentalna
      gorkaPobjeda: f('gorka pobjeda'),          // proturjecni osjecaji -> reflektivna
      poklonRazocara: f('poklon koji razočara'), // zahvalnost + razocaranje odjednom
      prevrtanje: f('prevrtanje očima'),         // vidljiva gesta -> vanjska
      krivnja: f('krivnja'),                     // moralna emocija -> reflektivna
      macka: f('mačka koja prede'),               // korak 3, ali osjetilno -> faza 1
    };
  });
  check('„lažni osmijeh“ je mentalna faza (2)', dev.lazniOsmijeh === 2, String(dev.lazniOsmijeh));
  check('„gorka pobjeda“ je reflektivna faza (3)', dev.gorkaPobjeda === 3, String(dev.gorkaPobjeda));
  check('„poklon koji razočara“ je faza 3', dev.poklonRazocara === 3, String(dev.poklonRazocara));
  check('„prevrtanje očima“ je vanjska faza (1)', dev.prevrtanje === 1, String(dev.prevrtanje));
  check('„krivnja“ je moralna emocija → faza 3', dev.krivnja === 3, String(dev.krivnja));
  check('korak i faza su neovisne osi (korak 3 + faza 1)', dev.macka === 1, String(dev.macka));

  console.log('\n3) Sinonimni dvojnici se ne izvlače kao kartice');
  const syn = await page.evaluate(() => {
    const termini = new Set(CARD_DB.map(c => c.term));
    const dvojnici = [].concat(...Object.values(SINONIMI));
    const parovi = [['sreća','radost'],['sreća','vedrina'],['zabrinutost','briga'],
                    ['smirenost','opuštenost'],['suosjećanje','empatija'],['nada','optimizam'],
                    ['razigranost','živahnost'],['gorčina','ogorčenost']];
    return {
      dvojnika: dvojnici.length,
      kaoKartica: dvojnici.filter(d => termini.has(d)),
      nositeljBezKartice: Object.keys(SINONIMI).filter(k => !termini.has(k)),
      parovi: parovi.filter(([k, v]) => !(termini.has(k) && !termini.has(v))),
    };
  });
  check('nijedan dvojnik nije zasebna kartica', syn.kaoKartica.length === 0, syn.kaoKartica.join(', '));
  check('svaki nositelj sinonima postoji kao kartica', syn.nositeljBezKartice.length === 0, syn.nositeljBezKartice.join(', '));
  check('prioritetni parovi razriješeni — ostaje po jedan', syn.parovi.length === 0, JSON.stringify(syn.parovi));
  const drawn = await page.evaluate(() => {
    state.dob = '9+'; session.teskeTemeOn = true; state.mod = 'coop';
    const dvojnici = new Set([].concat(...Object.values(SINONIMI)));
    const t = new Set();
    for (let i = 0; i < 60; i++) { CARD_DB.forEach(c => c.everUsed = false); buildSnop(12).forEach(e => t.add(e.card.term)); }
    return [...t].filter(x => dvojnici.has(x));
  });
  check('u 60 snopova nijedan dvojnik nije izvučen', drawn.length === 0, drawn.slice(0, 4).join(', '));

  console.log('\n4) Ritam snopa');
  const ritam = await page.evaluate(() => {
    state.dob = '9+'; session.teskeTemeOn = false;
    const uzorci = [];
    for (let i = 0; i < 40; i++) { CARD_DB.forEach(c => c.everUsed = false); uzorci.push(buildSnop(12).map(e => e.card.tempo)); }
    return { uzorci, ocekivano: RITAM };
  });
  const tocnih = ritam.uzorci.filter(u => u.join(',') === ritam.ocekivano.join(',')).length;
  check('snop slijedi zadani ritam', tocnih === 40, `${tocnih}/40`);
  const trojke = ritam.uzorci.filter(u => u.some((t, i) => i >= 2 && t === 'duboko' && u[i-1] === 'duboko' && u[i-2] === 'duboko'));
  check('nikad tri duboke kartice zaredom', trojke.length === 0, String(trojke.length));

  console.log('\n5) Dobni filter propušta samo dopuštene faze');
  for (const [dob, faze] of [['4-6', [1]], ['6-8', [1, 2]], ['9+', [1, 2, 3]]]) {
    const r = await page.evaluate(([d, f]) => {
      state.dob = d; session.teskeTemeOn = false; state.mod = 'coop';
      const bad = [];
      for (let i = 0; i < 30; i++) {
        CARD_DB.forEach(c => c.everUsed = false);
        buildSnop(12).forEach(e => { if (!f.includes(e.card.faza)) bad.push(e.card.term + '=' + e.card.faza); });
      }
      return bad;
    }, [dob, faze]);
    check(`filter ${dob} daje samo faze ${faze.join('+')}`, r.length === 0, r.slice(0, 3).join(', '));
  }

  console.log('\n6) Teške teme su isključene dok ih odrasla osoba ne uključi');
  const teske = await page.evaluate(() => {
    state.dob = '9+'; state.mod = 'coop';
    session.teskeTemeOn = false;
    let off = 0;
    for (let i = 0; i < 40; i++) { CARD_DB.forEach(c => c.everUsed = false); off += buildSnop(12).filter(e => e.card.teska).length; }
    session.teskeTemeOn = true;
    let on = 0;
    for (let i = 0; i < 40; i++) { CARD_DB.forEach(c => c.everUsed = false); on += buildSnop(12).filter(e => e.card.teska).length; }
    return { off, on, ukupno: CARD_DB.filter(c => c.teska).length };
  });
  check('prekidač je po zadanom isključen', await page.evaluate(() => { session.teskeTemeOn = false; return session.teskeTemeOn; }) === false);
  check('ugašeno → nijedna teška kartica u 40 snopova', teske.off === 0, String(teske.off));
  check('uključeno → teške se pojavljuju', teske.on > 0, String(teske.on));
  check('„Roditelji se svađaju“ je označena kao teška',
        await page.evaluate(() => CARD_DB.find(c => c.term === 'Roditelji se svađaju, a ti to čuješ iz sobe.').teska));

  console.log('\n7) Teška kartica: izlaz bez kazne i obavezni redak');
  await page.evaluate(() => { session.teskeTemeOn = true; state.dob = '9+'; state.mod = 'coop'; });
  await page.click('#screen-naslovna button.btn');
  await page.click('#screen-postavke button.btn-wide');
  await page.waitForSelector('#screen-predaja.active');
  const skipTest = await page.evaluate(() => {
    const teska = CARD_DB.find(c => c.teska && !c.iskljucena);
    state.snop[state.cardIndex] = { card: teska, isRepeat: false };
    return teska.term;
  });
  await page.waitForSelector('#reveal-btn:not([disabled])');
  await page.click('#reveal-btn');
  await page.waitForSelector('#screen-kartica.active');
  check('gumb za preskakanje je vidljiv na teškoj kartici',
        await page.$eval('#safety-skip', e => e.style.display !== 'none'));
  const beforeLen = await page.evaluate(() => state.snop.length);
  const beforeIdx = await page.evaluate(() => state.cardIndex);
  await page.click('#safety-skip');
  await page.waitForSelector('#screen-predaja.active', { timeout: 3000 });
  const after = await page.evaluate(() => ({
    idx: state.cardIndex, len: state.snop.length,
    zamjena: state.snop[state.cardIndex].card.term,
    zadnji: session.log[session.log.length - 1],
    rezultati: state.results.filter(Boolean).length,
  }));
  check('kartica zamijenjena, snop ostaje iste duljine', after.len === beforeLen && after.idx === beforeIdx);
  check('zamjena nije opet teška kartica',
        !(await page.evaluate(t => CARD_DB.find(c => c.term === t).teska, after.zamjena)), after.zamjena);
  check('ne broji se kao promašaj', after.zadnji.ishod === 'sigurnosno preskočeno', after.zadnji.ishod);
  check('ne troši bod', after.rezultati === 0, String(after.rezultati));

  // obavezni redak nakon odigrane teške kartice
  await page.evaluate(() => {
    const teska = CARD_DB.find(c => c.teska && !c.iskljucena);
    state.snop[state.cardIndex] = { card: teska, isRepeat: false };
  });
  await page.waitForSelector('#reveal-btn:not([disabled])');
  await page.click('#reveal-btn');
  await page.click('#screen-kartica .btn-ok');
  check('nakon teške kartice dolazi obavezni redak',
        await page.evaluate(() => state.screen) === 'teska', await page.evaluate(() => state.screen));
  const tekst = await page.$eval('#screen-teska', e => e.textContent);
  check('redak pita kome se dijete može javiti', tekst.includes('Kome se možeš javiti'), tekst.slice(0, 60));
  check('teška kartica nikad ne ide u „Tko je ovo od nas?“',
        await page.evaluate(() => CARD_DB.filter(c => c.teska).every(c => c.sigurno === false)));

  console.log(`\n══ ${pass} prošlo, ${fail} palo, JS grešaka: ${jsErr.length} ══`);
  jsErr.slice(0, 5).forEach(e => console.log('  ! ' + e));
  await browser.close();
  process.exit(fail || jsErr.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
