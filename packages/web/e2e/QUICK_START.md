# 🚀 Quick Start Guide für E2E Tests

## Zwei Modi verfügbar

### Option 1: Mock Mode (Schnell, keine API nötig) ⚡

```bash
cd packages/web
pnpm test:e2e:mocked
```

**Vorteile:**
- ✅ Keine Backend API nötig
- ✅ Schneller
- ✅ Funktioniert offline

### Option 2: Real Mode (Vollständige Integration) 🔌

**Terminal 1: Backend API starten**
```bash
cd packages/api
pnpm dev
```

**Warte bis du siehst:**
```
🚀 ShareLocal API server running on http://localhost:3001
```

**Terminal 2: E2E Tests ausführen**
```bash
cd packages/web
pnpm test:e2e:real
```

**Vorteile:**
- ✅ Testet echte API-Integration
- ✅ Vollständige End-to-End Tests

**Fertig!** ✅

---

## ⚠️ Häufige Probleme

### API startet nicht?

1. Prüfe `.env` Datei im Root-Verzeichnis
2. Prüfe ob Database läuft
3. Prüfe ob Port 3001 frei ist: `lsof -ti:3001`

### Tests schlagen fehl?

1. Prüfe ob API läuft: `curl http://localhost:3001/health`
2. Sollte zurückgeben: `{"status":"ok","message":"ShareLocal API is running"}`

### Mehr Details?

Siehe `e2e/SETUP.md` für vollständige Anleitung.

