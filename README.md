# SPY → Shopify Pre-Order Importværktøj

En webapp der henter styles direkte fra SPY Systems via API og genererer en Shopify-importfil — uden manuelle eksportfiler.

## Arkitektur

```
Browser (React)
    ↕
Netlify Functions (Node.js)   ← sikker serverside-kommunikation
    ↕
SPY API  (api.spysystem.dk)
```

Credentials sendes **aldrig** direkte fra browseren til SPY. Al API-kommunikation sker via Netlify Functions.

---

## Forudsætninger

1. **SPY API-adgang** — kontakt SPY Support og bed dem aktivere API-adgang for jeres konto (Denasia ApS). Spørg efter:
   - Bekræftelse på at API-adgang er aktiv
   - Den korrekte base URL (typisk `https://api.spysystem.dk`)

2. **Node.js 18+** installeret lokalt

3. **Netlify CLI** (til lokal udvikling):
   ```bash
   npm install -g netlify-cli
   ```

4. En **GitHub-konto** og et **Netlify-konto** (begge gratis)

---

## Lokal opsætning

```bash
# 1. Klon eller pak projektet ud
cd spy-shopify

# 2. Installér afhængigheder
npm install

# 3. Opret miljøvariabel-fil
cp .env.example .env
# Rediger .env og sæt SPY_BASE_URL

# 4. Start lokalt med Netlify Dev (kører både React og Functions)
netlify dev
```

Åbn http://localhost:8888

---

## Miljøvariabler

Opret en `.env` fil i roden (kopiér fra `.env.example`):

```
SPY_BASE_URL=https://api.spysystem.dk
```

På Netlify sættes dette under **Site Settings → Environment Variables**.

---

## Deploy til Netlify

### Første gang

```bash
# Log ind på Netlify
netlify login

# Opret nyt site og deploy
netlify init
netlify deploy --prod
```

### Efterfølgende deploys

Forbind GitHub-repo til Netlify (anbefales) — så deployes automatisk ved hvert push til `main`.

Eller manuelt:
```bash
netlify deploy --prod
```

---

## Projektstruktur

```
spy-shopify/
├── netlify/
│   └── functions/
│       ├── spy-login.js              ← SPY autentificering (serverside)
│       ├── spy-styles.js             ← Henter styles + priser fra SPY API
│       └── generate-shopify-import.js ← Genererer CSV-importfil
├── src/
│   ├── main.jsx                      ← React entry point
│   ├── App.jsx                       ← Hele UI-logikken (login/søg/gennemse/eksport)
│   └── api.js                        ← API-klient med token-caching
├── index.html
├── vite.config.js
├── netlify.toml                      ← Netlify build-konfiguration
└── package.json
```

---

## Sådan virker token-håndteringen

SPY anbefaler at cache authentication-tokens i stedet for at logge ind ved hvert kald:

- Token hentes ved login og gemmes i browserens hukommelse (ikke localStorage)
- Token sættes til at udløbe efter **13 minutter** (SPY's anbefaling)
- Hvis token er ved at udløbe, vises en advarsel og brugeren bedes logge ind igen
- Login-endpointet har rate limit på **1 request per 6 sekunder** — appen håndterer dette automatisk

---

## Shopify-importfilen

Den genererede CSV-fil er klar til direkte upload i Shopify Admin:

- **Produkter → Importér → Upload CSV**
- Alle varianter importeres med `lager = 0` og tagget `preorder`
- Timesact aktiverer automatisk pre-order knappen via `preorder`-tagget
- Produkter uden pris oprettes som `draft` og publiceres manuelt

---

## Kendte begrænsninger

| Begrænsning | Løsning |
|-------------|---------|
| Shopify: max 100 varianter per produkt | Styles med for mange farver markeres i appen og skal oprettes manuelt |
| Netlify Functions: 10 sek timeout (gratis plan) | Tilstrækkeligt til 10-30 styles ad gangen |
| Billeder via API | Undersøg med SPY Support om billedURLs er tilgængelige via API — ellers bruges Netlify-upload som i den nuværende løsning |

---

## Kontakt SPY Support

- Website: https://spysystem.dk
- API-dokumentation: https://api-docs.spysystem.dk
