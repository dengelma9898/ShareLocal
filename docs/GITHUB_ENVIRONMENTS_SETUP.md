# GitHub Environments Setup - ShareLocal

## Übersicht

GitHub Environments ermöglichen es, Deployment-Bestätigungen zu konfigurieren. Production benötigt eine Bestätigung, Development deployt automatisch.

---

## Schritt 1: Environments erstellen

1. Gehe zu deinem Repository: `https://github.com/<owner>/ShareLocal`
2. Klicke auf **Settings** → **Environments** (links im Menü)
3. Klicke auf **New environment**

---

## Schritt 2: Development Environment

### 2.1 Erstelle "dev" Environment

- **Name**: `dev`
- **Deployment branches**: `main` (nur main Branch kann deployen)
- **Protection rules**: **NICHT aktivieren** (automatisches Deployment)

**Konfiguration:**
```
Environment name: dev
Deployment branches: Only main branch
Protection rules: (keine)
```

**Ergebnis:** 
- ✅ Automatisches Deployment ohne Bestätigung
- ✅ Deployed bei Push zu `main`

---

## Schritt 3: Production Environment

### 3.1 Erstelle "prd" Environment

- **Name**: `prd`
- **Deployment branches**: `main` (nur main Branch kann deployen)
- **Protection rules**: **Required reviewers** aktivieren

**Konfiguration:**
```
Environment name: prd
Deployment branches: Only main Branch
Protection rules:
  ✅ Required reviewers
    - Füge dich selbst (oder Team) als Reviewer hinzu
```

**Ergebnis:**
- ⏸️ Deployment wartet auf Bestätigung
- ✅ Reviewer muss Deployment bestätigen
- ✅ Deployed nur nach Bestätigung

---

## Schritt 4: Protection Rules für Production

### 4.1 Required Reviewers konfigurieren

1. In der `prd` Environment-Konfiguration
2. Unter **Protection rules** → **Required reviewers**
3. Klicke auf **Add reviewer**
4. Wähle dich selbst (oder ein Team) aus

**Beispiel:**
- Reviewer: `@dengelma9898` (dein GitHub Username)
- Anzahl Reviews: `1`

---

## Schritt 5: Workflow-Verhalten

### 5.1 Push zu `main` Branch

**Was passiert:**

1. ✅ **CI Pipeline läuft** (Lint, Build, Test)
2. ✅ **Build & Push Dev** → Deployed automatisch (keine Bestätigung)
3. ⏸️ **Build & Push Prd** → Wartet auf Bestätigung
4. ✅ **Nach Bestätigung** → Production deployed

### 5.2 Push zu anderen Branches (z.B. `develop`, Feature Branches)

**Was passiert:**

1. ✅ **CI Pipeline läuft** (Lint, Build, Test)
2. ❌ **Kein Deployment** (nur Tests/Builds)

---

## Schritt 6: Deployment bestätigen

### 6.1 Production Deployment bestätigen

Wenn ein Push zu `main` gemacht wird:

1. Gehe zu: **Actions** Tab
2. Klicke auf den laufenden Workflow
3. Du siehst: **"Review deployments"** Button
4. Klicke auf **Review deployments**
5. Wähle **"Approve and deploy"** für `prd` Environment
6. Production wird deployed

**Alternative:**
- GitHub sendet eine E-Mail/Notification wenn ein Deployment wartet
- Du kannst direkt von der Notification aus bestätigen

---

## Workflow-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│ Push zu main Branch                                     │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ CI Pipeline (Lint, Build, Test)                        │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Build & Push Dev │   │ Build & Push Prd │
│ (automatisch)    │   │ (wartet auf      │
│                  │   │  Bestätigung)    │
└──────────────────┘   └──────────────────┘
        │                       │
        ▼                       │
┌──────────────────┐           │
│ Deploy Dev       │           │
│ ✅ Automatisch   │           │
└──────────────────┘           │
                                │
                                ▼
                    ┌──────────────────────┐
                    │ Reviewer bestätigt   │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ Deploy Prd           │
                    │ ✅ Nach Bestätigung  │
                    └──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Push zu anderen Branches (develop, feature/*)          │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ CI Pipeline (Lint, Build, Test)                        │
│ ❌ Kein Deployment                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Problem: "Environment not found"

**Lösung:**
- Prüfe ob Environments erstellt wurden: Settings → Environments
- Prüfe ob Environment-Namen exakt übereinstimmen (`dev`, `prd`)

### Problem: "Deployment blocked - waiting for approval"

**Lösung:**
- Das ist korrekt für Production!
- Gehe zu Actions → Review deployments → Approve

### Problem: "No reviewers configured"

**Lösung:**
- Gehe zu Settings → Environments → `prd`
- Füge Required reviewers hinzu
- Oder entferne Protection rules (nicht empfohlen für Production)

---

## Best Practices

### 1. Production Protection

✅ **Immer aktivieren** für Production Environment
- Verhindert versehentliche Deployments
- Ermöglicht Code-Review vor Deployment

### 2. Development Fast Forward

✅ **Keine Protection** für Development Environment
- Schnelle Iteration
- Automatisches Deployment

### 3. Reviewer

✅ **Mindestens 1 Reviewer** für Production
- Du selbst oder ein Team
- Kann auch mehrere Reviewer sein (z.B. 2 von 3)

---

## Nächste Schritte

1. ✅ Environments erstellt (`dev`, `prd`)
2. ✅ Protection Rules konfiguriert (nur für `prd`)
3. ✅ Reviewer hinzugefügt
4. ⏳ Push zu `main` machen
5. ⏳ Production Deployment bestätigen

