const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); const err=[]; p.on('pageerror',e=>err.push(e.message));
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));
  await p.click('#screen-naslovna button.btn');
  await p.click('#screen-postavke button.btn-wide');
  await p.waitForSelector('#screen-predaja.active');

  const ritual = await p.$eval('.ritual', e=>e.textContent.replace(/\s+/g,' ').trim());
  C('redak traži da grupa vikne naslov', /viknite/i.test(ritual) && /ŠTO TI JE/.test(ritual), ritual);

  const t0 = Date.now();
  const odmah = await p.$eval('#reveal-btn', e=>e.disabled);
  C('gumb je zaključan odmah po ulasku', odmah === true);
  await p.waitForTimeout(700);
  C('gumb je i dalje zaključan nakon 0,7 s', await p.$eval('#reveal-btn',e=>e.disabled) === true);
  await p.waitForSelector('#reveal-btn:not([disabled])', { timeout: 4000 });
  const proteklo = Date.now() - t0;
  C(`otključava se nakon ~1,5 s (izmjereno ${proteklo} ms)`, proteklo >= 1400 && proteklo <= 2200, String(proteklo));

  // vrijedi na svakoj kartici, ne samo na prvoj
  await p.click('#reveal-btn');
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-predaja.active',{timeout:4000});
  C('ritual se ponavlja i na sljedećoj kartici', await p.$eval('#reveal-btn',e=>e.disabled) === true);
  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
