# Playwright Mock Route Fix - Zusammenfassung

## Problem-Übersicht

Die Playwright E2E-Tests mit Mock-Daten schlugen fehl mit `ERR_CONNECTION_REFUSED` Fehlern. Die Mock-Routes funktionierten nicht korrekt, obwohl sie registriert waren.

## Iterative Fehlerbehebung

### Iteration 1: TypeError - `url.includes is not a function`

**Fehler:**
```
TypeError: url.includes is not a function
at mocks/api-mocks.ts:297
```

**Ursache:**
- Playwright's `page.route()` mit Function-Matcher kann `url` als String oder `URL`-Objekt übergeben
- Code versuchte `.includes()` auf einem `URL`-Objekt aufzurufen

**Lösung:**
- Type-Check hinzugefügt: `if (typeof url === 'string')` vor `.includes()` Aufrufen
- Beide Typen werden jetzt korrekt behandelt

**Commit:** `cd711be` - "fix: Improve Playwright route matching for API mocks"

---

### Iteration 2: ERR_CONNECTION_REFUSED - Route Matching Problem

**Fehler:**
```
[MOCK] 🔵 Route matcher matched POST create: http://localhost:3001/api/listings
[MOCK] ❌ Request failed: GET http://localhost:3001/api/listings - net::ERR_CONNECTION_REFUSED
```

**Ursache:**
- Mehrere Route-Handler für `/api/listings` mit überlappendem Matching
- POST-Create-Route-Matcher matchte auch GET-Requests
- Handler rief `route.continue()` auf, was versuchte, die echte API zu erreichen (die nicht läuft)

**Lösung:**
- Konsolidierung zu einem einzigen Route-Handler für `/api/listings`
- Handler prüft HTTP-Methode (`GET`, `POST`) und URL-Pfad intern
- Alle Requests werden mit `route.fulfill()` beantwortet (kein `route.continue()` mehr)

**Code-Änderung:**
```typescript
// Vorher: Separate Routes für GET list, GET detail, POST create
// Problem: Überlappende Matcher, route.continue() für nicht-matchenden Requests

// Nachher: Ein Route-Handler mit Method-Check
await page.route('**/api/listings**', async (route: Route) => {
  const method = route.request().method();
  const urlPath = /* parse pathname */;
  
  if (method === 'GET' && urlPath === '/api/listings') {
    // Handle GET list
  } else if (method === 'GET' && detailMatch) {
    // Handle GET detail
  } else if (method === 'POST' && urlPath === '/api/listings') {
    // Handle POST create
  }
  // Alle Requests werden mit route.fulfill() beantwortet
});
```

**Commit:** `1bcc438` - "fix: Consolidate Playwright route handlers and fix test assertions"

---

### Iteration 3: Mock-Daten Format - UUID vs. einfache IDs

**Fehler:**
```
Expected pattern: /\/listings\/[a-f0-9-]+/
Received string: "http://localhost:3000/listings/mock-listing-1"
```

**Ursache:**
- Mock-IDs waren `mock-listing-1` statt UUID-Format
- Test erwartete UUID-Pattern (`/\/listings\/[a-f0-9-]+/`)
- Regex matchte nicht, weil `mock-listing-1` kein UUID-Format hat

**Lösung:**
- Mock-IDs auf UUID-Format geändert: `123e4567-e89b-12d3-a456-426614174001`
- Test-Assertion angepasst, um nach tatsächlich gerendertem Text zu suchen

**Code-Änderung:**
```typescript
// Vorher:
id: 'mock-listing-1'

// Nachher:
id: '123e4567-e89b-12d3-a456-426614174001'
```

---

### Iteration 4: Test-Assertion - Falsches HTML-Element

**Fehler:**
```
Error: element(s) not found
Locator: locator('h1, h2').first()
```

**Ursache:**
- Test suchte nach `h1` oder `h2` Elementen
- Detail-Seite verwendet `CardTitle` Component (rendert als `<div>`, nicht `<h1>`)

**Lösung:**
- Assertion geändert, um nach tatsächlich gerendertem Text zu suchen
- Verwendet `page.locator('text=Mock Listing Detail')` statt Heading-Elemente

**Code-Änderung:**
```typescript
// Vorher:
await expect(page.locator('h1, h2').first()).toBeVisible();

// Nachher:
await expect(page.locator('text=Mock Listing Detail')).toBeVisible();
```

---

## Finale Lösung

### Konsolidierter Route-Handler

Ein einziger Route-Handler für `/api/listings` behandelt alle Varianten:

1. **GET /api/listings** → Liste aller Listings
2. **GET /api/listings/{id}** → Einzelnes Listing-Detail
3. **POST /api/listings** → Neues Listing erstellen
4. **GET /api/listings/my** → User's eigene Listings (leere Liste)

### Wichtige Prinzipien

1. **Kein `route.continue()`**: Alle Requests werden mit `route.fulfill()` beantwortet
2. **Method-Check im Handler**: HTTP-Methode wird im Handler geprüft, nicht im Matcher
3. **UUID-Format**: Mock-IDs verwenden UUID-Format für konsistente Tests
4. **Text-basierte Assertions**: Tests suchen nach gerendertem Text statt HTML-Struktur

## Testergebnisse

✅ **7 Tests bestanden** (alle Mock-Tests)
- Authentication (Mocked): 3 Tests
- Listings (Mocked): 4 Tests

## Lessons Learned

1. **Playwright Route-Matching**: Function-Matcher erhalten `URL`-Objekte, nicht nur Strings
2. **Route-Priorität**: Erste Route, die matched, wird verwendet - keine Überlappung!
3. **`route.continue()` vs `route.fulfill()`**: In Mock-Mode immer `fulfill()` verwenden
4. **Test-Assertions**: Suche nach tatsächlich gerendertem Content, nicht nach HTML-Struktur

## Verwandte Dateien

- `packages/web/e2e/mocks/api-mocks.ts` - Mock-Route-Implementierung
- `packages/web/e2e/fixtures.ts` - Test-Fixtures mit Mock-Setup
- `packages/web/e2e/listings.mocked.spec.ts` - Mock-Tests für Listings
- `packages/web/e2e/auth.mocked.spec.ts` - Mock-Tests für Authentication

## Nächste Schritte

- ✅ Mock-Routes funktionieren korrekt
- ✅ Tests laufen ohne Backend-API
- ✅ CI-Pipeline sollte jetzt erfolgreich sein
- 🔄 Optional: Weitere Endpoints mocken, wenn nötig

