const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({viewport:{width:360,height:640}})).newPage();
  const err=[]; p.on('pageerror',e=>err.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));

  // Razmaci: nikad 5 zaredom bez, nikad svaki put
  const raz = await p.evaluate(()=>{
    const out=[]; for(let t=0;t<300;t++){
      state.mehBrojac=0; state.mehPrag=novRazmak();
      let gap=0, gaps=[];
      for(let i=0;i<40;i++){ if(okidaMehaniku('mehBrojac','mehPrag')){gaps.push(gap);gap=0;} else gap++; }
      out.push(...gaps);
    }
    return {min:Math.min(...out),max:Math.max(...out),avg:(out.reduce((a,b)=>a+b,0)/out.length).toFixed(2),n:out.length};
  });
  C(`razmak između okidanja 1–3 kartice (prosjek ${raz.avg})`, raz.min>=1&&raz.max<=3, JSON.stringify(raz));
  C('mehanika se nikad ne okida svaki put', raz.min>=1, 'min='+raz.min);
  C('nikad 5+ kartica bez mehanike', raz.max<=3, 'max='+raz.max);

  // Stvarna partija: broj dodira po kartici
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  await p.click('#screen-naslovna button.btn');
  await p.evaluate(()=>{ session.tkoJeOvoOn = true; });
  await p.click('#screen-postavke button.btn-wide');
  await p.waitForSelector('#screen-predaja.active');
  let taps=0, mech=0;
  for(let i=0;i<12;i++){
    await p.waitForSelector('#reveal-btn:not([disabled])',{timeout:4000});
    await p.click('#reveal-btn'); taps++;
    await p.waitForSelector('#screen-kartica.active');
    await p.click('#screen-kartica .btn-ok'); taps++;
    if(await p.$('#screen-tkojeovo.active')){ mech++;
      await p.waitForSelector('#tko-phase-pick',{state:'visible',timeout:6000});
      await p.click('#tko-grid .pick-btn'); taps++;
      await p.click('#tko-phase-title button.btn'); taps++; }
    if(await p.$('#screen-zeton.active')){ mech++;
      await p.click('#screen-zeton button.btn-outline'); taps++; }
    await p.waitForFunction(()=>document.getElementById('screen-predaja').classList.contains('active')||document.getElementById('screen-rezultat').classList.contains('active'),{timeout:4000});
  }
  const perCard = taps/12;
  C(`prosjek dodira po kartici ${perCard.toFixed(2)} (<3)`, perCard<3, String(perCard));
  C(`mehanika se pojavila ${mech}× u 12 kartica (ne svaki put)`, mech>0&&mech<12, String(mech));
  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
