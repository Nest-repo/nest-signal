# Grafici e infografiche — come si sceglie e si scrive

Template Nest Signal. Generatore: `KIT/creative/bin/post_creative.py`. Icone: `KIT/creative/bin/icons.py`. Esempi pronti in `KIT/creative/examples/`.

## Regola n.1: VISUALE, NON TESTUALE

Il testo è già nel post: l'immagine deve *mostrare* il contenuto.

- L'infografica **mostra** il contenuto con icone, forme, frecce, quantità. Non lo racconta a parole.
- **Etichette di 1-2 parole** (max 3). Niente descrizioni, niente frasi nell'infografica.
- Ogni voce ha un'**icona** (line-art di `icons.py` o logo del tool: notion, slack, gmail, n8n, claude).
- Contare le parole dell'infografica (didascalia esclusa): **massimo ~15**.
- Test: copri il titolo. Dall'infografica da sola si capisce di cosa parla il post? Se no, va ridisegnata, non spiegata.

## La cornice (fissa, non si tocca)

1. **Kicker** mono maiuscolo: `TEMA / ANGOLO`.
2. **Titolo** su due righe: nera = la situazione, arancio = la svolta. È l'hook del post, accorciato.
3. **Infografica** (l'unica parte che cambia).
4. **Chiusura** su due righe — **opzionale**. Mettila solo se aggiunge una presa di posizione che l'immagine non dice. Senza chiusura l'infografica scende e prende quello spazio. Default: **senza**.
5. **Footer**: foto, nome e ruolo dell'autore (da CONFIG), «SALVA PER DOPO».

Palette: i colori del brand in CONFIG `brand` (sfondo, inchiostro, accento — l'accento solo per il punto del post) + grigio `#5c5c5c`. Niente foto, niente emoji.

## Quale infografica

| Il post dice… | Tipo | Cosa si vede |
|---|---|---|
| prima era il caos, ora c'è un sistema | `prima_dopo` | una persona sommersa da fili aggrovigliati → gli stessi pezzi in fila che arrivano al risultato arancio |
| più cose entrano, un sistema le lavora, esce un risultato | `flusso` | icone a sinistra che confluiscono in un cerchio (il sistema/tool) → risultato arancio |
| un metodo, una sequenza, "prima X poi Y" | `passi` | cerchi con icona collegati da frecce, l'ultimo (o quello chiave) arancio |
| dove vanno ore/soldi/lead, un confronto di quantità | `barre` | barre spesse con icona, la più importante arancio, valore grande |
| un numero che regge il post ("77 su 240") | `numero` | numero gigante + griglia di pallini (77 arancio su 240) o barre di confronto |
| un sistema che lavora nel tempo su più canali | `timeline` | il template originale: righe con traccia nel tempo e pillola verticale |

Nel dubbio: il tipo che fa vedere **la cosa che il lettore non sa ancora**. Non usare lo stesso tipo per 3 post consecutivi in calendario se un altro calza.

## Campi per tipo

- `prima_dopo`: `didascalia`, `prima` {`titolo`, `centro` (icona, default persona), `voci[]` {`icona`, `etichetta`} 3-6}, `dopo` {`titolo`, `voci[]` {`icona`, `etichetta`} 2-4, `risultato` {`icona`, `etichetta`}}
- `flusso`: `didascalia`, `ingressi[]` {`icona`, `etichetta`} 2-4, `sistema` {`icona`, `etichetta`}, `risultato` {`icona`, `etichetta`}
- `passi`: `didascalia`, `passi[]` {`icona`, `titolo`, `evidenza`} 3-5
- `barre`: `didascalia`, `unita` (es. "h", "%", "€"), `righe[]` {`icona`, `etichetta`, `valore`, `evidenza`} max 5
- `numero`: `didascalia`, `numero`, `unita`, e `punti` {`totale`, `evidenza`, `legenda`} oppure `confronto[]` {`icona`, `etichetta`, `valore`, `evidenza`}
- `timeline`: `didascalia`, `pillola`, `righe[]` {`titolo`, `icona`, `testo` (evitalo), `eventi[]` {`x` 0-1, `tipo` grande|piccolo|bersaglio, `etichetta`, `sopra`} oppure `serie` {`n`, `etichetta`}}

Icone line-art disponibili: persona, team, telefono, orologio, sveglia, calendario, mail, chat, documento, lista, check, allerta, domanda, euro, grafico, crescita, calo, ingranaggio, lampadina, database, imbuto, bersaglio, blocco, robot, fulmine, lucchetto, occhio, cartella, freccia, ciclo, stella, mano, casa, valigia. Loghi: notion, slack, gmail, n8n, claude. Se serve un'icona che manca, aggiungila in `icons.py` (24×24, tratto 2, angoli tondi).

## Regole di contenuto

- Numeri **solo dal post**. Nomi di clienti mai; tool sì.
- L'arancio va dove sta il punto del post: max 1-2 elementi arancio nell'infografica.
- Il titolo dell'immagine e l'hook del post dicono la stessa cosa: chi vede l'immagine nel feed deve riconoscere il post.

## Tipi nuovi

Il giro creatività del lunedì può aggiungere un tipo nuovo se le creatività che rendono di più su LinkedIn ne mostrano uno che qui manca (es. matrice 2×2, ciclo, imbuto, mappa). Regole: nuova funzione `g_<nome>` in `post_creative.py` dentro l'area infografica (y 300-880), **visuale** (icone e forme, etichette di 1-2 parole), stessa palette e font; un esempio in `examples/`; rigenerare **tutti** gli esempi e guardarli prima del commit; aggiungere il tipo alla tabella sopra. La cornice non si cambia mai.
