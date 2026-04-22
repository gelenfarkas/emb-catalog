# EastMallBuy affiliate katalógus

Short summary: frontend-only, JSON based affiliate/reseller catalog for EastMallBuy product exports.

Ez az alkalmazás egy statikus, böngészőben futó termékkatalógus. EastMallBuy JSON exportokat olvas be, normalizálja a termékeket, kategóriákat és tageket rendel hozzájuk, majd kereshető, szűrhető publikus katalógusként jeleníti meg őket.

A projekt affiliate / reseller katalógus jellegű: minden termékkattintás affiliate linkre mutat. Backend és adatbázis nem szükséges, az adatforrás a `data/manifest.json` és az abban felsorolt JSON datasetek.

## Fő Funkciók

- JSON alapú terméklista betöltése.
- Manifest alapú dataset kezelés.
- Multi category rendszer: egy termék több kategóriába/tagbe tartozhat.
- Kulcsszó alapú kategorizálás HU, EN és CN kulcsszavak alapján.
- Kategória, ár, bolt és keresés alapú szűrés.
- Többnyelvű keresés normalizált szöveggel és kategória-kulcsszó bővítéssel.
- Affiliate link használat vagy generálás.
- OHERO STUDIO termékek alapértelmezett előresorolása.
- Dinamikus kategórialista a manifest és a termékek alapján.
- Lazy image loading a gyorsabb renderelésért.
- Admin/debug oldal a betöltés és hibák ellenőrzésére.
- Verziózott asset betöltés cache-busting célból.

## Projekt Struktúra

```text
/index.html              Publikus katalógus oldal
/admin.html              Setup, előnézet és debug oldal
/assets/js               Alkalmazáslogika
/assets/css              Stílusok
/assets/favicon.svg      Favicon
/data                    JSON adatfájlok
/data/manifest.json      Dataset lista
/manifest.php            Opcionális manifest fallback szerveren
```

Fontosabb JavaScript fájlok:

- `assets/js/public-app.js`: publikus oldal állapota, szűrés, rendezés, render ciklus.
- `assets/js/admin-app.js`: admin/debug előnézet.
- `assets/js/catalog-core.js`: katalógus betöltés, szűrés, rendezés, debug state.
- `assets/js/data-loader.js`: manifest és dataset fetch/parsing.
- `assets/js/normalizer.js`: termék-normalizálás, deduplikáció, affiliate URL generálás.
- `assets/js/category-mapping.js`: kategória térkép, kulcsszavak, `detectCategories`.
- `assets/js/render.js`: termékkártyák, kategórianav és aktív filter chipek.
- `assets/js/cache-utils.js`: verziózott asset URL-ek.

## Adatkezelés

Az app először a manifestet tölti be:

```text
data/manifest.json
```

Ha HTTP környezetben a statikus manifest nem érhető el, a rendszer megpróbálhatja a `manifest.php` fallbacket is. A manifest `datasets` tömbje mondja meg, mely JSON fájlokat kell beolvasni.

Példa manifest entry:

```json
{
  "datasets": [
    {
      "path": "data/cipo/ohero-export.json",
      "category": "Cipő",
      "label": "Cipő / OHERO STUDIO"
    }
  ]
}
```

Új dataset hozzáadása:

1. Másold a JSON exportot a `data` alá, például `data/cipo/ohero-export.json`.
2. Add hozzá a fájlt a `data/manifest.json` `datasets` tömbjéhez.
3. Nyisd meg az admin oldalt, és ellenőrizd, hogy betölt-e.

Minimális dataset struktúra:

```json
{
  "items": [
    {
      "title": "Outdoor running shoes",
      "price": 10,
      "url": "https://eastmallbuy.com/index/item/index.html?tp=micro&tid=123",
      "affiliateUrl": "https://eastmallbuy.com/index/item/index.html?tp=micro&tid=123&inviter=gelenfarkas",
      "sellerName": "OHERO STUDIO"
    }
  ]
}
```

Az app több mezőnév-változatot is elfogad az exportokból, de az `items` tömb a legfontosabb elvárás.

## Kategorizálás

A kategorizálás alapja az `assets/js/category-mapping.js` fájlban lévő `CATEGORY_MAP`.

Működés:

- A `detectCategories(title)` végigmegy az összes kategórián.
- Minden kategóriára score-t számol a kulcsszó egyezések alapján.
- Minden `score > 0` kategória bekerül a termék `categories` tömbjébe.
- A legmagasabb score lesz a primary kategória.

Normalizált termékmezők:

```js
product.category      // primary kategória label, kompatibilitás miatt
product.categoryId    // primary kategória id
product.categoryLabel // primary kategória label
product.categories    // összes felismert kategória/tag
```

Példa:

