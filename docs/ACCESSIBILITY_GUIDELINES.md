# ShareLocal Accessibility Guidelines

## Übersicht

Diese Guidelines definieren die Accessibility-Standards für die ShareLocal-Plattform. Wir streben **WCAG 2.1 AA Compliance** an.

**Standard**: WCAG 2.1 Level AA  
**Ziel**: Accessibility-Score >90 (Lighthouse)  
**Status**: ✅ MVP-Implementierung abgeschlossen

---

## WCAG 2.1 AA Anforderungen

### 1. Perceivable (Wahrnehmbar)

#### 1.1 Text-Alternativen
- ✅ Alle Bilder haben `alt` Attribute
- ✅ Dekorative Bilder haben leere `alt=""`
- ✅ Icons haben `aria-label` oder Text

#### 1.2 Time-based Media
- ✅ Keine automatisch abspielenden Videos/Audio
- ✅ Captions für Video-Inhalte (falls vorhanden)

#### 1.3 Adaptable
- ✅ Semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ✅ Überschriften-Hierarchie (`h1` → `h2` → `h3`)
- ✅ Landmarks für Screen-Reader

#### 1.4 Distinguishable
- ✅ **Kontrast-Ratio**: ≥ 4.5:1 für normalen Text, ≥ 3:1 für großen Text
- ✅ Farben nicht als einzige Information
- ✅ Text-Resize bis 200% ohne Verlust

---

### 2. Operable (Bedienbar)

#### 2.1 Keyboard Accessible
- ✅ Alle Funktionen per Tastatur erreichbar
- ✅ Keine Keyboard-Traps
- ✅ Tab-Order logisch

#### 2.2 Enough Time
- ✅ Keine Timeouts ohne Warnung
- ✅ Pause/Stop für bewegte Inhalte

#### 2.3 Seizures and Physical Reactions
- ✅ Keine blinkenden Inhalte (>3x/Sekunde)

#### 2.4 Navigable
- ✅ Skip-Links zu Haupt-Inhalt
- ✅ Überschriften für Navigation
- ✅ Fokus-Reihenfolge logisch

#### 2.5 Input Modalities
- ✅ Touch-Targets ≥ 44x44px auf Mobile
- ✅ Gesten nicht erforderlich

---

### 3. Understandable (Verständlich)

#### 3.1 Readable
- ✅ Sprache definiert (`lang="de"`)
- ✅ Ungewöhnliche Wörter erklärt

#### 3.2 Predictable
- ✅ Konsistente Navigation
- ✅ Konsistente Komponenten
- ✅ Keine unerwarteten Änderungen

#### 3.3 Input Assistance
- ✅ Fehler identifiziert und beschrieben
- ✅ Labels für alle Inputs
- ✅ Fehler-Vorschläge

---

### 4. Robust (Robust)

#### 4.1 Compatible
- ✅ Valides HTML
- ✅ ARIA-Labels korrekt verwendet
- ✅ Screen-Reader kompatibel

---

## Implementierung

### Semantic HTML

```tsx
// ✅ RICHTIG
<header>
  <nav aria-label="Hauptnavigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main id="main-content">
  <h1>Haupttitel</h1>
  <section>
    <h2>Section-Titel</h2>
  </section>
</main>
<footer>...</footer>

// ❌ FALSCH
<div className="header">
  <div className="nav">...</div>
</div>
```

---

### ARIA-Labels

```tsx
// Icon-Buttons
<Button aria-label="Menü öffnen">
  <MenuIcon />
</Button>

// Komplexe Komponenten
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog-Titel</h2>
</div>

// Loading-States
<div aria-busy="true" aria-live="polite">
  Wird geladen...
</div>
```

---

### Keyboard-Navigation

#### Focus-States

```tsx
// Sichtbarer Focus-Ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

#### Tab-Order

- Logische Reihenfolge: Links → Form → Buttons
- Skip-Links am Anfang
- Focus-Trap in Modals

#### Keyboard-Handler

```tsx
// Escape-Key für Modals
onKeyDown={(e) => {
  if (e.key === 'Escape') {
    onClose();
  }
}}

