# Prompt za Claude Fable 5 — igra "Što ti je?!"

Model: `claude-fable-5` · effort: `high` ili `xhigh` · očekuj da jedan zahtjev radi minutama.

---

Radim na igri emocionalne pismenosti za djecu 4–11 godina. Igraju je obitelji i
razredi; voditelj je roditelj ili učitelj koji nije psiholog. Svrha izlaza: dijete
koje ne zna imenovati što osjeća dobiva riječi za to — a da igra ostane igra,
ne terapija. Ako pogriješimo u procjeni što koje dijete može, igra to dijete
posrami umjesto da mu pomogne. S tim na umu:

Igra je gotova i radi: docs/sto-ti-je.html, jedna samostalna datoteka bez
vanjskih zahtjeva, 247 aktivnih kartica, tri moda, hrvatski. Prošla je 143
funkcionalna testa. Ono što nije provjereno je sadržaj, a ne kod.

Tri stvari koje želim da riješiš, redom po važnosti:

1. Svakoj od 247 kartica dodijeljena je razvojna faza (1 = vanjska ~3–5 g.,
   2 = mentalna ~5–7 g., 3 = reflektivna ~8–11 g.). Te sam dodjele radio sam,
   po prosudbi, na temelju Pons/Harris (2004). Nisu provjerene ni od koga.
   Faza upravlja dobnim filtrom, pa je svaka kriva dodjela kartica koju dijete
   ne može odigrati. Provjeri ih — protiv stvarne literature, ne protiv mog
   obrazloženja — i reci mi gdje sam pogriješio i zašto. Zanima me i je li
   tropodjela uopće prava granularnost za ovu namjenu.

2. Igra nikad nije simulirana. Ne znam raspodjelu rezultata ni u jednom modu.
   Posebno me brine Dvoboj: protivnik krade bod kad aktivni tim promaši, i
   nemam pojma vodi li to do bijega u vodstvu iz kojeg nema povratka — što bi
   za dijete koje gubi bilo gore nego da moda nema. Zanima me i drži li
   zadani ritam tempa partiju živom kroz 12 kartica.

3. Hrvatski. Pisao sam ga solidno ali ne izvorno-književno; već sam jednom
   promašio padež u ključnom ekranu. Treba mi prolaz kroz sve tekstove
   kartica i sučelja, s pitanjem odgovara li registar dobi kojoj je kartica
   namijenjena.

Slobodno nađi i ono što nisam naveo — pretpostavljam da postoje problemi
kojih nisam svjestan, i njih najviše želim čuti.

Radi kako ti odgovara i delegiraj podagentima gdje se isplati; ne moraš čekati
da jedan završi da bi pokrenuo sljedeći. Vodi bilješke u docs/nalazi/ — po
jedan nalaz po datoteci, sažetak u prvom retku, uz razlog zašto je važan.

Za svaku tvrdnju o kartici želim vidjeti na čemu se temelji. Ako nešto nisi
provjerio, reci to izrijekom umjesto da procijeniš. Radije mi daj nalaz koji
kasnije odbacim nego da prešutiš problem jer nisi siguran.

Izmjene u sto-ti-je.html predloži prije nego ih napraviš — igra je objavljena
i igra se. Datoteka mora ostati samostalna: nula vanjskih zahtjeva, radi offline.
