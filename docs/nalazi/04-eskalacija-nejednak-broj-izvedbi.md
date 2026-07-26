# Eskalacija sa 6–8 igrača: netko izvodi dvostruko više od drugoga, a ljestvica rangira ukupne bodove

Deterministična činjenica koda, ne simulacija: 10 kartica po rundi, izvođač
se rotira po kartici (l.2112), a svaka runda POČINJE od igrača
`roundIndex % n` (l.2238) — čime se rotacija resetira umjesto da se nastavi.

## Broj izvedbi po igraču (3 runde × 10 kartica)

| igrača | izvedbe po igraču | raspon |
|--------|-------------------|--------|
| 2 | 15,15 | ✓ |
| 3 | 10,10,10 | ✓ |
| 4 | 7,8,8,7 | 7–8 |
| 5 | 6,6,6,6,6 | ✓ |
| 6 | 4,5,6,6,5,4 | **4–6 (+50%)** |
| 7 | 4,5,6,5,4,3,3 | **3–6 (+100%)** |
| 8 | 4,5,5,4,3,3,3,3 | **3–5 (+67%)** |

Bodovi se zbrajaju kroz sve tri runde i na kraju se proglašava pobjednik
(`🏆 sorted[0]`, l.2208). Dijete na poziciji 6 u partiji sa 7 igrača ima
upola manje prilika za bod od djeteta na poziciji 3 — i to sustavno, u
svakoj partiji jednako, jer ne ovisi o slučaju.

## Prijedlog (izmjena jedne linije)

U `nextRoundOrFinish` ne resetirati na `roundIndex % n`, nego NASTAVITI
rotaciju (performerIndex je nakon zadnje kartice runde već na sljedećem
igraču — dovoljno je ne dirati ga). Rasponi tada postaju najbolji mogući:
30 izvedbi dijeli se na ⌊30/n⌋–⌈30/n⌉: 6 igrača → 5,5,5,5,5,5 ✓; 7 → 4–5;
8 → 3–4. Trošak: kod n=2 runda 2 počinje istim timom kao runda 1 (10 je
parno) — komentar „druga strana kreće" izgubio bi smisao, ali broj izvedbi
ostaje 15:15, pa je to kozmetika.

Alternativa bez ikakvog kompromisa: broj kartica po rundi = višekratnik
broja igrača (npr. 2 po igraču) — ali mijenja trajanje partije i tekst
„10 istih kartica", pa je veći zahvat.
