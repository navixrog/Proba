# Ispod dobi 9+ ne postoji nijedna „duboka" kartica — dizajnirani ritam tamo ne postoji

Tempo „duboko" dodijeljen je isključivo pojmovima faze 3 (TEMPO_DUBOKO lista
sadrži samo faza-3 termine). Posljedica po dobnom filtru:

| dob | kartica u bazenu | brzo | normalno | duboko |
|-----|------------------|------|----------|--------|
| 4–6 | 66 | 41 | 25 | **0** |
| 6–8 | 165 | 48 | 117 | **0** |
| 9+ | 237 | 48 | 135 | 54 |

RITAM traži duboku karticu na pozicijama 4, 8 i 12; fallback (l.1602) tada
uzima bilo koju. Komentar u kodu kaže „ritam je razlika između zabavne i
naporne partije" — ali za dvije od tri dobne skupine taj mehanizam ne radi
ništa. Nije rušeći bug (mlađe partije su prirodno brže), no dizajnerska
namjera „nakon smijeha jedan dubok razgovor" ispod 9+ jednostavno izostaje.

## Prijedlog

Označiti „duboko" ~10 kartica faze 2 koje to sadržajno jesu — kandidati:
suosjećanje, čežnja, odbačenost, pripadnost, mirenje nakon svađe,
primjećivanje da je netko tužan, pitanje „kako si?" — i čekanje odgovora,
brisanje suza nekome, pisanje poruke podrške, „Netko plače, a ti ne znaš što
reći.". Za dob 4–6 nema dobrih kandidata — tamo prihvatiti da ritma nema i
to je u redu (pažnja četverogodišnjaka ionako ne nosi „duboke" razgovore u
igri).
