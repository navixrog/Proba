const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); const err=[]; p.on('pageerror',e=>err.push(e.message)); p.on('dialog',d=>d.accept());
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));

  const r = await p.evaluate(()=>{
    const out={};
    for(const mod of ['eskalacija','dvoboj']){
      state.mod=mod; state.dob='9+'; state.count=2; state.names=['A','B']; startSnop();
      for(const ri of [0,1,2]){
        state.roundIndex=ri;
        const kan={O:0,P:0,C:0,null:0};
        for(let i=0;i<300;i++){
          state.cardIndex=0;
          const e={card:state.snop[0].card};
          const o = e.card.teska ? null : (state.roundIndex===1 ? null : pickOgranicenje(e.card, roundDef().channel));
          if(!o) kan.null++; else kan[o.ch]++;
        }
        out[`${mod}|r${ri+1}`]=kan;
      }
    }
    return out;
  });
  for(const mod of ['eskalacija','dvoboj']){
    C(`${mod} runda 1: samo opisna ograničenja (ch=O)`, r[`${mod}|r1`].O===300, JSON.stringify(r[`${mod}|r1`]));
    C(`${mod} runda 2: nijedno ograničenje`, r[`${mod}|r2`].null===300, JSON.stringify(r[`${mod}|r2`]));
    C(`${mod} runda 3: samo pantomimska (ch=P)`, r[`${mod}|r3`].P===300, JSON.stringify(r[`${mod}|r3`]));
  }

  // teške kartice i dalje bez ograničenja, u svim modovima i rundama
  const teske = await p.evaluate(()=>{
    let bez=0, uk=0;
    for(const mod of ['coop','eskalacija','dvoboj']){
      state.mod=mod; state.dob='9+'; session.teskeTemeOn=true;
      const t=CARD_DB.find(c=>c.teska&&!c.iskljucena);
      for(const ri of [0,1,2]){ state.roundIndex=ri;
        for(let i=0;i<50;i++){ uk++;
          const o = t.teska ? null : pickOgranicenje(t, 'O');
          if(!o) bez++; } }
    }
    return {bez,uk};
  });
  C('teške kartice nikad nemaju ograničenje', teske.bez===teske.uk, JSON.stringify(teske));

  // stvarna partija eskalacije: runda 1 pokazuje kutiju, runda 2 ne
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  await p.click('#screen-naslovna button.btn');
  await p.click('#mode-options .option-btn:nth-child(2)');
  await p.click('#screen-postavke button.btn-wide');
  await p.waitForSelector('#screen-predaja.active');
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  const v1 = await p.$eval('#constraint-box',e=>e.style.display);
  const txt = await p.$eval('#constraint-text',e=>e.textContent);
  C('runda 1 stvarno prikazuje ograničenje', v1==='flex'&&txt.length>5, `${v1} "${txt}"`);
  C('ograničenje runde 1 je opisno', /Opiši/.test(txt), txt);
  await p.evaluate(()=>{ state.roundIndex=1; });
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-predaja.active',{timeout:4000});
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  C('runda 2 nema kutiju s ograničenjem', await p.$eval('#constraint-box',e=>e.style.display)==='none');
  await p.evaluate(()=>{ state.roundIndex=2; });
  await p.click('#screen-kartica .btn-ok');
  await p.waitForSelector('#screen-predaja.active',{timeout:4000});
  await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
  const t3 = await p.$eval('#constraint-text',e=>e.textContent);
  C('runda 3 prikazuje pantomimsko ograničenje', /Odglumi/.test(t3), t3);
  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
