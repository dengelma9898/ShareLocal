# ShareLocal MVP Features

## Übersicht

Dieses Dokument beschreibt die Features des MVP (Minimum Viable Product) von ShareLocal und sammelt Ideen für zukünftige Erweiterungen.

---

## MVP Features (Aktuell implementiert)

### 1. Ressourcen-Katalog (Listings)

**Funktionalität:**
- Nutzer können Angebote und Gesuche erstellen
- Kategorien: Werkzeug, Pflanze, Fähigkeit, Produkt, Zeit, Sonstiges
- Typen: Angebot (OFFER) oder Gesuch (REQUEST)
- Titel, Beschreibung, Standort, Bilder, Tags
- Optional: Preis pro Tag (nur Informationszweck, keine Zahlungsabwicklung)

**Features:**
- ✅ Listing-Erstellung mit Validierung
- ✅ Listing-Bearbeitung
- ✅ Listing-Löschung (Soft Delete)
- ✅ Listing-Discovery mit Filtern (Kategorie, Typ, Suche)
- ✅ Listing-Detailansicht
- ✅ "Meine Angebote" Übersicht

### 2. User-Authentication & Profile

**Funktionalität:**
- Registrierung mit E-Mail und Passwort
- Login/Logout
- User-Profile mit Avatar, Bio, Standort
- JWT-basierte Authentifizierung

**Features:**
- ✅ Registrierung
- ✅ Login/Logout
- ✅ Profil-Verwaltung
- ✅ Passwort-Hashing (bcrypt)
- ✅ Protected Routes

### 3. Chat-System (Conversations & Messages)

**Funktionalität:**
- Conversations werden immer über ein Listing erstellt (keine direkten Chats)
- Nachrichten zwischen Listing-Besitzer und Interessenten
- Gruppierung nach Angeboten für Listing-Besitzer
- Separate Ansicht für eigene Angebote vs. Interessen

**Features:**
- ✅ Conversation-Erstellung über Listing-Detailseite
- ✅ Nachrichten senden und empfangen
- ✅ Conversation-Liste mit unread Badges
- ✅ Gruppierung nach Listing für "Meine Angebote"
- ✅ Listing-Info in "Meine Interessen" Conversations
- ✅ Unread Message Count im Header
- ✅ Manual Refresh (MVP-Ansatz, WebSocket später)

### 4. Content-Moderation

**Funktionalität:**
- Basis-Moderation für explizite/illegale Inhalte
- DSA-Compliance (Digital Services Act)

**Features:**
- ✅ Content-Validierung (Zod Schemas)
- 🔄 Moderation-Tools (geplant)

### 5. Technische Features

**Backend:**
- ✅ Express.js API mit TypeScript
- ✅ Prisma ORM mit PostgreSQL
- ✅ Ports & Adapters Architektur
- ✅ JWT Authentication
- ✅ Error Handling
- ✅ Input Validation (Zod)

**Frontend:**
- ✅ Next.js 16 (App Router)
- ✅ React 19
- ✅ Tailwind CSS + shadcn/ui
- ✅ React Query für Data Fetching
- ✅ Responsive Design

**Infrastructure:**
- ✅ Docker Container
- ✅ pnpm Workspace Monorepo
- ✅ CI/CD mit GitHub Actions

---

## Zukünftige Features (Brainstorming)

### Priorität: Hoch (Phase 2)

#### 1. Verfügbarkeits-Management
**Beschreibung:** Nutzer können ihre Angebote als "nicht verfügbar" markieren, ohne sie zu löschen.

**Features:**
- Toggle "Verfügbar" / "Nicht verfügbar" auf Listing-Detailseite
- Automatische Markierung nach X Tagen Inaktivität (optional)
- Kalender-Integration für Verfügbarkeits-Zeiträume
- "Wieder verfügbar ab..." Datum

**Nutzen:**
- Bessere Übersicht über aktive Angebote
- Vermeidet unnötige Nachrichten zu nicht verfügbaren Angeboten
- Ermöglicht temporäre Pausen

