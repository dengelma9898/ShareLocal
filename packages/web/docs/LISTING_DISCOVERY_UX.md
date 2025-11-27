# Listing Discovery UX - Design & User Experience

## 🎯 Ziel der Listing Discovery Page

Die Listing Discovery Page ist das **Herzstück** der ShareLocal Plattform. Hier finden Nutzer Ressourcen, die sie suchen oder anbieten möchten.

**Hauptziele:**
- ✅ Schnelle Übersicht über verfügbare Angebote
- ✅ Einfache Filterung nach Kategorien, Typ, Location
- ✅ Effiziente Suche
- ✅ Klare Darstellung der wichtigsten Informationen
- ✅ Einfache Navigation zu Details

---

## 🎨 UX Prinzipien

### 1. **Scanbarkeit (Scannability)**
- **Card-basiertes Layout**: Nutzer scannen visuell, nicht linear lesen
- **Konsistente Struktur**: Alle Cards haben die gleiche Informationshierarchie
- **Visuelle Hierarchie**: Wichtige Infos (Titel, Kategorie) sind prominent

### 2. **Progressive Disclosure**
- **Übersicht zuerst**: Cards zeigen nur essentielle Infos
- **Details on Demand**: Klick auf Card führt zu Detail Page
- **Filter Sidebar**: Kann eingeklappt werden (Mobile: Sheet)

### 3. **Feedback & States**
- **Loading States**: Skeleton Screens während API Calls
- **Empty States**: Freundliche Nachricht wenn keine Listings gefunden
- **Error States**: Klare Fehlermeldungen mit Retry-Option

### 4. **Mobile-First**
- **Responsive Grid**: 1 Spalte Mobile, 2-3 Spalten Desktop
- **Touch-friendly**: Große Touch Targets (min. 44x44px)
- **Swipe-ready**: Filter können geswiped werden

---

## 📐 Layout Struktur

```
┌─────────────────────────────────────────────────┐
│ Header (sticky)                                 │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│ Filter       │  Listing Grid                     │
│ Sidebar      │  ┌─────┐ ┌─────┐ ┌─────┐        │
│              │  │Card │ │Card │ │Card │        │
│ [Kategorien] │  └─────┘ └─────┘ └─────┘        │
│ [Typ]        │  ┌─────┐ ┌─────┐ ┌─────┐        │
│ [Suche]      │  │Card │ │Card │ │Card │        │
│              │  └─────┘ └─────┘ └─────┘        │
│              │                                   │
│              │  [Pagination]                    │
└──────────────┴──────────────────────────────────┘
```

### Desktop (≥768px):
- **Filter Sidebar**: Links, feste Breite (~280px)
- **Listing Grid**: 3 Spalten, responsive
- **Sticky Sidebar**: Scrollt mit Content

### Mobile (<768px):
- **Filter Button**: Öffnet Sheet mit Filtern
- **Listing Grid**: 1 Spalte
- **Bottom Sheet**: Filter können von unten geswiped werden

---

## 🎴 Listing Card Design

### Informationshierarchie (Top → Bottom):

1. **Bild** (Hero)
   - Placeholder wenn kein Bild
   - Aspect Ratio: 16:9
   - Badge Overlay: Kategorie (oben rechts)

2. **Titel** (H3)
   - Font Size: lg, bold
   - Max 2 Zeilen, Truncate mit "..."

3. **Kategorie Badge**
   - Farbcodiert nach Kategorie
   - Icon + Text

4. **Owner Info**
   - Avatar (klein) + Name
   - Location (wenn verfügbar)

5. **Preis** (wenn verfügbar)
   - Typ: "Kostenlos" oder "€X/Tag"

6. **CTA Button**
   - "Details ansehen" oder "Kontakt aufnehmen"

### Card States:
- **Default**: Normal
- **Hover**: Leichte Erhöhung (Shadow), Cursor Pointer
- **Loading**: Skeleton Placeholder
- **Empty**: Placeholder Card mit "Keine Listings"

---

## 🔍 Filter & Search UX

### Filter Sidebar:

**1. Suche (Search Input)**
- Placeholder: "Nach Angeboten suchen..."
- Debounced Search (300ms)
- Highlight Search Terms in Results

**2. Kategorien (Checkbox Group)**
- TOOL (Werkzeuge)
- PLANT (Pflanzen)
- SKILL (Fähigkeiten)
- PRODUCT (Produkte)
- TIME (Zeit)
- OTHER (Sonstiges)
- Multi-Select möglich

**3. Typ (Radio Group)**
- OFFER (Angebot)
- REQUEST (Gesuch)
- Beide (Default)

**4. Location Filter** (später)
- Radius-basiert
- PostGIS Integration

**5. Clear Filters Button**
- Setzt alle Filter zurück

### Filter Behavior:
- **URL-basiert**: Filter werden in URL gespeichert (für Bookmarking)
- **Instant Apply**: Filter werden sofort angewendet
- **Loading State**: Während Filter angewendet werden
- **Result Count**: Zeigt Anzahl gefundener Listings

---

## 📱 Mobile UX Optimierungen

