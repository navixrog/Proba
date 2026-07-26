# Ograničenja izvedbe ne filtriraju se po dobi — metafore idu i četverogodišnjacima

`pickOgranicenje` (sto-ti-je.html l.1719) filtrira samo po kanalu. Partija s
dobi „4–6" tako dijeli i: „Opiši ovaj pojam kao vremensku prognozu.", „…kao
životinju.", „…kao boju i zvuk.", „…kao da javljaš vijest na televiziji."

## Zašto je to problem

Sva četiri OPIŠI-ograničenja traže proizvodnju međudomenske metafore
(emocija → vrijeme/životinja/boja). Razumijevanje psihološke metafore
konsolidira se ~8+, a proizvodnja još kasnije (Winner; Vosniadou) [ZNANJE].
Peto („bez riječi ‚osjećaj', ‚kad' i ‚kao'") je negativno pravilo koje tereti
inhibiciju i radno pamćenje — slabo prije ~7 [ZNANJE]. Dijete od 5 g. dobiva
zadatak na kojem će zapeti pred publikom — točno ono što igra inače pažljivo
izbjegava (usp. komentar u kodu uz teške kartice, l.1706–1710).

Nasuprot tome, ODGLUMI-ograničenja („kao da imaš 90 godina", „u usporenom
snimku", „kao da si u knjižnici") su pretvaranje/igra uloga — dostupno od
~4 [ZNANJE] — i NACRTAJ su u redu.

## Prijedlog (jedna linija + jedna oznaka)

Svakom ograničenju dodati `minDob: '9+'` za šest O-ograničenja (4 metafore +
negativno pravilo + „vijest na televiziji"), `'4-6'` ostalima, i u
`pickOgranicenje` filtrirati po `state.dob`. Za dob 4–6 i 6–8 dodati 2–3
konkretna O-ograničenja bez metafore: „Opiši ga šapćući.", „Opiši ga kao da
si jaaako spor.", „Opiši ga bez ruku iza leđa." — način izvedbe, ne
preslikavanje domena.

Napomena: „Opiši ga kroz nešto što se dogodilo danas." je konkretno i smije
svima — a za teške kartice već je isključeno (l.1711).