#### 2. Nutzer-Bewertungen & Reputation
**Beschreibung:** Bewertungssystem für Transaktionen und Nutzer-Verhalten.

**Features:**
- 5-Sterne Bewertung nach abgeschlossener Transaktion
- Kommentare zu Bewertungen
- Reputation-Score basierend auf Bewertungen
- Verifizierte Nutzer (z.B. nach X erfolgreichen Transaktionen)
- Bewertungs-Historie im Profil

**Nutzen:**
- Vertrauensaufbau in der Community
- Qualitätssicherung
- Anreiz für gutes Verhalten

#### 3. Erweiterte Suche & Filter
**Beschreibung:** Verbesserte Discovery-Funktionen für Listings.

**Features:**
- Geografische Suche (PostGIS Integration)
- Radius-Suche ("In 5km Umkreis")
- Erweiterte Filter (Preis, Verfügbarkeit, Bewertung)
- Gespeicherte Suchanfragen
- Such-Alerts ("Benachrichtige mich bei neuen Angeboten für...")

**Nutzen:**
- Bessere lokale Vernetzung
- Schnelleres Finden relevanter Angebote

### Priorität: Mittel (Phase 3)

#### 4. Favoriten & Watchlist
**Beschreibung:** Nutzer können interessante Angebote speichern.

**Features:**
- "Zu Favoriten hinzufügen" Button
- Favoriten-Übersicht im Profil
- Benachrichtigungen bei Preisänderungen oder Verfügbarkeit
- Watchlist für Gesuche

**Nutzen:**
- Schnellerer Zugriff auf interessante Angebote
- Verfolgung mehrerer Angebote gleichzeitig

#### 5. Gruppen & Communities
**Beschreibung:** Lokale Gruppen für spezifische Interessen oder Nachbarschaften.

**Features:**
- Gruppen erstellen (z.B. "Werkzeug-Sharing Nürnberg")
- Gruppen-spezifische Listings
- Gruppen-Chats
- Gruppen-Events

**Nutzen:**
- Stärkere Community-Bindung
- Fokussierte Angebote für spezifische Gruppen

#### 6. Erweiterte Chat-Features
**Beschreibung:** Verbesserte Kommunikation zwischen Nutzern.

**Features:**
- WebSocket für Echtzeit-Nachrichten
- Datei-Uploads (z.B. Bilder von Schäden)
- Voice Messages
- Read Receipts
- Nachrichten-Vorschau in E-Mails

**Nutzen:**
- Bessere Kommunikation
- Schnellere Koordination

#### 7. Angebots-Historie & Statistiken
**Beschreibung:** Übersicht über vergangene Transaktionen und Nutzungsstatistiken.

**Features:**
- Transaktions-Historie
- Statistiken ("Du hast X Ressourcen geteilt", "Ykg CO2 gespart")
- Nachhaltigkeits-Tracking
- Jahres-Report

**Nutzen:**
- Motivation durch sichtbare Erfolge
- Nachhaltigkeits-Bewusstsein

### Priorität: Niedrig (Phase 4+)

#### 8. Empfehlungssystem
**Beschreibung:** KI-basierte Empfehlungen für passende Angebote.

**Features:**
- "Ähnliche Angebote" Vorschläge
- Personalisierte Empfehlungen basierend auf Interessen
- "Nutzer mit ähnlichen Interessen haben auch angesehen..."

**Nutzen:**
- Entdeckung neuer Ressourcen
- Bessere Nutzerbindung

#### 9. Integration mit externen Services
**Beschreibung:** Verbindung mit anderen Plattformen und Services.

**Features:**
- Kalender-Integration (Google Calendar, iCal)
- Social Media Sharing
- QR-Code für schnelles Teilen
- API für externe Apps

**Nutzen:**
- Erweiterte Reichweite
- Bequemere Nutzung

