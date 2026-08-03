// Sadrzaj v2.3: puna partija u svakom modu i svakoj dobi
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport:{width:360,height:640} });
  const p = await ctx.newPage(); const err=[]; const net=[];
  p.on('pageerror',e=>err.push(e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!m.text().includes('ERR_CONNECTION')) err.push(m.text()); });
  p.on('request',r=>{ if(!r.url().startsWith('file://')) net.push(r.url()); });
  p.on('dialog',d=>d.accept());
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));

  async function partija(modIdx, dobIdx, kartica) {
    await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
    await p.click('#screen-naslovna button.btn');
    await p.click(`#mode-options .option-btn:nth-child(${modIdx})`);
    await p.click(`#dob-options .option-btn:nth-child(${dobIdx})`);
    await p.click('#screen-postavke button.btn-wide');
    await p.waitForSelector('#screen-predaja.active');
    for(let i=0;i<kartica;i++){
      await p.waitForSelector('#reveal-btn:not([disabled])',{timeout:5000});
      await p.click('#reveal-btn');
      await p.waitForSelector('#screen-kartica.active');
      const term = await p.$eval('#card-term',e=>e.textContent.trim());
      if(!term) throw new Error('prazan pojam na kartici '+i);
      await p.click('#screen-kartica .btn-ok');
      for(const sel of ['#screen-pojasnjenje','#screen-teska']) if(await p.$(sel+'.active')) await p.click(sel+' button.btn');
      if(await p.$('#screen-tkojeovo.active')) await p.click('#tko-skip');
      if(await p.$('#screen-zeton.active')) await p.click('#screen-zeton button.btn-outline');
      await p.waitForFunction(()=>document.getElementById('screen-predaja').classList.contains('active')||document.getElementById('screen-rezultat').classList.contains('active'),{timeout:5000});
    }
    await p.waitForSelector('#screen-rezultat.active');
  }

  console.log('\n1) Puna partija u svakom modu × svakoj dobi');
  for(const [mi,mn,kart] of [[1,'Zajedno',12],[2,'Eskalacija',10],[3,'Dvoboj',12]])
    for(const [di,dn] of [[1,'4–6'],[2,'6–8'],[3,'9+']]) {
      try { await partija(mi,di,kart); C(`${mn} · dob ${dn}`, true); }
      catch(e){ C(`${mn} · dob ${dn}`, false, e.message); }
    }

  console.log('\n2) Pojašnjenje se prikazuje za sve špilove');
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  const exp = await p.evaluate(()=>{
    const out={};
    for(const deck of ['EMOCIJE','TRENUCI','TJELESNE','PONASANJA']){
      const c=CARD_DB.find(x=>x.deck===deck);
      out[deck]={ima:!!POJASNJENJA[c.term], label:DECK_LABEL[deck], boja:!!DECK_COLOR[deck]};
    }
    return out;
  });
  for(const [d,v] of Object.entries(exp)) C(`${d}: pojašnjenje + naziv + boja`, v.ima&&v.label&&v.boja, JSON.stringify(v));

  console.log('\n3) Sigurnosna arhitektura radi na vraćenim teškim temama');
  const saf = await p.evaluate(()=>{
    session.teskeTemeOn=false; state.dob='9+'; state.mod='coop';
    let off=0; for(let i=0;i<40;i++){ CARD_DB.forEach(c=>c.everUsed=false); off+=buildSnop(12).filter(e=>e.card.teska).length; }
    session.teskeTemeOn=true;
    let on=0; for(let i=0;i<40;i++){ CARD_DB.forEach(c=>c.everUsed=false); on+=buildSnop(12).filter(e=>e.card.teska).length; }
    return {off,on};
  });
  C('prekidač ugašen → nijedna teška kartica u 40 snopova', saf.off===0, String(saf.off));
  C('prekidač uključen → teške se pojavljuju', saf.on>0, String(saf.on));

  console.log('\n4) Offline');
  C('nula vanjskih mrežnih zahtjeva', net.length===0, net.slice(0,3).join(', '));
  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.slice(0,5).forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