```js
detectCategories("Outdoor running shoes");
// ["cipo", "sport", "outdoor"]
```

## Keresés

A kereső a termék több mezőjéből épített `searchText` alapján dolgozik:

- cím
- TID / itemId
- seller / bolt
- forrás
- kategóriák és tagek
- dataset címkék

A szöveg normalizálása kisbetűsítést, ékezetkezelést és whitespace tisztítást használ. Ha a keresés egy ismert kategóriára vagy kategória-kulcsszóra illeszkedik, a rendszer a kategória további HU, EN és CN kulcsszavait is figyelembe veszi.

Ezért például egy kategória jellegű keresés nem csak a látható címkén, hanem a hozzá tartozó kulcsszavakon keresztül is találhat termékeket.

## Szűrés

A kategóriafilter multi-category módon működik:

```js
product.categories.includes(selectedCategory)
```

Ez azt jelenti, hogy ha egy termék egyszerre `Cipő`, `Sport` és `Outdoor`, akkor mindhárom szűrő alatt megjelenhet.

A kategória opciók dinamikusan épülnek:

- manifestben szereplő dataset kategóriákból;
- normalizált termékek `categories` tömbjéből.

## Rendezés

Az alapértelmezett rendezés az OHERO STUDIO termékeket előre teszi:

```js
sellerName.toLowerCase().includes("ohero")
```

Ez csak a default rendezésnél érvényes. Ha a felhasználó ár, cím, frissesség vagy kategória szerint rendez, az app azt használja.

## Affiliate Logika

A publikus katalógus minden terméklinknél affiliate URL-t használ.

Prioritás:

1. Ha a JSON export tartalmaz `affiliateUrl` mezőt, az kerül a kártyára.
2. Ha nincs `affiliateUrl`, az app generál linket a termék URL-je, `tid` / `itemId`, `tp` és az inviter alapján.

Ez azért fontos, hogy a katalógusból érkező kattintások követhetők legyenek, és ne sima terméklinkre menjenek.

## Futtatás Lokálisan

Az appot HTTP-n keresztül kell futtatni. A `file://` megnyitás nem megbízható, mert a böngészők blokkolhatják a `fetch()` alapú manifest és JSON betöltést.

Python:

```bash
python -m http.server
```

Ezután:

```text
http://localhost:8000/
```

XAMPP esetén:

```text
http://localhost/embimport/
```

## Deploy

A projekt statikus hostingra telepíthető:

- töltsd fel a teljes projektmappát;
- vagy használj Git clone alapú deployt;
- backend és adatbázis nem kell;
- a `data/manifest.json` és az összes benne hivatkozott JSON fájl legyen elérhető HTTP-n.

## Cache

Az assetek verziózott URL-lel töltődnek be az `appendVersion()` segédfüggvényen keresztül. A verzió az `assets/js/app-version.js` fájlban van.

Ez cache-bustingra szolgál: ha változik az app verziója, a böngésző új URL-t kap a JS/CSS fájlokra, így nem ragad bent egy régi asset.

## Hibakeresés

Gyors checklist:

- A projekt HTTP-n fut, nem `file://` alatt.
- A `data/manifest.json` elérhető böngészőből.
- A manifest valid JSON.
- A manifest `path` mezői létező JSON fájlokra mutatnak.
- A dataset JSON tartalmaz `items` tömböt.
- A böngésző konzolban nincs fetch vagy JSON parse hiba.
- Az admin oldal debug panelje szerint a manifest státusza `ok`.
- A kategória mappingben szerepel a várt kategória és kulcsszó.
- A termékhez tartozó `sellerName` helyesen érkezik, ha OHERO prioritást vársz.
- Az affiliate link tartalmazza az `inviter` paramétert, ha generált linkről van szó.

## Bővítés

Új kategória:

1. Add hozzá az új kategóriát a `CATEGORY_MAP` tömbhöz.
2. Adj meg `id`, `label` és `keywords` mezőket.
3. Tegyél be HU, EN és szükség esetén CN kulcsszavakat.

Új kulcsszó:

```js
{
  id: "outdoor",
  label: "Outdoor",
  keywords: {
    hu: ["outdoor", "túra", "bakancs"],
    en: ["outdoor", "hiking", "trail"],
    cn: []
  }
}
```

Új JSON dataset:

1. Másold a fájlt a `data` mappába.
2. Hivatkozd be a `data/manifest.json` fájlban.
3. Ellenőrizd az admin oldalon.

## Rövid Működési Folyamat

```text
manifest.json
  -> dataset JSON fájlok
  -> normalizálás
  -> kategória/tag felismerés
  -> deduplikáció
  -> szűrés/rendezés
  -> renderelt termékkártyák affiliate linkekkel
```
