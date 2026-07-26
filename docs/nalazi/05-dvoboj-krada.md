# Krađa u Dvoboju udvostručuje razliku nejednakih timova, a preokrete ne dodaje; „poravnata krađa" to popravlja jednom linijom

Monte Carlo, 40–60 tisuća partija po scenariju, pravila vjerno iz koda
(BODOVI l.1381; krađa +1 samo na potpuni promašaj, l.2077–2083; rotacija
l.2112; runde l.2230). Vjerojatnosti pogađanja pretpostavljene (nisu mjerene);
zaključci dolje stabilni na ±30% perturbacije svih parametara.

## Dobra vijest prva — strah iz prompta se ne potvrđuje

Runda pantomime gotovo nikad nije matematički mrtva: uz jednake timove 0%,
uz umjerenu razliku (0.80/0.60) ≤1%, čak i uz ekstremnu (0.85/0.50) ≤6%
partija ima pobjednika poznatog prije prve kartice runde 3. Napetost
strukturno drži to što svaka kartica nosi max 1 bod, a rundi su tri.

## Loša vijest — krađa je mehanika „bogati se bogate"

| scenarij | prosj. razlika s krađom | bez krađe | preokret s | bez |
|----------|-------------------------|-----------|------------|-----|
| jednaki (0.75/0.75) | 3.4 | 2.2 | 27% | 26% |
| stariji vs mlađi (0.80/0.60) | **5.2** | 3.1 | 16.7% | 15.9% |
| velika razlika (0.85/0.50) | **8.0** | 4.7 | 6.5% | 6.6% |

Strukturni razlog (vrijedi neovisno o parametrima): očekivani plijen tima A
po protivničkoj kartici je (1−p_B)·q_A — slabiji tim češće promašuje (više
prilika jačem) I jači točnije pretpostavlja (više realizacije). Oba faktora
guraju isti smjer. Za dijete u slabijem timu to znači: ne samo da nisu
pogodili — gledaju kako protivnik uzima bod na NJIHOVOJ kartici.

## Prijedlog: poravnata krađa (ukradeni bod vrijedi pola kad kradljivac vodi)

`resolveKrada`: `protivnik().score += (protivnik().score > aktivni.score) ? 0.5 : 1;`

| scenarij | razlika: puna → poravnata | preokret: puna → poravnata |
|----------|---------------------------|-----------------------------|
| jednaki | 3.4 → 2.6 | 27.1% → 31.0% |
| stariji vs mlađi | 5.2 → **3.7** | 16.7% → **20.0%** |
| velika razlika | 8.0 → 5.9 | 6.5% → 8.0% |

Poticaj za tiho slušanje ostaje netaknut (krađa uvijek nešto donosi), pravilo
je izrecivo sedmogodišnjaku („ako već vodiš, ukradeno vrijedi pola"), a
pobjednička stopa jačeg tima pada tek za ~3 postotna boda — ne prestaje se
isplatiti biti bolji. Testirana i varijanta „krađa uvijek 0.5": lošija je
(guši preokrete jednako kao puna, a slabi poticaj).

## Kalibracija iz stvarnih partija

CSV log već bilježi mod, rundu, tim i ishod po kartici — nakon desetak
stvarnih partija Dvoboja parametri simulacije mogu se zamijeniti izmjerenima
prije nego se pravilo mijenja.
