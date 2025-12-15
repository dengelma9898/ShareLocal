# React2Shell (CVE-2025-55182) - Sicherheitsanalyse

## Überblick

**CVE**: CVE-2025-55182  
**Name**: React2Shell  
**Schweregrad**: Hoch (CVSS 10.0)  
**Entdeckung**: 29. November 2025 (gemeldet von Lachlan Davidson)  
**Veröffentlichung**: 3. Dezember 2025  
**Referenz**: [React Blog - Critical Security Vulnerability](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)

## Betroffene Versionen

### React Server Components Pakete
Die Vulnerabilität betrifft folgende Pakete in den Versionen 19.0.0, 19.1.0, 19.1.1 und 19.2.0:
- ❌ `react-server-dom-webpack`
- ❌ `react-server-dom-parcel`
- ❌ `react-server-dom-turbopack`

### React
- ❌ 19.0.0
- ❌ 19.1.0
- ❌ 19.1.1
- ❌ 19.2.0

### Betroffene Frameworks & Bundler
- ❌ Next.js (15.x und 16.x mit App Router)
- ❌ React Router (mit RSC APIs)
- ❌ Waku
- ❌ @parcel/rsc
- ❌ @vitejs/plugin-rsc
- ❌ Redwood SDK (rwsdk)

## Gepatchte Versionen

### React Server Components Pakete
- ✅ 19.0.1
- ✅ 19.1.2
- ✅ 19.2.1 oder neuer

### React
- ✅ 19.0.1
- ✅ 19.1.2
- ✅ 19.2.1 oder neuer

### Next.js
- ✅ 14.2.35 (für Next.js 13.3.x, 13.4.x, 13.5.x, 14.x)
- ✅ 15.0.7 (für 15.0.x)
- ✅ 15.1.11 (für 15.1.x)
- ✅ 15.2.8 (für 15.2.x)
- ✅ 15.3.8 (für 15.3.x)
- ✅ 15.4.10 (für 15.4.x)
- ✅ 15.5.9 (für 15.5.x)
- ✅ 16.0.10 (für 16.0.x) - **Wir verwenden diese Version**

## Unsere Situation

### Vor dem Fix (vor 15. Dezember 2025)

**@sharelocal/web Package:**
- React: `19.2.0` ❌ **BETROFFEN**
- React-DOM: `19.2.0` ❌ **BETROFFEN**
- Next.js: `16.0.4` ❌ **BETROFFEN**

**Grund für Betroffenheit:**
- Wir verwenden Next.js 16.x mit App Router
- React Server Components (RSC) werden aktiv genutzt
- Die installierten Versionen waren innerhalb der betroffenen Bereiche

### Nach dem Fix (15. Dezember 2025)

**@sharelocal/web Package:**
- React: `19.2.3` ✅ **GEPATCHT**
- React-DOM: `19.2.3` ✅ **GEPATCHT**
- Next.js: `16.0.10` ✅ **GEPATCHT**

**Durchgeführte Maßnahmen:**
1. ✅ React und React-DOM auf 19.2.3 aktualisiert
2. ✅ Next.js auf 16.0.10 aktualisiert
3. ✅ eslint-config-next auf 16.0.10 aktualisiert (Peer Dependency)
4. ✅ lucide-react auf neueste Version aktualisiert (React 19 Kompatibilität)
5. ✅ Weitere Dependencies aktualisiert (@tanstack/react-query, react-hook-form, @hookform/resolvers)

## Warum betrifft uns das Problem?

1. **Next.js App Router**: Wir verwenden Next.js 16.x mit App Router, der React Server Components (RSC) nutzt
2. **React Server Components**: Die Vulnerabilität betrifft speziell RSC-Implementierungen
3. **Betroffene Versionen**: Unsere installierten Versionen (React 19.2.0, Next.js 16.0.4) waren innerhalb der betroffenen Bereiche

## Was wurde behoben?

Die React2Shell Vulnerabilität ermöglichte es Angreifern, Server-Side Code Execution durch manipulierte React Server Components zu erreichen. Die gepatchten Versionen enthalten Fixes für:

- ✅ Sichere Serialisierung von Server Components
- ✅ Verbesserte Validierung von RSC Payloads
- ✅ Schutz gegen Code Injection in Server Components

## Verifizierung

### Installierte Versionen prüfen

```bash
pnpm --filter @sharelocal/web list react react-dom next
```

**Erwartete Ausgabe:**
```
react 19.2.3
react-dom 19.2.3
next 16.0.10
```

### Build-Verifizierung

```bash
pnpm --filter @sharelocal/web build
```

Der Build muss erfolgreich sein und keine React2Shell-bezogenen Warnungen zeigen.

## Weitere Sicherheitsmaßnahmen

### Regelmäßige Dependency-Updates

Wir sollten regelmäßig nach Updates suchen:

```bash
# Web Package
pnpm --filter @sharelocal/web outdated

# API Package
pnpm --filter @sharelocal/api outdated
```

### Automatisierte Security Scans

Empfohlen: Integration von Dependabot oder ähnlichen Tools für automatische Security Updates.

## Referenzen

- [React Blog - Critical Security Vulnerability in React Server Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) (3. Dezember 2025)
- [CVE-2025-55182](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-55182)
- [React Security Advisory](https://github.com/facebook/react/security/advisories)
- [Next.js Security Updates](https://github.com/vercel/next.js/security/advisories)

## Timeline (offizielle React Timeline)

- **29. November 2025**: Lachlan Davidson meldete die Sicherheitslücke über Meta Bug Bounty
- **30. November 2025**: Meta Security Researchers bestätigten die Lücke und begannen mit dem React Team an einem Fix zu arbeiten
- **1. Dezember 2025**: Ein Fix wurde erstellt und das React Team arbeitete mit betroffenen Hosting-Providern und Open-Source-Projekten zusammen, um den Fix zu validieren, Mitigationen zu implementieren und den Fix auszurollen
- **3. Dezember 2025**: Der Fix wurde auf npm veröffentlicht und öffentlich als CVE-2025-55182 bekannt gegeben

## Changelog

- **2025-12-15**: React2Shell Fix implementiert (Vulnerabilität wurde am 3. Dezember 2025 veröffentlicht)
  - React: 19.2.0 → 19.2.3
  - React-DOM: 19.2.0 → 19.2.3
  - Next.js: 16.0.4 → 16.0.10
  - eslint-config-next: 16.0.4 → 16.0.10
  - lucide-react: 0.344.0 → 0.561.0
  - @tanstack/react-query: 5.90.11 → 5.90.12
  - react-hook-form: 7.66.1 → 7.68.0
  - @hookform/resolvers: 3.10.0 → 5.2.2

---

**Status**: ✅ Behoben  
**Letzte Aktualisierung**: 15. Dezember 2025

