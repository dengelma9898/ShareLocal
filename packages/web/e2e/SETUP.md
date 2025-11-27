# E2E Test Setup - WICHTIG

## ⚠️ Voraussetzungen für E2E Tests

**KRITISCH**: Bevor die E2E Tests ausgeführt werden können, müssen folgende Services laufen:

### ✅ Checkliste vor dem Start

- [ ] **Backend API** läuft auf `http://localhost:3001`
- [ ] **Database** ist verfügbar und erreichbar
- [ ] **Environment Variables** sind gesetzt (`.env` Datei im Root)
- [ ] **Port 3001** ist frei (keine anderen Prozesse blockieren den Port)

---

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: Environment Variables prüfen

Stelle sicher, dass die `.env` Datei im **Root-Verzeichnis** (`/Users/dengelma/develop/private/ShareLocal/.env`) existiert und folgende Variablen enthält:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sharelocal?schema=public"
JWT_SECRET="your-secret-key-min-32-chars"
ENCRYPTION_KEY="your-encryption-key-min-32-chars"
```

**Wichtig**: Die `.env` Datei muss im Root-Verzeichnis sein, nicht im `packages/api` Verzeichnis!

### Schritt 2: Database prüfen

Stelle sicher, dass die PostgreSQL Database läuft und erreichbar ist:

```bash
# Prüfe ob Database läuft (optional)
psql -U your_user -d sharelocal -c "SELECT 1;" 2>&1 | head -1
```

### Schritt 3: Alte API-Prozesse beenden (falls vorhanden)

```bash
# Beende alle laufenden API-Prozesse
pkill -f "tsx.*api" || true

# Prüfe ob Port 3001 frei ist
lsof -ti:3001 && echo "Port 3001 ist belegt!" || echo "Port 3001 ist frei"
```

### Schritt 4: Backend API starten

**Terminal 1** (API Server):

```bash
cd packages/api
pnpm dev
```

**Erwartete Ausgabe:**
```
🚀 ShareLocal API server running on http://localhost:3001
📚 API Documentation: http://localhost:3001/api
```

**Wichtig**: Lasse dieses Terminal offen! Die API muss während der gesamten Test-Ausführung laufen.

### Schritt 5: API Health Check

**In einem neuen Terminal** prüfe ob die API läuft:

```bash
curl http://localhost:3001/health
```

**Erwartete Antwort:**
```json
{"status":"ok","message":"ShareLocal API is running"}
```

Wenn du einen Fehler bekommst, prüfe:
- Ist die API wirklich gestartet?
- Sind alle Environment Variables gesetzt?
- Läuft die Database?
- Ist Port 3001 frei?

### Schritt 6: E2E Tests ausführen

**Terminal 2** (Tests):

```bash
cd packages/web
pnpm test:e2e
```

Die Web-App wird automatisch von Playwright gestartet (auf Port 3000).

---

## 🔧 Troubleshooting

### Problem: "ENCRYPTION_KEY environment variable is required"

**Lösung:**
1. Prüfe ob `.env` Datei im Root-Verzeichnis existiert
2. Prüfe ob `ENCRYPTION_KEY` in der `.env` Datei gesetzt ist
3. Stelle sicher, dass die API von `packages/api` gestartet wird (nicht vom Root)

### Problem: "connect ECONNREFUSED ::1:3001"

**Lösung:**
1. Prüfe ob die API läuft: `curl http://localhost:3001/health`
2. Falls nicht: Starte die API in Terminal 1
3. Prüfe ob Port 3001 belegt ist: `lsof -ti:3001`

### Problem: "EADDRINUSE: address already in use :::3001"

**Lösung:**
```bash
# Beende alle Prozesse auf Port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
# Dann starte die API erneut
```

### Problem: Tests schlagen fehl wegen Timeout

**Lösung:**
1. Prüfe ob beide Server laufen:
   - API: `curl http://localhost:3001/health`
   - Web: `curl http://localhost:3000` (wird von Playwright gestartet)
