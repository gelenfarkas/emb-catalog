# EastMallBuy statikus affiliate katalógus

Ez a projekt több EastMallBuy JSON exportot olvas be, kategóriáz, deduplikál, majd laikusbarát termékkatalógusként jelenít meg. Alapértelmezésben PHP és MySQL nélkül működik.

## Fájlszerkezet

```text
/index.html
/assets/css/style.css
/assets/js/app.js
/assets/js/data-loader.js
/assets/js/normalizer.js
/assets/js/render.js
/data/manifest.json
/data/cipo/shop-1.json
/data/zokni/shop-1.json
/manifest.php
```

## Melyik fájl mire való?

- `index.html`: a katalógus felülete, hero, CTA-k, szűrők, kártyák.
- `assets/css/style.css`: mobilbarát, világos, kártyás design.
- `assets/js/app.js`: állapotkezelés, szűrés, rendezés, események.
- `assets/js/data-loader.js`: manifestes és kézi JSON betöltés.
- `assets/js/normalizer.js`: termék-normalizálás, fallbackek, affiliate link generálás, deduplikáció.
- `assets/js/render.js`: termékkártyák, dataset lista, szűrő opciók kirajzolása.
- `data/manifest.json`: statikus fájllista kategóriákkal.
- `manifest.php`: opcionális fallback, ha a szerver automatikusan listázza a `/data` JSON fájljait.

## Új JSON hozzáadása

1. Másold az exportot egy kategóriamappába, például `data/cipo/ohero-2026-04-21.json`.
2. Bővítsd a `data/manifest.json` fájlt:

```json
{
  "datasets": [
    {
      "path": "data/cipo/ohero-2026-04-21.json",
      "category": "Cipő",
      "label": "Cipő / OHERO STUDIO"
    }
  ]
}
```

## Új kategória mappa

Hozz létre új mappát:

```text
/data/taska/shop-1.json
```

Majd a manifestben:

```json
{
  "path": "data/taska/shop-1.json",
  "category": "Táska",
  "label": "Táska / Shop 1"
}
```

## Statikus tárhelyre feltöltés

Töltsd fel az egész projektmappát a tárhelyre. Fontos, hogy HTTP-n keresztül fusson, mert a böngészők a `fetch("data/manifest.json")` hívást sokszor blokkolják sima `file://` megnyitásnál. XAMPP alatt például ez működik:

```text
http://localhost/embimport/
```

## Kézi import stratégia

Az oldalon két kézi mód van:

- több JSON fájl kiválasztása `input[type=file][multiple]` mezővel;
- komplett mappa importálása `webkitdirectory` támogatással.

Mappaimportnál a relatív útvonalból jön a kategória. Példa:

```js
inferCategoryFromPath("data/cipo/shop-1.json");
// "Cipő"
```

## Mikor kell PHP fallback?

A PHP csak akkor indokolt, ha nem szeretnéd kézzel karbantartani a `data/manifest.json` fájlt. A `manifest.php` végigolvassa a `data` almappáit, és ilyen JSON listát ad vissza:

```json
{
  "datasets": [
    {
      "path": "data/cipo/shop-1.json",
      "category": "Cipő",
      "label": "Cipő / shop-1"
    }
  ]
}
```

MySQL nem kell.

## Normalizált termék objektum példa

```json
{
  "itemId": "7740781099",
  "tp": "micro",
  "title": "Air Jordan 4 Retro AJ4 minta termék",
  "price": 55.53,
  "priceLabel": "$55.53",
  "approxHuf": "kb. 20 546 Ft",
  "image": "https://si.geilicdn.com/example.jpg",
  "url": "https://eastmallbuy.com/index/item/index.html?tp=micro&tid=7740781099",
  "affiliateUrl": "https://eastmallbuy.com/index/item/index.html?tp=micro&tid=7740781099&inviter=gelenfarkas",
  "sellerName": "OHERO STUDIO",
  "source": "goods_list_dom",
  "categories": ["Cipő"],
  "datasetIds": ["data-cipo-shop-1-json-abc123"],
  "datasetCount": 1
}
```

## Fontos függvény minták

Több fájl beolvasása:

```js
document.querySelector("#fileInput").addEventListener("change", async (event) => {
  const result = await loadFromFiles(event.target.files);
  console.log(result.loaded);
});
```

Mappaimport:

```html
<input type="file" webkitdirectory multiple accept=".json,application/json" />
```

Kategória kinyerése relatív útvonalból:

```js
inferCategoryFromPath("data/zokni/shop-1.json");
// "Zokni"
```

Deduplikáció:

```js
const { products, duplicateCount } = dedupeProducts(allProducts);
```

Affiliate URL újragenerálás:

```js
buildAffiliateUrl({
  url: "https://eastmallbuy.com/index/item/index.html?tp=micro&tid=7740781099",
  itemId: "7740781099",
  tp: "micro",
  inviter: "gelenfarkas"
});
```

## Hero és CTA szöveg

Hero:

> Átlátható katalógus azoknak, akik gyorsan szeretnének jó termékeket találni.

CTA-k:

- Termék megnyitása
- Affiliate link megnyitása
- EastMallBuy regisztráció
