# @sharelocal/web

Next.js Frontend für ShareLocal - Next.js 16 + React 19 + TypeScript

## 🚀 Quick Start

### Voraussetzungen

- Node.js 24.x LTS
- Backend API läuft auf `http://localhost:3001`

### Installation

```bash
# Vom Root-Verzeichnis
pnpm install

# Oder direkt im Package
cd packages/web
pnpm install
```

### Entwicklung

```bash
# Vom Root-Verzeichnis
pnpm web:dev

# Oder direkt im Package
cd packages/web
pnpm dev
```

Die Anwendung läuft standardmäßig auf `http://localhost:3000`

## 📁 Projekt-Struktur

```
app/
├── layout.tsx        # Root Layout
├── page.tsx          # Home Page
└── globals.css       # Global Styles
components/           # React Components (später)
lib/                  # Utilities (später)
hooks/                # Custom Hooks (später)
```

## 🛠️ Technologie-Stack

- **Framework**: Next.js 16.x (App Router)
- **React**: 19.x
- **TypeScript**: 5.6+
- **Styling**: Tailwind CSS (später)
- **UI Components**: shadcn/ui (später)
- **Forms**: React Hook Form + Zod (später)
- **State**: Zustand oder React Query (später)
- **Maps**: Leaflet (OpenStreetMap) (später)
- **i18n**: next-intl (später)

## 📝 Scripts

- `pnpm dev` - Startet Next.js Development-Server
- `pnpm build` - Erstellt Production-Build
- `pnpm start` - Startet Production-Server
- `pnpm lint` - Führt ESLint aus
- `pnpm test` - Führt Tests aus (Vitest)

## 🔧 Konfiguration

### Environment Variables

Erstelle `.env.local` im Root-Verzeichnis:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Next.js Config

Siehe `next.config.js` für Konfiguration.

## 📦 Dependencies

### Runtime

- `next` - Next.js Framework
- `react` - React Library
- `react-dom` - React DOM Renderer

### Development

- `typescript` - TypeScript Compiler
- `eslint` - Linting
- `eslint-config-next` - Next.js ESLint Config
- `vitest` - Test Framework

## 🎨 Code Style

- TypeScript strict mode
- React 19 mit Server Components
- Functional Components bevorzugt
- Server Components sind Standard, Client Components nur wenn nötig (`'use client'`)

## ⚠️ Wichtige Regeln

- **Build muss erfolgreich sein**: `pnpm build` vor dem Abschließen
- **Dev-Start muss erfolgreich sein**: `pnpm dev` muss ohne Fehler starten
- Server Components sind Standard
- API Calls sollten Server Actions oder Route Handlers verwenden
- Bilder mit Next.js Image Component optimieren

## 📚 Weitere Dokumentation

- [AGENTS.md](AGENTS.md) - Detaillierte Anweisungen für AI Coding Agents

---

**Status:** 🚧 In Entwicklung