2. Prüfe Browser Console für Fehler (verwende `pnpm test:e2e:headed`)
3. Erhöhe Timeout in `playwright.config.ts` falls nötig

---

## 📋 Quick Start Script (Optional)

Du kannst auch ein einfaches Script erstellen:

```bash
#!/bin/bash
# start-api-for-tests.sh

echo "🔍 Prüfe Voraussetzungen..."

# Prüfe .env Datei
if [ ! -f .env ]; then
    echo "❌ .env Datei nicht gefunden im Root-Verzeichnis!"
    exit 1
fi

# Beende alte Prozesse
echo "🧹 Beende alte API-Prozesse..."
pkill -f "tsx.*api" 2>/dev/null || true
sleep 2

# Starte API
echo "🚀 Starte Backend API..."
cd packages/api
pnpm dev > /tmp/api.log 2>&1 &
API_PID=$!

# Warte auf API
echo "⏳ Warte auf API..."
sleep 8

# Health Check
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ API läuft erfolgreich (PID: $API_PID)"
    echo "📝 Logs: tail -f /tmp/api.log"
    echo "🧪 Führe jetzt in einem anderen Terminal aus: cd packages/web && pnpm test:e2e"
else
    echo "❌ API konnte nicht gestartet werden. Prüfe Logs: tail -f /tmp/api.log"
    kill $API_PID 2>/dev/null
    exit 1
fi
```

---

## ✅ Erfolgreiche Test-Ausführung

Wenn alles richtig konfiguriert ist, solltest du sehen:

```
Running 12 tests using 1 worker

✓ 8 passed
  3 skipped  
  1 failed (optional, je nach Test-Daten)

Test Files  3 passed (3)
     Tests  8 passed | 3 skipped | 1 failed (12)
```

---

## 💡 Tipps

1. **Zwei Terminal-Fenster**: Ein Terminal für die API, ein Terminal für die Tests
2. **API-Logs beobachten**: `tail -f /tmp/api.log` (falls API im Hintergrund läuft)
3. **Tests im Browser sehen**: `pnpm test:e2e:headed` - zeigt den Browser während der Tests
4. **Debug Mode**: `pnpm test:e2e:debug` - pausiert bei jedem Test für Inspektion
5. **Test Report**: Nach Tests: `pnpm test:e2e:report` - zeigt HTML Report mit Screenshots

---

## 📚 Weitere Informationen

- Siehe `e2e/README.md` für detaillierte Test-Dokumentation
- Siehe `packages/api/AGENTS.md` für API Setup-Anweisungen

### Schritt 2: Environment Variables prüfen

Stelle sicher, dass die `.env` Datei im Root-Verzeichnis existiert und folgende Variablen enthält:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sharelocal?schema=public"
JWT_SECRET="your-secret-key-min-32-chars"
ENCRYPTION_KEY="your-encryption-key-min-32-chars"
```

### Schritt 3: E2E Tests ausführen

```bash
# Terminal 2: E2E Tests ausführen
cd packages/web
pnpm test:e2e
```

Die Web-App wird automatisch von Playwright gestartet.

## Quick Check

Prüfe ob die API läuft:

```bash
curl http://localhost:3001/health
```

Sollte `{"status":"ok","message":"ShareLocal API is running"}` zurückgeben.

## Troubleshooting

### "ENCRYPTION_KEY environment variable is required"

- Prüfe `.env` Datei im Root-Verzeichnis
- Stelle sicher, dass alle Environment-Variablen gesetzt sind

### "connect ECONNREFUSED ::1:3001"

- Backend API läuft nicht
- Starte die API: `cd packages/api && pnpm dev`

### Tests schlagen fehl wegen Timeout

- Prüfe ob beide Server laufen (API auf 3001, Web auf 3000)
- Prüfe Browser Console für Fehler
- Verwende `pnpm test:e2e:headed` um zu sehen, was passiert

