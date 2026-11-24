# Setup — Piano Editoriale in Notion

Obiettivo: un database Notion dove il sistema scrive le bozze e il cliente approva.

- Se `CONFIG.notion.editorial_db` contiene un link/ID: apri il database e **aggiungi solo le colonne che mancano** (non rinominare né cancellare nulla).
- Altrimenti: crealo in una pagina privata del cliente, titolo «Piano Editoriale — Nest Signal».

Colonne: `Name` (titolo) · `Status` (stato: Idea, Bozza, In revisione, Da pubblicare, Pubblicato, Scartato) · `Data pubblicazione` (data) · `Funnel` (select: Reach, Connection, Authority, Conversion, Referral) · `Formato` (select: Post Singolo, Carousel, Video, Articolo) · `CTA` (select: Domanda nei commenti, Porta aperta (scrivimi), Prenota una call, Follow, Salva) · `Pattern hook` (testo) · `Layout creatività` (select: timeline, barre, prima_dopo, passi, flusso, numero) · `Creatività` (file) · `Link Post Live` (url) · `Impressioni`, `Interazioni`, `Commenti`, `Repost`, `Follower acquisiti`, `Visite profilo` (numero) · `Metriche al` (data).

Se `CONFIG.notion.crm_db` c'è: aggiungi una relation a due vie `Lead collegati` (Piano Editoriale) ↔ `Post di provenienza` (CRM) e salva `notion.crm_post_relation` = "Post di provenienza".

Infine aggiorna CONFIG (solo i campi `notion.editorial_db` con l'URL `collection://…` del database e, se creata, `notion.crm_post_relation`), mantenendo il resto del file identico. Aggiungi al diario `{"tipo":"report","titolo":"Piano Editoriale pronto","link":"<url>"}`.
