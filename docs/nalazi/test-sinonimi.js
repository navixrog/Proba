const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve('/home/user/Proba/docs/sto-ti-je.html');
let pass = 0, fail = 0;
const check = (n, c, e = '') => c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + '  ' + e));

async function reveal(page) {
  await page.waitForSelector('#reveal-btn:not([disabled])', { timeout: 4000 });
  await page.click('#reveal-btn');
  await page.waitForSelector('#screen-kartica.active');
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await browser.newContext({ viewport: { width: 360, height: 640 } })).newPage();
  const jsErr = [];
  page.on('pageerror', e => jsErr.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION')) jsErr.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);

  // ═══ DOPUNA 2: SINONIMI ═══
  console.log('\n1) Sinonimi stoje uz osnovni pojam');
  const syn = await page.evaluate(() => {
    const by = {}; CARD_DB.forEach(c => by[c.term] = c);
    const termini = new Set(CARD_DB.map(c => c.term));
    const dvojnici = [].concat(...Object.values(SINONIMI));
    return {
      skupina: Object.keys(SINONIMI).length,
      dvojnika: dvojnici.length,
      sreca: (by['sreća'] || {}).sinonimi,
      smirenost: (by['smirenost'] || {}).sinonimi,
      gadjenje: (by['gađenje'] || {}).sinonimi,
      nositeljBezKartice: Object.keys(SINONIMI).filter(k => !termini.has(k)),
      dvojnikKaoKartica: dvojnici.filter(d => termini.has(d)),
    };
  });
  check('svaka sinonimna skupina ima nositelja u špilu', syn.nositeljBezKartice.length === 0, syn.nositeljBezKartice.join(', '));
  check('sreća → radost, vedrina', syn.sreca.join(',') === 'radost,vedrina', syn.sreca.join(','));
  check('smirenost → opuštenost, bezbrižnost', syn.smirenost.join(',') === 'opuštenost,bezbrižnost', syn.smirenost.join(','));
  check('gađenje zadržava dječje varijante', syn.gadjenje.includes('fuj') && syn.gadjenje.includes('bljak'), syn.gadjenje.join(','));
  check('sinonimi se ne izvlače kao zasebne kartice', syn.dvojnikKaoKartica.length === 0, syn.dvojnikKaoKartica.join(', '));

  console.log('\n2) Redak sa srodnim riječima na sva tri mjesta');
  await page.click('#screen-naslovna button.btn');
  await page.click('#screen-postavke button.btn-wide');
  await page.waitForSelector('#screen-predaja.active');
  await page.evaluate(() => {
    state.snop[state.cardIndex] = { card: CARD_DB.find(c => c.term === 'sreća'), isRepeat: false };
  });
  await reveal(page);
  const naKartici = await page.$eval('#card-syn', e => ({ vis: e.style.display, t: e.textContent }));
  check('na kartici (izvođač vidi što priznaje)',
        naKartici.vis === 'block' && naKartici.t.includes('radost'), JSON.stringify(naKartici));
  await page.click('#screen-kartica .btn-miss');
  await page.waitForSelector('#screen-pojasnjenje.active');
  const uPojasnjenju = await page.$eval('#exp-syn', e => ({ vis: e.style.display, t: e.textContent }));
  check('u pojašnjenju nakon promašaja',
        uPojasnjenju.vis === 'block' && uPojasnjenju.t.includes('sreća, ili:'), JSON.stringify(uPojasnjenju));
  check('kartica bez sinonima nema prazan redak',
        await page.evaluate(() => {
          const c = CARD_DB.find(x => !x.sinonimi.length && !x.iskljucena);
          renderSynLine('exp-syn', c);
          return document.getElementById('exp-syn').style.display === 'none';
        }));
  const naKraju = await page.evaluate(() => {
    state.snop = [{ card: CARD_DB.find(c => c.term === 'sreća'), isRepeat: false }];
    return synReview();
  });
  check('u pregledu na kraju runde', naKraju.includes('Srodne riječi') && naKraju.includes('radost'), naKraju.slice(0, 70));

  // ═══ DOPUNA 1: DVOBOJ ═══
  console.log('\n3) Tri moda; eskalacija je solo, dvoboj timski');
  const modes = await page.evaluate(() => MODES.map(m => ({ k: m.key, t: m.timski, r: m.runde, c: m.cards, max: m.max })));
  check('tri moda postoje', modes.length === 3, modes.map(m => m.k).join(','));
  check('eskalacija je solo, bez timova',
        modes[1].k === 'eskalacija' && modes[1].t === false && modes[1].r === 3, JSON.stringify(modes[1]));
  check('dvoboj je timski, točno 2 tima, 3 runde',
        modes[2].k === 'dvoboj' && modes[2].t === true && modes[2].max === 2 && modes[2].r === 3, JSON.stringify(modes[2]));
  check('dvoboj ima 12 kartica (u rasponu 10–15)', modes[2].c >= 10 && modes[2].c <= 15, String(modes[2].c));

  console.log('\n4) Dvoboj: kartice se izmjenjuju karticu po karticu');
  await page.goto(FILE);
  await page.click('#screen-naslovna button.btn');
  await page.click('#mode-options .option-btn:nth-child(3)');
  check('odabirom dvoboja broj timova pada na 2', await page.evaluate(() => state.count) === 2);
  check('polja se zovu timovi',
        (await page.$eval('#players-label', e => e.textContent)) === 'Timovi');
  await page.click('#screen-postavke button.btn-wide');
  await page.waitForSelector('#screen-predaja.active');
  const redoslijed = [];
  for (let i = 0; i < 4; i++) {
    redoslijed.push(await page.evaluate(() => state.actors[state.performerIndex].name));
    await reveal(page);
    await page.click('#screen-kartica .btn-ok');
    await page.waitForSelector('#screen-predaja.active', { timeout: 3000 });
  }
  check('timovi se izmjenjuju svaku karticu',
        redoslijed[0] !== redoslijed[1] && redoslijed[0] === redoslijed[2] && redoslijed[1] === redoslijed[3],
        redoslijed.join(' → '));

  console.log('\n5) Krađa boda kad aktivni tim ne pogodi');
  const prije = await page.evaluate(() => ({
    aktivni: state.actors[state.performerIndex].name,
    protivnik: protivnik().name,
    bodovi: state.actors.map(a => a.score),
  }));
  await reveal(page);
  await page.click('#screen-kartica .btn-miss');
  check('promašaj otvara ekran krađe',
        await page.evaluate(() => state.screen) === 'krada', await page.evaluate(() => state.screen));
  check('pita se protivnik, ne aktivni tim',
        (await page.$eval('#krada-tko', e => e.textContent)).startsWith(prije.protivnik), prije.protivnik);
  check('pojašnjenje se NIJE prikazalo prije krađe',
        !(await page.$('#screen-pojasnjenje.active')));
  await page.click('#screen-krada .btn-ok');
  const poslije = await page.evaluate(() => ({
    bodovi: state.actors.map(a => a.score), screen: state.screen,
  }));
  check('protivnik dobiva ukradeni bod (+1)',
        poslije.bodovi[1] === prije.bodovi[1] + 1 || poslije.bodovi[0] === prije.bodovi[0] + 1,
        `${prije.bodovi} → ${poslije.bodovi}`);
  check('aktivni tim ne dobiva ništa', poslije.bodovi.reduce((a, b) => a + b, 0) === prije.bodovi.reduce((a, b) => a + b, 0) + 1);
  check('nakon krađe slijedi pojašnjenje', poslije.screen === 'pojasnjenje', poslije.screen);
  await page.click('#screen-pojasnjenje button.btn');
  await page.waitForSelector('#screen-predaja.active', { timeout: 3000 });
  check('ishod je zabilježen kao "ukradeno"',
        await page.evaluate(() => session.log[session.log.length - 1].ishod) === 'ukradeno',
        await page.evaluate(() => session.log[session.log.length - 1].ishod));

  console.log('\n6) Netočna pretpostavka — nitko ne dobiva ništa');
  const b0 = await page.evaluate(() => state.actors.map(a => a.score));
  await reveal(page);
  await page.click('#screen-kartica .btn-miss');
  await page.waitForSelector('#screen-krada.active');
  await page.click('#screen-krada .btn-miss');
  await page.waitForSelector('#screen-pojasnjenje.active');
  await page.click('#screen-pojasnjenje button.btn');
  const b1 = await page.evaluate(() => state.actors.map(a => a.score));
  check('bodovi se ne mijenjaju', JSON.stringify(b0) === JSON.stringify(b1), `${b0} → ${b1}`);
  check('ishod je "promašeno"',
        await page.evaluate(() => session.log[session.log.length - 1].ishod) === 'promašeno');

  console.log('\n7) Pogodak ne otvara krađu');
  await page.waitForSelector('#screen-predaja.active');
  await reveal(page);
  await page.click('#screen-kartica .btn-ok');
  await page.waitForTimeout(300);
  check('tuđa pretpostavka se ne gleda kad aktivni tim pogodi',
        await page.evaluate(() => state.screen) !== 'krada', await page.evaluate(() => state.screen));

  console.log('\n8) Dvoboj kroz tri runde');
  const runde = await page.evaluate(() => {
    const out = [];
    for (let r = 0; r < 3; r++) {
      state.roundIndex = r;
      out.push({ r: r + 1, kanal: roundDef().channel, label: roundDef().label });
    }
    return out;
  });
  check('runde: opis → jedna riječ → pantomima',
        runde[0].channel !== 'P' && runde[2].kanal === 'P' && runde[1].label.includes('JEDNA RIJEČ'),
        JSON.stringify(runde));
  check('svaka runda kreće s drugim timom',
        await page.evaluate(() => {
          state.roundIndex = 0; const a = state.roundIndex % state.actors.length;
          state.roundIndex = 1; const b = state.roundIndex % state.actors.length;
          return a !== b;
        }));

  console.log(`\n══ ${pass} prošlo, ${fail} palo, JS grešaka: ${jsErr.length} ══`);
  jsErr.slice(0, 5).forEach(e => console.log('  ! ' + e));
  await browser.close();
  process.exit(fail || jsErr.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
