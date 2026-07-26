# ŠTO TI JE?! — psihološka analiza igre

Analiza mehanike igre (ne pojedinih kartica — to pokriva `analiza-kartica.md`) iz perspektive
dječjeg razvoja i emocionalne kompetencije. Svaka točka ima: nalaz, znanstvenu podlogu, i
konkretnu izmjenu u kodu gdje je primjenjivo.

## Sažetak

| Prioritet | Problem | Cijena popravka |
|---|---|---|
| 1 | Uspjeh = točna riječ, ne prepoznat osjećaj | srednja (podaci + 1 provjera) |
| 2 | Nema mosta prema djetetovom iskustvu | niska (1 ekran) |
| 3 | Natjecateljska struktura protiv cilja suradnje | niska (1 mod) |
| 4 | Bonus pitanje pretpostavlja lice→emocija 1:1 | niska (1 string) |
| 5 | Dobni filter = apstraktnost, ne razvojna faza | visoka (retagiranje 292 kartice) |
| 6 | Teške situacije nemaju sigurnosni izlaz | niska (1 prekidač + 1 ekran) |

Dobro već postoji i ne treba dirati: tri kanala izvedbe (opiši/nacrtaj/odglumi), pojašnjenje
nakon promašaja, undo, statistika sesije.

---

## 1. Uspjeh se mjeri kao pogođena riječ, ne prepoznat osjećaj

`finalizeMove()` bilježi `ishod: 'pogođeno'` samo ako je izgovorena točno riječ s kartice.
Dijete koje točno prepozna emociju, ali kaže „radost" umjesto „veselje", zabilježeno je kao
promašaj. `analiza-kartica.md` je već identificirala 94 takva sinonimna sudara — to je
posljedica ovog pravila, ne slučajnost u sadržaju.

Razvojno je ovo obrnuto od poželjnog: emocionalne reprezentacije kod djece kreću od široke
podjele ugodno/neugodno prema sve specifičnijim pojmovima, a rast verbalnog znanja upravo
posreduje taj razvoj (Nook, Sasse, Lambert, McLaughlin i Somerville, 2017, *Nature Human
Behaviour*; Nook, Sasse, Lambert, McLaughlin i Somerville, 2018, *Psychological Science*).
„Skoro točna riječ" je normalan međukorak u tom razvoju i igra bi ga trebala nagrađivati,
ne kažnjavati kao potpuni promašaj.

**Izmjena koda:**

```js
// U mk(): dodati polje za prihvaćene sinonime
function mk(term, deck, tier, channels, note, synonyms) {
  return { term, deck, tier, channels, note: note || '', synonyms: synonyms || [],
           discarded: false, everUsed: false };
}

// Primjer upotrebe (rješava sudare iz analiza-kartica.md):
mk("sreća", "EMOCIJE", 1, ALL3, '', ["radost", "veselje"]),

// U handlePogodjeno() / novi gumb "DJELOMIČNO POGOĐENO":
// puni pogodak = tier koraka, djelomični (sinonim) = Math.ceil(tier / 2) koraka
```

Najjednostavnija verzija bez restrukturiranja podataka: dodati treći gumb pored
POGOĐENO / PRESKOČI — **BLIZU** — koji daje pola koraka i upisuje `ishod: 'blizu'` u log,
umjesto da se sinonimi moraju ručno mapirati po karticama.

---

## 2. Nema mosta prema djetetovom vlastitom iskustvu

Trenutni tok: izvuci karticu → izvedi → pogodi/promaši → sljedeći tim. Nigdje se pojam ne
veže uz djetetov život. Bez toga igra trenira dosjećanje riječi pod satom u natjecateljskom
okviru — a to nije ista vještina kao prepoznavanje vlastite emocije.

Self-reference efekt je jedan od najpouzdanijih nalaza u psihologiji pamćenja: gradivo
povezano sa sobom pamti se bitno bolje od istog gradiva obrađenog neutralno (Symons i
Johnson, 1997, meta-analiza, *Psychological Bulletin*).

**Izmjena koda:** nakon *pogotka* (ne samo promašaja), kratak neobavezni ekran prije povratka
na `renderPotez()`:

```js
function handlePogodjeno() {
  stopTimer();
  const seconds = elapsedSeconds();
  state.pendingResult = { seconds };
  if (state.currentDraw.deck === 'TJELESNE') {
    document.getElementById('bonus-term').textContent = state.currentDraw.card.term;
    goScreen('bonus');
  } else {
    document.getElementById('reflect-term').textContent = state.currentDraw.card.term;
    goScreen('reflect');   // "Kad si TI zadnji put osjetio/la ovo?" — tim odgovara usmeno, PRESKOČI ili DALJE
  }
}
```

Ovo je najjeftinija izmjena u cijeloj analizi s najvećim očekivanim učinkom — jedan novi
ekran, bez promjene podataka o karticama.

---

## 3. Natjecateljska struktura ide protiv deklariranog cilja igre

