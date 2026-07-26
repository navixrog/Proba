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

  console.log('\n1) Razvojne faze — preseljene kartice');
  const f = await page.evaluate(() => {
    const g = t => (CARD_DB.find(c => c.term === t) || {}).faza;
    return { smirenost: g('smirenost'), ugoda: g('ugoda'), znojni: g('znojni dlanovi'),
      toplina: g('toplina'), prevrtanje: g('prevrtanje u krevetu bez sna'),
      rezignacija: g('rezignacija'), polet: g('polet'), ocaranost: g('očaranost'),
      studij: g('Stariji brat/sestra odlazi na studij.'), tajna: g('Priznaš tajnu koju već dugo skrivaš.'),
      gadjenje: g('gađenje'), prevrtOcima: g('prevrtanje očima'), glumljenje: g('glumljenje da je sve u redu') };
  });
  check('smirenost → faza 2', f.smirenost === 2, String(f.smirenost));
  check('ugoda → faza 2', f.ugoda === 2, String(f.ugoda));
  check('znojni dlanovi → faza 2', f.znojni === 2, String(f.znojni));
  check('toplina → faza 3 (metafora)', f.toplina === 3, String(f.toplina));
  check('prevrtanje u krevetu bez sna → faza 1', f.prevrtanje === 1, String(f.prevrtanje));
  check('rezignacija → faza 3', f.rezignacija === 3, String(f.rezignacija));
  check('polet i očaranost → faza 3', f.polet === 3 && f.ocaranost === 3);
  check('obje miješane situacije → faza 3', f.studij === 3 && f.tajna === 3);
  check('gađenje ostaje faza 1 (uz sinonime)', f.gadjenje === 1, String(f.gadjenje));
  check('regresija: prevrtanje očima=1, glumljenje=2', f.prevrtOcima === 1 && f.glumljenje === 2);

  console.log('\n2) Sinonimi dječjeg registra');
  const s = await page.evaluate(() => {
    const g = t => (CARD_DB.find(c => c.term === t) || {}).sinonimi || [];
    return { gadjenje: g('gađenje'), srce: g('ubrzano lupanje srca'), koza: g('naježena koža'),
      sreca: g('sreća'), koljena: g('klecanje koljena'),
      nositeljiIskljuceni: CARD_DB.filter(c => c.sinonimi.length && c.iskljucena).length };
  });
  check('gađenje → fuj, bljak', s.gadjenje.join(',') === 'fuj,bljak', s.gadjenje.join(','));
  check('ubrzano lupanje srca ima dječju varijantu', s.srce.includes('srce lupa'), s.srce.join(','));
  check('naježena koža → ježim se', s.koza.includes('ježim se'));
  check('klecanje koljena ima dječju varijantu', s.koljena.length > 0);
  check('stari sinonimi netaknuti (sreća)', s.sreca.join(',') === 'radost,veselje,vedrina', s.sreca.join(','));
  check('nijedan nositelj nije isključen', s.nositeljiIskljuceni === 0);

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

  console.log('\n7) Preimenovanja — muški rod i pojašnjenja');
  const r7 = await page.evaluate(() => {
    const sit = CARD_DB.filter(c => c.deck === 'SITUACIJE' && !c.iskljucena);
    const musko = /\b(si|nisi)\s+\w+(ao|io)\b|\bPonosan si\b|\bDobio si\b/;
    return {
      sporne: sit.filter(c => musko.test(c.term)).map(c => c.term),
      bezPojasnjenja: CARD_DB.filter(c => !c.iskljucena && !POJASNJENJA[c.term]).map(c => c.term),
      staro: CARD_DB.some(c => c.term === 'projiciranje ljutnje na krivu osobu'),
      novo: CARD_DB.some(c => c.term === 'iskaljivanje ljutnje na krivoj osobi'),
      ukupno: CARD_DB.filter(c => !c.iskljucena).length,
    };
  });
  check('nijedna situacija ne oslovljava dijete u muškom rodu', r7.sporne.length === 0, r7.sporne.slice(0, 3).join(' | '));
  check('svaka aktivna kartica ima pojašnjenje', r7.bezPojasnjenja.length === 0, r7.bezPojasnjenja.slice(0, 3).join(' | '));
  check('„iskaljivanje ljutnje na krivoj osobi“ zamijenilo staru formulaciju', r7.novo && !r7.staro);
  check('broj aktivnih kartica nepromijenjen (247)', r7.ukupno === 247, String(r7.ukupno));

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