// Enter/Space für Buttons
// (bereits von Browser gehandhabt)
```

---

### Form-Accessibility

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel htmlFor="email-input">E-Mail</FormLabel>
      <FormControl>
        <Input
          id="email-input"
          {...field}
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : "email-help"}
        />
      </FormControl>
      {errors.email && (
        <FormMessage id="email-error" role="alert">
          {errors.email.message}
        </FormMessage>
      )}
      <FormDescription id="email-help">
        Deine E-Mail-Adresse
      </FormDescription>
    </FormItem>
  )}
/>
```

**Features**:
- ✅ Label mit `htmlFor`
- ✅ `aria-invalid` bei Fehlern
- ✅ `aria-describedby` für Hilfe/Fehler
- ✅ Error-Message mit `role="alert"`

---

### Touch-Targets

```tsx
// Mobile: 44x44px, Desktop: Standard
<Button className="min-h-[44px] min-w-[44px] md:h-10 md:w-10 md:min-h-0 md:min-w-0">
  <Icon />
</Button>

// Inputs
<Input className="h-11 min-h-[44px] md:h-10 md:min-h-0" />
```

---

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

### Skip-Links

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
>
  Zum Hauptinhalt springen
</a>
```

---

## Testing

### Automatisierte Tests

#### axe-core (Playwright)

```bash
pnpm --filter @sharelocal/web test:e2e:accessibility
```

**Testet**:
- WCAG 2.1 AA Compliance
- Keyboard-Navigation
- ARIA-Labels
- Semantic HTML

#### Lighthouse CI

```bash
lhci autorun
```

**Validiert**:
- Accessibility-Score ≥ 0.9 (90%)
- Performance-Score
- Best Practices

---

### Manuelle Tests

#### Keyboard-Navigation

1. **Tab** durch alle interaktiven Elemente navigieren
2. **Enter/Space** für Buttons testen
3. **Escape** für Modals testen
4. **Arrow-Keys** für Dropdowns testen

#### Screen-Reader

**Tools**:
- **NVDA** (Windows, kostenlos)
- **JAWS** (Windows, kommerziell)
- **VoiceOver** (macOS/iOS, integriert)

**Test-Checkliste**:
- ✅ Alle Inhalte werden vorgelesen
- ✅ Navigation ist verständlich
- ✅ Formulare sind nutzbar
- ✅ Fehler-Meldungen werden angekündigt

#### Kontrast-Prüfung

**Tools**:
- **Lighthouse** (Chrome DevTools)
- **axe DevTools** (Browser Extension)
- **WAVE** (Browser Extension)

**Prüfen**:
- ✅ Text auf Backgrounds
- ✅ Buttons und Links
- ✅ Error-Messages
- ✅ Tooltips und Popovers

---

## Checkliste

### Vor jedem Commit

- [ ] Alle Buttons haben Text oder `aria-label`
- [ ] Alle Form-Felder haben `<label>` mit `htmlFor`
- [ ] Error-Messages haben `role="alert"` und `aria-describedby`
- [ ] Keyboard-Navigation funktioniert (Tab, Enter, Space)
- [ ] Focus-Indikatoren sind sichtbar
- [ ] Color Contrast erfüllt WCAG AA
- [ ] Touch-Targets ≥ 44px auf Mobile
- [ ] Reduced Motion respektiert

---

## Häufige Fehler

### ❌ FALSCH

```tsx
// Kein Label
<Input placeholder="E-Mail" />

// Kein aria-label für Icon-Button
<Button><Icon /></Button>

// Hardcoded Farben
<div style={{ color: '#6B8E5A' }}>Text</div>

// Kein Focus-State
<button>Button</button>
```

### ✅ RICHTIG

```tsx
// Mit Label
<Label htmlFor="email">E-Mail</Label>
<Input id="email" />

// Mit aria-label
<Button aria-label="Menü öffnen"><Icon /></Button>

// CSS-Variablen
<div className="text-primary">Text</div>

// Mit Focus-State
<button className="focus-visible:ring-2 focus-visible:ring-ring">Button</button>
```

---

## Ressourcen

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [axe-core Dokumentation](https://github.com/dequelabs/axe-core)
- [Lighthouse Accessibility](https://developers.google.com/web/tools/lighthouse)

---

## Referenzen

- [Design System](./DESIGN_SYSTEM.md)
- [Komponenten-Dokumentation](./COMPONENTS.md)
- [Style Guide](./STYLE_GUIDE.md)
- [Accessibility Tests](../packages/web/e2e/ACCESSIBILITY_TESTS.md)