Igra uči prepoznavanje i suosjećanje s tuđim osjećajima, ali motor je utrka dva do četiri
tima stazom. Meta-analiza 148 studija na preko 17.000 mladih (Roseth, Johnson i Johnson,
2008, *Psychological Bulletin*) pokazuje da su i viša postignuća i bolji vršnjački odnosi
dosljedno povezani s kooperativnim, a ne natjecateljskim ili individualističkim strukturama
cilja. Igra o empatiji izgrađena isključivo na natjecanju ima ugrađenu proturječnost s onim
što pokušava naučiti.

**Izmjena koda:** treći mod uz postojeći postavljanje tima, koji zaobilazi `state.teams`
natjecanje:

```js
const GAME_MODES = [
  { key: 'natjecanje', label: 'Timovi se natječu' },      // postojeće ponašanje
  { key: 'suradnja',   label: 'Svi zajedno protiv staze' } // 1 zajednička pozicija, cilj = X polja u N poteza
];
// U finalizeMove(), ako je state.mode === 'suradnja': pomicati jedinstvenu 'position'
// umjesto team.position, i ne mijenjati activeTeamIndex po pobjedi/porazu — samo po redu poteza.
```

---

## 4. Bonus pitanje pretpostavlja da tjelesna reakcija = jedna emocija

`handleBonus()` traži da protivnici ili odrasla osoba presude je li imenovana emocija
„točna" za danu tjelesnu reakciju. To pretpostavlja pouzdano mapiranje izraz/reakcija →
emocija koje literatura ne podržava: Barrett, Adolphs, Marsella, Martinez i Pollak (2019,
*Psychological Science in the Public Interest*) sustavno preispituju upravo tu pretpostavku
i pokazuju da kontekst, ne sam izraz, nosi većinu značenja. Dodatni problem: suci su
protivnici usred utrke — sukob interesa je ugrađen u pravila.

**Izmjena koda — samo promjena teksta, bez strukturnih promjena:**

```js
// Trenutno:
// "Imenujte emociju koja može izazvati ovu reakciju. Sude protivnici ili odrasla osoba."

// Zamijeniti sa:
"Imenujte DVIJE različite emocije koje bi mogle izazvati ovu reakciju."
// Bonus se dodjeljuje čim tim navede dvije različite, umjerene emocije — bez suđenja "točno/netočno",
// jer cilj je pokazati da ista reakcija ima više mogućih uzroka, ne pogoditi jedan "ispravan".
```

---

## 5. Dobni filter kodira apstraktnost pojma, ne razvojnu fazu razumijevanja emocija

`AGE_FILTERS` veže ★/★★/★★★ uz „mlađu djecu / obitelj / sve", ali težina u `CARD_DB` je
zapravo skala apstraktnosti riječi, ne skala razvojne dostupnosti koncepta. Pons, Harris i
de Rosnay (2004, *European Journal of Developmental Psychology*), na uzorku od 100 djece u
dobi 3–11 godina, identificirali su tri razvojne faze razumijevanja emocija, svaka s tri
komponente:

- **vanjska faza (~3–5 g.)** — prepoznavanje izraza lica, zaključivanje emocije iz situacije,
  razlikovanje izraženog i doživljenog osjećaja
- **mentalna faza (~5–7 g.)** — utjecaj želje i uvjerenja na emociju, sjećanje kao okidač,
  mogućnost regulacije i skrivanja osjećaja
- **reflektivna faza (~8–11 g.)** — miješani/proturječni osjećaji, moralne emocije, uloga
  unutarnjih standarda

„Ambivalentnost" ili „zahvalnost pomiješana s tugom" nisu teže riječi — one pripadaju kasnijoj
razvojnoj fazi po definiciji (proturječni osjećaji su reflektivna faza). Obrnuto, „glumljenje
da je sve u redu" trenutno sjedi na ★★ iako je to udžbenički primjer mentalne faze (5–7 g.) —
razumijevanje da izraz i doživljaj mogu biti različiti.

**Izmjena koda:** ovo je najskuplji popravak jer zahtijeva retagiranje kartica, ne samo
promjenu logike:

```js
// Zamijeniti brojčani tier fazom razumijevanja
function mk(term, deck, phase, channels, note, synonyms) { ... }
// phase: 1 = vanjska (3-5g), 2 = mentalna (5-7g), 3 = reflektivna (8-11g)

const AGE_FILTERS = [
  { key: '4-6', label: '4–6 godina', tiers: [1] },
  { key: '6-8', label: '6–8 godina', tiers: [1, 2] },
  { key: '9+',  label: '9+ godina',  tiers: [1, 2, 3] },
];
```