#### 10. Gamification
**Beschreibung:** Spielelemente zur Motivation.

**Features:**
- Achievements ("Erstes Angebot erstellt", "10 Transaktionen")
- Badges für verschiedene Aktivitäten
- Leaderboards (optional, anonymisiert)
- Challenges ("Teile diesen Monat 5 Ressourcen")

**Nutzen:**
- Erhöhte Nutzeraktivität
- Spaß-Faktor

#### 11. Erweiterte Moderation & Sicherheit
**Beschreibung:** Verbesserte Sicherheit und Moderation.

**Features:**
- Automatische Spam-Erkennung
- Report-System für problematische Inhalte/Nutzer
- Moderation-Dashboard für Admins
- Automatische Sperrung bei wiederholten Verstößen

**Nutzen:**
- Sicherere Plattform
- Bessere Nutzererfahrung

#### 12. Mehrsprachigkeit
**Beschreibung:** Unterstützung für mehrere Sprachen.

**Features:**
- Deutsch, Englisch, weitere EU-Sprachen
- Automatische Übersetzung (optional)
- Lokalisierung von Datum/Zeit, Währung

**Nutzen:**
- Erweiterte Zielgruppe
- Inklusivität

#### 13. Mobile App Features
**Beschreibung:** Native Mobile App mit erweiterten Features.

**Features:**
- Push-Benachrichtigungen
- Offline-Modus
- QR-Code Scanner für schnelles Teilen
- Standort-basierte Suche
- Kamera-Integration für Listing-Fotos

**Nutzen:**
- Bessere Mobile Experience
- Schnellere Nutzung unterwegs

#### 14. Zahlungsabwicklung (Optional)
**Beschreibung:** Integration eines Zahlungssystems (nur wenn gewünscht).

**Features:**
- SEPA-Integration (EU-konform)
- Escrow-System für Sicherheit
- Automatische Auszahlung nach Transaktion
- Rechnungsstellung

**Hinweis:** Ursprünglich nicht geplant, da Plattform nur Vermittlung sein soll. Könnte später optional hinzugefügt werden.

#### 15. Analytics & Insights
**Beschreibung:** Datenanalyse für Nutzer und Admins.

**Features:**
- Dashboard für Listing-Besitzer (Views, Nachrichten, etc.)
- Community-Statistiken (öffentlich)
- Admin-Analytics
- Export-Funktionen

**Nutzen:**
- Besseres Verständnis der Nutzung
- Datengetriebene Verbesserungen

---

## Technische Verbesserungen (Backlog)

### Performance
- Redis Caching für häufige Queries
- Database Indexing Optimierung
- CDN für statische Assets
- Image Optimization & Lazy Loading

### Skalierung
- Kubernetes Migration (bei Bedarf)
- Database Sharding (bei sehr großem Wachstum)
- Microservices Architektur (optional)

### Monitoring & Observability
- Application Performance Monitoring (APM)
- Error Tracking (z.B. Sentry)
- Log Aggregation
- Health Checks & Alerts

### Testing
- Erweiterte E2E Tests
- Performance Tests
- Load Tests
- Security Tests

---

## Feature-Priorisierung

Die Priorisierung basiert auf:
1. **Nutzen für MVP-Nutzer**: Was bringt den meisten Wert?
2. **Implementierungsaufwand**: Wie komplex ist die Umsetzung?
3. **Abhängigkeiten**: Braucht das Feature andere Features?
4. **Community-Feedback**: Was wünschen sich die Nutzer?

---

## Feedback & Ideen

Dieses Dokument sollte regelmäßig aktualisiert werden basierend auf:
- Nutzer-Feedback
- Community-Wünschen
- Technischen Möglichkeiten
- Marktentwicklungen

**Hinweis:** Nicht alle Features müssen umgesetzt werden. Die Auswahl sollte sich am Nutzen für die Community orientieren und die Kernwerte der Plattform (Vermittlung, Gemeinschaft, Nachhaltigkeit) unterstützen.