### Filter Sheet:
- **Bottom Sheet**: Öffnet von unten
- **Sticky Actions**: "Filter anwenden" Button bleibt sichtbar
- **Swipe to Close**: Kann nach unten geswiped werden

### Listing Cards Mobile:
- **Full Width**: Nutzt gesamte Breite
- **Larger Touch Targets**: Buttons min. 44x44px
- **Swipe Actions**: (später) Swipe für Favoriten

### Search Mobile:
- **Sticky Search Bar**: Bleibt oben beim Scrollen
- **Quick Filters**: Chips für häufige Filter

---

## ⚡ Performance Optimierungen

### 1. **Lazy Loading**
- **Image Lazy Loading**: Next.js Image Component
- **Infinite Scroll**: Lädt mehr Listings beim Scrollen
- **Code Splitting**: Route-based Splitting

### 2. **Caching**
- **React Query**: Caching für API Responses
- **Stale-while-revalidate**: Zeigt alte Daten während Refresh
- **Background Refetching**: Aktualisiert im Hintergrund

### 3. **Optimistic Updates**
- **Filter Changes**: Sofortige UI Updates
- **Loading States**: Zeigt Skeleton während API Call

---

## 🎭 Loading & Empty States

### Loading State:
```
┌─────────────────┐
│ [Skeleton Card] │
│ [Skeleton Card] │
│ [Skeleton Card] │
└─────────────────┘
```
- **Skeleton Cards**: 6-9 Cards während Loading
- **Shimmer Effect**: Animiertes Loading

### Empty State:
```
┌─────────────────┐
│   [Illustration]│
│                 │
│ Keine Listings  │
│ gefunden        │
│                 │
│ [Filter zurücksetzen]│
└─────────────────┘
```
- **Freundliche Nachricht**: "Keine Angebote gefunden"
- **CTA**: "Filter zurücksetzen" oder "Erstes Angebot erstellen"

### Error State:
```
┌─────────────────┐
│   [Error Icon]  │
│                 │
│ Fehler beim     │
│ Laden           │
│                 │
│ [Erneut versuchen]│
└─────────────────┘
```
- **Klare Fehlermeldung**
- **Retry Button**: Lädt Daten erneut

---

## 🔄 User Flow

### Standard Flow:
1. **Nutzer öffnet `/listings`**
   - Zeigt alle verfügbaren Listings
   - Filter Sidebar ist sichtbar (Desktop)

2. **Nutzer sucht nach "Bohrmaschine"**
   - Tippt in Search Input
   - Debounced Search startet nach 300ms
   - Loading State während API Call
   - Results werden angezeigt

3. **Nutzer filtert nach Kategorie "TOOL"**
   - Klickt Checkbox
   - Filter wird sofort angewendet
   - Results werden gefiltert

4. **Nutzer klickt auf Listing Card**
   - Navigiert zu `/listings/[id]`
   - Detail Page wird geladen

### Mobile Flow:
1. **Nutzer öffnet `/listings`**
   - Zeigt Listing Grid
   - Filter Button oben rechts

2. **Nutzer klickt Filter Button**
   - Bottom Sheet öffnet sich
   - Filter sind verfügbar

3. **Nutzer wählt Filter**
   - Klickt "Anwenden"
   - Sheet schließt sich
   - Results werden gefiltert

---

## 🎨 Design Tokens

### Colors:
- **Primary**: Für CTAs, Badges
- **Secondary**: Für sekundäre Actions
- **Muted**: Für weniger wichtige Infos

### Spacing:
- **Card Gap**: 1.5rem (24px)
- **Card Padding**: 1rem (16px)
- **Section Margin**: 2rem (32px)

### Typography:
- **Card Title**: text-lg, font-bold
- **Card Description**: text-sm, text-muted-foreground
- **Badge**: text-xs, font-semibold

---

## 📊 Success Metrics

### UX Metrics:
- **Time to First Listing**: < 1s
- **Filter Usage**: > 60% der Nutzer
- **Search Usage**: > 40% der Nutzer
- **Click-through Rate**: > 15% der Listings

### Performance Metrics:
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **API Response Time**: < 500ms

---

## 🚀 Future Enhancements

### Phase 2:
- **Map View**: Leaflet Integration
- **Advanced Filters**: Preis, Entfernung, Verfügbarkeit
- **Favorites**: Nutzer können Listings favorisieren
- **Sorting**: Nach Datum, Preis, Entfernung

### Phase 3:
- **AI Recommendations**: Basierend auf Nutzer-Verhalten
- **Saved Searches**: Nutzer können Suchen speichern
- **Notifications**: Benachrichtigungen für neue Listings

---

## 📝 Zusammenfassung

Die Listing Discovery Page folgt diesen UX-Prinzipien:

1. **Scanbarkeit**: Card-basiertes Layout für schnelle Übersicht
2. **Progressive Disclosure**: Details on Demand
3. **Feedback**: Loading, Empty, Error States
4. **Mobile-First**: Responsive Design
5. **Performance**: Lazy Loading, Caching, Optimistic Updates

**Kernziel**: Nutzer sollen schnell und einfach die richtigen Angebote finden.