Praktični prvi korak bez pune retag-kampanje: barem premjestiti očite slučajeve poput
„glumljenje da je sve u redu" (★★ → faza 2 zadržava se, dobro pozicionirano) i „ambivalentnost"
/ „zahvalnost pomiješana s tugom" (potvrditi da ostaju u fazi 3, gdje već jesu) — glavni posao
je provjeriti svih 292 kartice protiv tri komponente po fazi, ne samo protiv duljine/apstraktnosti
riječi kako je `analiza-kartica.md` trenutno radila.

---

## 6. Teške situacijske kartice nemaju sigurnosni izlaz

Špil SITUACIJE uključuje kartice poput „Roditelji se svađaju, a ti to čuješ iz sobe." i
„Svi su pozvani na rođendan osim tebe." U kontekstu igre s klepsidrom i protivnicima, djetetu
koje ovo trenutno stvarno proživljava ovo nije igra nego okidač. Izloženost sukobu roditelja
je dobro dokumentiran prediktor internalizirajućih teškoća kod djece (teorija emocionalne
sigurnosti, Cummings i Davies); eksperimentalno inducirano socijalno isključivanje pouzdano
izaziva mjerljivu bol odbačenosti čak i kad je dijete svjesno da je simulirano (Williams, 2007,
paradigma Cyberball).

**Izmjena koda:**

```js
// 1. Postavke: prekidač koji roditelj svjesno uključuje prije igre
let hardTopicsEnabled = false; // default OFF

// 2. Filtrirati SITUACIJE špil pri izvlačenju kartice
function drawFromDeck(deck, tier, channel) {
  let allMatching = cardsFor(deck, tier).filter(c => !channel || c.channels.includes(channel));
  if (deck === 'SITUACIJE' && !hardTopicsEnabled) {
    allMatching = allMatching.filter(c => !c.sensitive); // dodati c.sensitive = true na mk() teških kartica
  }
  // ... ostatak nepromijenjen
}

// 3. Pravo na preskakanje bez kazne (bez brojanja kao promašaj u statistici)
function handleSkipNoPenalty() {
  // ne zove finalizeMove(false, ...) — jednostavno se karta vraća u špil i tim izvlači novu
}

// 4. Nakon teške kartice, obavezna rečenica prije DALJE:
// "Mnogoj djeci se ovo dogodi. Što bi ti pomoglo u toj situaciji?"
```

Emocionalno podučavanje uz teške situacije (imenovanje + normaliziranje + traženje rješenja)
ima potporu u dugoročnim ishodima djece čiji roditelji tako pristupaju emocijama (Gottman,
Katz i Hooven, 1996, *Journal of Family Psychology*).

---

## Napomena o „imenovanje smiruje osjećaj"

Vrijedi izbjeći uobičajenu, ali precijenjenu tvrdnju da samo imenovanje emocije automatski
smanjuje njen intenzitet. Novija replikacija nije potvrdila taj učinak (Nook, Satpute i
Ochsner, 2021, *Affective Science*, citirano u više recentnih radova), a jedna studija je
čak našla da imenovanje može ometati kasniju reinterpretaciju. Čvršće tlo za opravdanje igre:
emocionalno znanje kod djece dosljedno predviđa socijalnu kompetenciju i akademsko postignuće
(Izard i sur., 2001, *Psychological Science*) — ne kroz trenutnu regulaciju, nego kroz
dugoročnu izgrađenost rječnika i koncepata.

---

## Prijedlozi djeteta (8 g.) koji su prošli psihološku provjeru

| Prijedlog | Ocjena | Obrazloženje |
|---|---|---|
| Mod bez bodova, samo glumljenje | ✅ prihvatiti prvo | Upravo ovo (dramska igra bez pritiska pogotka) daje efekt u Goldstein i Lerner (2018) |
| Suigrač ništa ne radi dok čeka | ✅ prihvatiti | Protivnički tim tiho zapisuje pretpostavku prije isteka vremena — svi kognitivno aktivni (efekt generiranja, Slamecka i Graf, 1978) |
| Protivnici sude nepošteno | ✅ rješava se točkom 1 (lista prihvaćenih odgovora) | Nije pitanje popuštanja nego procedure |
| Vlastite kartice | ✅ prihvatiti | Autonomija + efekt generiranja; jeftino: `prompt()` + `localStorage` |
| „Sjeta — što je to?" | ✅ rješava se točkom 1 | Dijete je pogodilo emociju, izgubilo bod zbog netočne riječi — dizajnerska greška |
| Album skupljenih pojmova | ⚠️ uvjetno | Dobro kao prikaz ovladanosti ("znaš 42 pojma"), loše kao valuta bodova — vanjske nagrade smanjuju unutarnju motivaciju (Deci, Koestner i Ryan, 1999, meta-analiza) |
| Catch-up mehanika kad netko vodi | ⚠️ dizajnersko, ne psihološko pitanje | Opažanje točno, rješenje nije u domeni ovog dokumenta |
| Slike lica na kartice | ❌ odbiti | Ponovno uvodi pretpostavku lice→emocija 1:1 koju točka 4 već osporava; ako ilustracije, onda situacije s kontekstom |
