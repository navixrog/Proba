const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); const err=[]; p.on('pageerror',e=>err.push(e.message));
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));
  const r = await p.evaluate(()=>{
    const out={};
    for(const mod of ['coop','eskalacija','dvoboj'])
      for(const dob of ['4-6','6-8','9+'])
        for(const ri of [0,1,2]){
          state.mod=mod; state.dob=dob; state.roundIndex=ri;
          out[`${mod}|${dob}|r${ri+1}`]=turnSeconds();
        }
    return out;
  });
  C('coop 6-8 = 60s', r['coop|6-8|r1']===60, String(r['coop|6-8|r1']));
  C('coop 4-6 = 90s (+30)', r['coop|4-6|r1']===90, String(r['coop|4-6|r1']));
  C('coop ne ovisi o roundIndex', r['coop|9+|r1']===60&&r['coop|9+|r2']===60&&r['coop|9+|r3']===60);
  C('eskalacija 9+ runde = 60/25/45', r['eskalacija|9+|r1']===60&&r['eskalacija|9+|r2']===25&&r['eskalacija|9+|r3']===45,
    [r['eskalacija|9+|r1'],r['eskalacija|9+|r2'],r['eskalacija|9+|r3']].join('/'));
  C('eskalacija 4-6 runde = 90/55/75', r['eskalacija|4-6|r1']===90&&r['eskalacija|4-6|r2']===55&&r['eskalacija|4-6|r3']===75,
    [r['eskalacija|4-6|r1'],r['eskalacija|4-6|r2'],r['eskalacija|4-6|r3']].join('/'));
  C('dvoboj isto kao eskalacija', r['dvoboj|9+|r2']===25&&r['dvoboj|9+|r3']===45);
  C('runda 2 kraća od runde 1 i 3 u svim dobima',
    ['4-6','6-8','9+'].every(d=>r[`eskalacija|${d}|r2`]<r[`eskalacija|${d}|r1`]&&r[`eskalacija|${d}|r2`]<r[`eskalacija|${d}|r3`]));
  // stvarni timer na ekranu
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  await p.click('#screen-naslovna button.btn');
  await p.click('#mode-options .option-btn:nth-child(2)');
  await p.click('#screen-postavke button.btn-wide');
  await p.waitForSelector('#screen-predaja.active');
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  const t1 = await p.$eval('#timer-display',e=>+e.textContent);
  C(`timer runde 1 kreće od ~60 (${t1})`, t1>=58&&t1<=60, String(t1));
  await p.evaluate(()=>{ state.roundIndex=1; });
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-predaja.active',{timeout:4000});
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  const t2 = await p.$eval('#timer-display',e=>+e.textContent);
  C(`timer runde 2 kreće od ~25 (${t2})`, t2>=23&&t2<=25, String(t2));
  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
