const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/Proba/docs/sto-ti-je.html');
let pass = 0, fail = 0;
const check = (n, c, e = '') => c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + '   ' + e));

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 360, height: 640 } })).newPage();
  const jsErr = [];
  page.on('pageerror', e => jsErr.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) jsErr.push(m.text()); });
  const reqs = [];
  page.on('request', r => { if (!r.url().startsWith('file://')) reqs.push(r.url()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);

  console.log('\n1) Razvojne faze — popis v2.3');
  const f = await page.evaluate(() => {
    const g = t => (CARD_DB.find(c => c.term === t) || {}).faza;
    const k = t => (CARD_DB.find(c => c.term === t) || {}).korak;
    return {
      sram: g('sram'), ponos: g('ponos'), zabrinutost: g('zabrinutost'), hrabrost: g('hrabrost'),
      snijeg: g('prvi snijeg'), dekica: g('topla dekica'),
      gorka: g('gorka pobjeda'), prisilna: g('prisilna isprika'),
      krijesnice: g('lov na krijesnice'), krijesniceK: k('lov na krijesnice'),
      cringe: g('sram zbog drugoga (cringe)'),
      lazniOsmijeh: g('lažni osmijeh'), oprostitiSebi: g('oprostiti sebi'),
      stucanje: g('štucanje'), toplinaPrsa: g('toplina u prsima'),
    };
  });
  check('samosvjesne emocije ostaju u fazi 2, ne 1', [f.sram, f.ponos, f.zabrinutost, f.hrabrost].every(x => x >= 2),
        `sram=${f.sram} ponos=${f.ponos} zabrinutost=${f.zabrinutost} hrabrost=${f.hrabrost}`);
  check('osjetilni trenuci su faza 1', f.snijeg === 1 && f.dekica === 1, `${f.snijeg}/${f.dekica}`);
  check('miješani i moralni trenuci su faza 3', f.gorka === 3 && f.prisilna === 3, `${f.gorka}/${f.prisilna}`);
  check('korak ≠ faza: „lov na krijesnice“ korak 3, faza 1', f.krijesniceK === 3 && f.krijesnice === 1,
        `korak=${f.krijesniceK} faza=${f.krijesnice}`);
  check('„sram zbog drugoga“ traži tuđu perspektivu → faza 3', f.cringe === 3, String(f.cringe));
  check('skrivanje osjećaja → faza 2', f.lazniOsmijeh === 2, String(f.lazniOsmijeh));
  check('„oprostiti sebi“ traži unutarnji standard → faza 3', f.oprostitiSebi === 3, String(f.oprostitiSebi));
  check('vidljive tjelesne reakcije → faza 1', f.stucanje === 1, String(f.stucanje));
  check('interoceptivne tjelesne → faza 3', f.toplinaPrsa === 3, String(f.toplinaPrsa));

  console.log('\n2) Sinonimi — dvojnici stoje uz nositelja');
  const s2 = await page.evaluate(() => {
    const g = t => (CARD_DB.find(c => c.term === t) || {}).sinonimi || [];
    const termini = new Set(CARD_DB.map(c => c.term));
    return { sreca: g('sreća'), gadjenje: g('gađenje'), smirenost: g('smirenost'),
      anksioznost: termini.has('anksioznost'), tjeskoba: termini.has('tjeskoba'),
      dvojnikKaoKartica: [].concat(...Object.values(SINONIMI)).filter(d => termini.has(d)) };
  });
  check('sreća → radost, vedrina', s2.sreca.join(',') === 'radost,vedrina', s2.sreca.join(','));
  check('gađenje zadržava dječje varijante', s2.gadjenje.includes('fuj'), s2.gadjenje.join(','));
  check('smirenost → opuštenost, bezbrižnost', s2.smirenost.length === 2, s2.smirenost.join(','));
  check('kad popis izbaci nositelja, sinonim postaje kartica', s2.anksioznost && !s2.tjeskoba,
        `anksioznost=${s2.anksioznost} tjeskoba=${s2.tjeskoba}`);
  check('nijedan dvojnik se ne izvlači', s2.dvojnikKaoKartica.length === 0, s2.dvojnikKaoKartica.join(','));

  console.log('\n3) Ograničenja se filtriraju po dobi');
  const METAFORE = ['prognozu', 'životinju', 'boju i zvuk', 'vijest na televiziji', 'bez riječi'];
  for (const [dob, smijeMetaforu] of [['4-6', false], ['6-8', false], ['9+', true]]) {
    const r = await page.evaluate(([d, mets]) => {
      state.dob = d;
      const out = { ukupno: 0, metafora: 0, praznih: 0 };
      for (const ch of ['O', 'P', 'C']) {
        for (let i = 0; i < 400; i++) {
          const o = pickOgranicenje(null, ch);
          if (!o) { out.praznih++; continue; }
          out.ukupno++;
          if (mets.some(m => o.t.includes(m))) out.metafora++;
        }
      }
      return out;
    }, [dob, METAFORE]);
    check(`${dob}: ${smijeMetaforu ? 'metafore dopuštene' : 'nijedna metafora u 1200 izvlačenja'}`,
      smijeMetaforu ? r.metafora > 0 : r.metafora === 0, `metafora=${r.metafora}`);
    check(`${dob}: svaki kanal uvijek ima ograničenje`, r.praznih === 0, `praznih=${r.praznih}`);
  }

  console.log('\n4) Eskalacija — broj izvedbi po igraču');
  for (const n of [6, 7, 8]) {
    const r = await page.evaluate((n) => {
      state.mod = 'eskalacija'; state.dob = '9+'; state.count = n;
      state.names = Array(n).fill(''); startSnop();
      const perf = Array(n).fill(0);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 10; c++) { perf[state.performerIndex]++; state.performerIndex = (state.performerIndex + 1) % n; }
        if (r < 2) { state.roundIndex = r + 1; if (isTimski()) state.performerIndex = state.roundIndex % n; }
      }
      return perf;
    }, n);
    const min = Math.min(...r), max = Math.max(...r);
    check(`${n} igrača: raspon ${min}–${max} (razlika ≤1)`, max - min <= 1, r.join(','));
  }

  console.log('\n5) Poravnata krađa');
  const k = await page.evaluate(() => {
    state.mod = 'dvoboj'; state.dob = '9+'; state.count = 2; state.names = ['A', 'B'];
    startSnop();
    const out = {};
    // slucaj 1: kradljivac zaostaje → puni bod
    state.actors[0].score = 5; state.actors[1].score = 2; state.performerIndex = 0;
    state.pendingResult = { kradaRijesena: false, krada: null };
    state.currentDraw = state.snop[0]; resolveKrada(true);
    out.zaostaje = state.actors[1].score - 2;
    // slucaj 2: kradljivac vodi → pola boda
    state.actors[0].score = 2; state.actors[1].score = 5; state.performerIndex = 0;
    state.pendingResult = { kradaRijesena: false, krada: null };
    resolveKrada(true);
    out.vodi = state.actors[1].score - 5;
    // slucaj 3: izjednaceno → puni bod
    state.actors[0].score = 3; state.actors[1].score = 3; state.performerIndex = 0;
    state.pendingResult = { kradaRijesena: false, krada: null };
    resolveKrada(true);
    out.izjednaceno = state.actors[1].score - 3;
    return out;
  });
  check('kradljivac koji zaostaje dobiva 1', k.zaostaje === 1, String(k.zaostaje));
  check('kradljivac koji vodi dobiva 0.5', k.vodi === 0.5, String(k.vodi));
  check('kod izjednačenog rezultata dobiva 1', k.izjednaceno === 1, String(k.izjednaceno));

  console.log('\n6) Ljestvica — BLIZU više ne ruši dvije stepenice');
  const l = await page.evaluate(() => ({ p12: ljestvica(12), p115: ljestvica(11.5), p11: ljestvica(11), p9: ljestvica(9) }));
  check('12 i 11.5 dijele vrh', l.p12 === l.p115 && l.p12.includes('Zabrinjavajuće'), `${l.p12} | ${l.p115}`);
  check('11 je i dalje stepenica niže', l.p11 !== l.p12 && l.p11.includes('Čitate'), l.p11);

  console.log('\n7) Sadržaj — popis v2.3 u cijelosti');
  const r7 = await page.evaluate(() => {
    const musko = /\b(si|nisi)\s+\w+(ao|io)\b|\bPonosan si\b|\bDobio si\b/;
    return {
      ukupno: CARD_DB.length,
      spilovi: [...new Set(CARD_DB.map(c => c.deck))].sort(),
      bezPojasnjenja: CARD_DB.filter(c => !POJASNJENJA[c.term]).map(c => c.term),
      musko: CARD_DB.filter(c => musko.test(c.term)).map(c => c.term),
      teske: CARD_DB.filter(c => c.teska).length,
      teskeSigurne: CARD_DB.filter(c => c.teska && c.sigurno).length,
      trenuciSigurni: CARD_DB.filter(c => c.deck === 'TRENUCI' && c.sigurno).length,
      dupli: CARD_DB.length - new Set(CARD_DB.map(c => c.term)).size,
      bezKanala: CARD_DB.filter(c => !c.channels || !c.channels.length).length,
    };
  });
  check('svaka kartica ima pojašnjenje', r7.bezPojasnjenja.length === 0, r7.bezPojasnjenja.slice(0, 3).join(' | '));
  check('nijedan pojam nije u muškom rodu', r7.musko.length === 0, r7.musko.slice(0, 3).join(' | '));
  check('četiri špila, TRENUCI zamijenili SITUACIJE', r7.spilovi.join(',') === 'EMOCIJE,PONASANJA,TJELESNE,TRENUCI', r7.spilovi.join(','));
  check('10 teških tema vraćeno uz novi popis', r7.teske === 10, String(r7.teske));
  check('nijedna teška kartica nije „sigurna“', r7.teskeSigurne === 0, String(r7.teskeSigurne));
  check('TRENUCI nikad ne idu u „Tko je ovo od nas?“', r7.trenuciSigurni === 0, String(r7.trenuciSigurni));
  check('nema duplikata', r7.dupli === 0, String(r7.dupli));
  check('svaka kartica ima kanale', r7.bezKanala === 0, String(r7.bezKanala));

  console.log('\n8) Tempo — dob 6–8 sada ima duboke kartice');
  const t = await page.evaluate(() => {
    const out = {};
    for (const [dob, faze] of [['4-6', [1]], ['6-8', [1, 2]], ['9+', [1, 2, 3]]]) {
      const pool = CARD_DB.filter(c => !c.iskljucena && faze.includes(c.faza) && !c.teska);
      out[dob] = { ukupno: pool.length, duboko: pool.filter(c => c.tempo === 'duboko').length };
    }
    return out;
  });
  check('6–8 ima ≥3 duboke kartice (RITAM ih traži 3)', t['6-8'].duboko >= 3, JSON.stringify(t['6-8']));
  check('9+ i dalje ima duboke', t['9+'].duboko > 0, JSON.stringify(t['9+']));
  check('svaka dob ima ≥12 kartica za snop', Object.values(t).every(x => x.ukupno >= 12), JSON.stringify(t));

  console.log('\n9) Igra i dalje radi offline i odigra se do kraja');
  await page.goto(FILE);
  await page.click('#screen-naslovna button.btn');
  await page.click('#dob-options .option-btn:nth-child(1)');   // 4-6, najosjetljivija dob
  await page.click('#screen-postavke button.btn-wide');
  await page.waitForSelector('#screen-predaja.active');
  for (let i = 0; i < 12; i++) {
    await page.waitForSelector('#reveal-btn:not([disabled])', { timeout: 4000 });
    await page.click('#reveal-btn');
    await page.waitForSelector('#screen-kartica.active');
    await page.click('#screen-kartica .btn-ok');
    for (const sel of ['#screen-pojasnjenje', '#screen-teska']) {
      if (await page.$(sel + '.active')) await page.click(sel + ' button.btn');
    }
    if (await page.$('#screen-tkojeovo.active')) await page.click('#tko-skip');
    if (await page.$('#screen-zeton.active')) await page.click('#screen-zeton button.btn-outline');
    await page.waitForFunction(() =>
      document.getElementById('screen-predaja').classList.contains('active') ||
      document.getElementById('screen-rezultat').classList.contains('active'), { timeout: 4000 });
  }
  await page.waitForSelector('#screen-rezultat.active');
  check('partija za dob 4–6 odigrana do kraja', true);
  check('nula vanjskih mrežnih zahtjeva', reqs.length === 0, reqs.slice(0, 3).join(', '));

  console.log(`\n══ ${pass} prošlo, ${fail} palo, JS grešaka: ${jsErr.length} ══`);
  jsErr.slice(0, 5).forEach(e => console.log('  ! ' + e));
  await browser.close();
  process.exit(fail || jsErr.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
