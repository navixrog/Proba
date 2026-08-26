const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({viewport:{width:360,height:640}})).newPage();
  const err=[]; p.on('pageerror',e=>err.push(e.message)); p.on('dialog',d=>d.accept());
  let ok=0,bad=0; const C=(n,c,e='')=>c?(ok++,console.log('  ✓ '+n)):(bad++,console.log('  ✗ '+n+'  '+e));
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');

  console.log('\n1) Svaka kartica koju dob 4–6 može dobiti ima emoji');
  const e1 = await p.evaluate(()=>{
    const pool = CARD_DB.filter(c=>c.faza===1);
    return { ukupno: pool.length, bez: pool.filter(c=>!c.emoji).map(c=>c.term),
      teskeBez: CARD_DB.filter(c=>c.faza===1&&c.teska&&!c.emoji).length,
      duplih: (()=>{const m={};CARD_DB.filter(c=>c.emoji).forEach(c=>m[c.emoji]=(m[c.emoji]||0)+1);
        return Object.entries(m).filter(([,n])=>n>2).length;})() };
  });
  C(`svih ${e1.ukupno} kartica faze 1 ima emoji`, e1.bez.length===0, e1.bez.slice(0,4).join(' | '));
  C('i teške kartice faze 1 imaju emoji', e1.teskeBez===0, String(e1.teskeBez));

  console.log('\n2) Način za najmlađe se pali samo na dobi 4–6');
  async function otvoriKarticu(dobIdx){
    await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
    await p.click('#screen-naslovna button.btn');
    await p.click(`#dob-options .option-btn:nth-child(${dobIdx})`);
    await p.click('#screen-postavke button.btn-wide');
    await p.waitForSelector('#screen-predaja.active');
    // isti pojam u obje dobi, inace se usporedjuju dvije razlicite klase duljine
    await p.evaluate(()=>{ state.snop[state.cardIndex]={card:CARD_DB.find(c=>c.term==='sreća'),isRepeat:false}; });
    await p.waitForSelector('#reveal-btn:not([disabled])'); await p.click('#reveal-btn');
    await p.waitForSelector('#screen-kartica.active');
  }
  await otvoriKarticu(1);
  C('dob 4–6 → kartica u dječjem načinu', await p.$eval('#term-card',e=>e.classList.contains('kids')));
  const emVid = await p.$eval('#card-emoji',e=>getComputedStyle(e).display!=='none'&&parseFloat(getComputedStyle(e).fontSize));
  C(`emoji je velik i vidljiv (${emVid}px)`, emVid>=70, String(emVid));
  const emTxt = await p.$eval('#card-emoji',e=>e.textContent);
  C('emoji nije rezervni upitnik', emTxt!=='❓'&&emTxt.length>0, emTxt);
  const note = await p.$eval('#card-note',e=>e.textContent);
  C('uputa je kratka (≤45 znakova)', note.length<=45, `${note.length}: ${note}`);
  C('uputa ima ikonu', /[🗣️✏️🎭👀]/.test(note), note);
  const termFs = await p.$eval('#card-term',e=>parseFloat(getComputedStyle(e).fontSize));

  await otvoriKarticu(3);
  C('dob 9+ → nema dječjeg načina', !(await p.$eval('#term-card',e=>e.classList.contains('kids'))));
  C('kod 9+ emoji ne zauzima prostor', await p.$eval('#card-emoji',e=>getComputedStyle(e).display)==='none');
  const note9 = await p.$eval('#card-note',e=>e.textContent);
  C('kod 9+ uputa je puna rečenica bez ikone', !/[🗣️✏️🎭👀]/.test(note9) && /—/.test(note9), note9);
  const termFs9 = await p.$eval('#card-term',e=>parseFloat(getComputedStyle(e).fontSize));
  C(`isti pojam je krupniji za najmlađe (${termFs} vs ${termFs9})`, termFs>termFs9);

  console.log('\n3) Kanal i suđenje imaju ikone u svim dobima');
  C('kanal na kartici ima ikonu', /[🗣️✏️🎭]/.test(await p.$eval('#card-stars',e=>e.textContent)),
     await p.$eval('#card-stars',e=>e.textContent));
  for (const [sel,ik] of [['.btn-ok','✅'],['.btn-close','🤏'],['.btn-miss','❌']])
    C(`gumb ${ik}`, (await p.$eval('#screen-kartica '+sel,e=>e.textContent)).includes(ik));

  console.log('\n4) Puna partija za dob 4–6 s emojijem na svakoj kartici');
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  await p.click('#screen-naslovna button.btn');
  await p.click('#dob-options .option-btn:nth-child(1)');
  await p.click('#screen-postavke button.btn-wide');
  await p.waitForSelector('#screen-predaja.active');
  let bezEmojija=0;
  for(let i=0;i<12;i++){
    await p.waitForSelector('#reveal-btn:not([disabled])',{timeout:5000}); await p.click('#reveal-btn');
    await p.waitForSelector('#screen-kartica.active');
    if((await p.$eval('#card-emoji',e=>e.textContent))==='❓') bezEmojija++;
    await p.click('#screen-kartica .btn-ok');
    for(const sel of ['#screen-pojasnjenje','#screen-teska','#screen-osjecaj']) if(await p.$(sel+'.active')) await p.click(sel+' button.btn');
    if(await p.$('#screen-tkojeovo.active')) await p.click('#tko-skip');
    if(await p.$('#screen-zeton.active')) await p.click('#screen-zeton button.btn-outline');
    await p.waitForFunction(()=>document.getElementById('screen-predaja').classList.contains('active')||document.getElementById('screen-rezultat').classList.contains('active'),{timeout:5000});
  }
  C('nijedna kartica u partiji nije bez emojija', bezEmojija===0, String(bezEmojija));

  console.log('\n5) Nabijeni trenuci nikad dva puta zaredom');
  const r5 = await p.evaluate(()=>{ state.dob='4-6'; state.mod='coop'; session.teskeTemeOn=false;
    let par=0; for(let i=0;i<400;i++){ CARD_DB.forEach(c=>c.everUsed=false);
      const s=buildSnop(12).map(e=>e.card); const n=c=>c.deck==='TRENUCI'&&!c.vedar;
      for(let k=1;k<s.length;k++) if(n(s[k])&&n(s[k-1])) par++; }
    return par; });
  C('u 400 snopova nijedan par nabijenih', r5===0, String(r5));

  console.log('\n6) Oznaka verzije');
  await p.goto('file:///home/user/Proba/docs/sto-ti-je.html');
  C('naslovna prikazuje verziju špila', /v2\.3/.test(await p.$eval('.verzija',e=>e.textContent)));

  console.log(`\n══ ${ok} prošlo, ${bad} palo, JS grešaka: ${err.length} ══`);
  err.slice(0,4).forEach(e=>console.log('  ! '+e));
  await b.close(); process.exit(bad||err.length?1:0);
})();
