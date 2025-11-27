# Post-MVP Roadmap

Dieses Dokument beschreibt geplante Features und Verbesserungen für ShareLocal nach dem MVP-Release.

---

## 🚀 Phase 1: Real-time & Performance (3-4 Monate)

### 1.1 Real-time Chat mit Socket.io
**Priorität**: Hoch  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Ersetze Polling durch WebSocket-Verbindungen (Socket.io)
- Echtzeit-Nachrichten-Updates ohne Seiten-Reload
- Online/Offline Status für Nutzer
- Typing-Indikatoren ("X schreibt...")

**Technische Details**:
- Socket.io Server Integration in Express
- Client-seitige Socket.io Integration
- Room-basierte Kommunikation pro Conversation
- Fallback zu Polling bei WebSocket-Fehlern

**Abhängigkeiten**: Keine

---

### 1.2 Push-Benachrichtigungen
**Priorität**: Hoch  
**Aufwand**: 3-4 Wochen  
**Beschreibung**:  
- Browser Push Notifications für neue Nachrichten
- E-Mail-Benachrichtigungen für wichtige Events
- In-App Notification Center

**Technische Details**:
- Web Push API Integration
- Service Worker für Background Notifications
- E-Mail Service (Mailgun EU) Integration
- Notification Preferences pro User

**Abhängigkeiten**: 
- Real-time Chat (1.1) - für Trigger-Events

---

### 1.3 Performance-Optimierungen
**Priorität**: Mittel  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Database Query Optimization
- Redis Caching Layer
- CDN für statische Assets
- Image Optimization & Lazy Loading

**Technische Details**:
- Redis für Session & Cache Management
- Database Indexing Review
- Next.js Image Optimization
- API Response Caching

**Abhängigkeiten**: Keine

---

## 📱 Phase 2: Mobile App (4-6 Monate)

### 2.1 Flutter Mobile App - MVP
**Priorität**: Hoch  
**Aufwand**: 3-4 Monate  
**Beschreibung**:  
- Native iOS & Android App
- Vollständige Feature-Parität mit Web
- Offline-First Architektur
- Push Notifications (Native)

**Technische Details**:
- Flutter 3.27.x
- Riverpod für State Management
- Shared Preferences für Offline Storage
- Firebase Cloud Messaging (FCM) für Push

**Abhängigkeiten**: 
- Backend API muss stabil sein
- Push-Benachrichtigungen (1.2)

---

### 2.2 Mobile-spezifische Features
**Priorität**: Mittel  
**Aufwand**: 1-2 Monate  
**Beschreibung**:  
- GPS-basierte Standort-Erkennung
- Kamera-Integration für Listing-Fotos
- QR-Code Scanner für schnelle Kontaktaufnahme
- App Shortcuts & Widgets

**Abhängigkeiten**: 
- Flutter Mobile App MVP (2.1)

---

## 🔍 Phase 3: Erweiterte Features (3-4 Monate)

### 3.1 Erweiterte Suche & Filter
**Priorität**: Mittel  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Volltext-Suche mit Elasticsearch/Algolia
- Geo-basierte Suche (Radius-Suche)
- Erweiterte Filter (Preis-Range, Verfügbarkeit, Bewertungen)
- Such-Historie & Favoriten

**Technische Details**:
- Elasticsearch oder Algolia Integration
- PostGIS für Geo-Queries
- Search Index Updates via Queue

**Abhängigkeiten**: Keine

---

### 3.2 Bewertungs- & Reputations-System
**Priorität**: Mittel  
**Aufwand**: 3-4 Wochen  
**Beschreibung**:  
- 5-Sterne Bewertungen nach Transaktionen
- Kommentare & Reviews
- Reputations-Score pro User
- Verifizierte Nutzer-Badges

**Technische Details**:
- Neue Database Tables: `Rating`, `Review`
- Aggregierte Scores (Cached)
- Moderation für Reviews

**Abhängigkeiten**: Keine

---

### 3.3 Kalender-Integration für Verfügbarkeit
**Priorität**: Mittel  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Verfügbarkeits-Kalender pro Listing
- Buchungs-Anfragen mit Zeitfenstern
- iCal/Google Calendar Export
- Automatische Verfügbarkeits-Updates

**Technische Details**:
- Calendar Component (FullCalendar oder ähnlich)
- Availability Slots System
- Calendar Sync APIs

**Abhängigkeiten**: Keine

---

## 🛡️ Phase 4: Sicherheit & Compliance (2-3 Monate)

### 4.1 Erweiterte Content-Moderation
**Priorität**: Hoch  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Automatische Spam-Erkennung
- Bild-Moderation (NSFW Detection)
- Keyword-Filtering
- User-Reporting System

**Technische Details**:
- ML-basierte Moderation (Self-hosted oder Hugging Face EU)
- Moderation Queue & Review Interface
- Auto-Block bei wiederholten Verstößen

**Abhängigkeiten**: Keine

---

### 4.2 GDPR-Erweiterungen
**Priorität**: Hoch  
**Aufwand**: 1-2 Wochen  
**Beschreibung**:  
- Daten-Export Funktion
- Account-Löschung mit Daten-Purging
- Cookie-Consent Management
- Privacy Policy Generator

**Abhängigkeiten**: Keine

---

### 4.3 Two-Factor Authentication (2FA)
**Priorität**: Mittel  
**Aufwand**: 2 Wochen  
**Beschreibung**:  
- TOTP-basierte 2FA (Google Authenticator, Authy)
- Backup Codes
- SMS-2FA (optional)

**Technische Details**:
- `speakeasy` oder `otplib` für TOTP
- QR Code Generation
- Recovery Flow

**Abhängigkeiten**: Keine

---

## 🌐 Phase 5: Skalierung & Infrastructure (2-3 Monate)

### 5.1 Multi-Tenancy / Multi-City Support
**Priorität**: Niedrig  
**Aufwand**: 4-6 Wochen  
**Beschreibung**:  
- Unterstützung für mehrere Städte/Regionen
- City-spezifische Listings
- Admin-Panel für City-Management

**Technische Details**:
- City/Region Database Schema
- Routing basierend auf Location
- Subdomain oder Path-basierte Multi-Tenancy

**Abhängigkeiten**: Keine

---

### 5.2 Kubernetes Deployment
**Priorität**: Niedrig  
**Aufwand**: 3-4 Wochen  
**Beschreibung**:  
- Kubernetes Cluster Setup
- Auto-Scaling
- Blue-Green Deployments
- Monitoring & Logging (Prometheus, Grafana)

**Abhängigkeiten**: 
- Stabile MVP-Version
- CI/CD Pipeline

---

### 5.3 CDN & Asset Optimization
**Priorität**: Mittel  
**Aufwand**: 1-2 Wochen  
**Beschreibung**:  
- Cloudflare CDN Integration
- Image CDN (Cloudflare Images oder Scaleway)
- Asset Versioning & Caching

**Abhängigkeiten**: Keine

---

## 🎨 Phase 6: UX-Verbesserungen (2-3 Monate)

### 6.1 Erweiterte UI/UX Features
**Priorität**: Mittel  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Dark Mode
- Accessibility Verbesserungen (WCAG 2.1 AAA)
- Internationalisierung (i18n) - Mehrsprachigkeit
- Responsive Design Verbesserungen

**Abhängigkeiten**: Keine

---

### 6.2 Onboarding & Tutorials
**Priorität**: Mittel  
**Aufwand**: 1-2 Wochen  
**Beschreibung**:  
- Interaktives Onboarding für neue Nutzer
- Feature-Tutorials
- Help Center & FAQ

**Abhängigkeiten**: Keine

---

## 📊 Phase 7: Analytics & Insights (1-2 Monate)

### 7.1 Analytics Dashboard
**Priorität**: Niedrig  
**Aufwand**: 2-3 Wochen  
**Beschreibung**:  
- Admin Analytics Dashboard
- User Engagement Metrics
- Listing Performance Stats
- Conversion Tracking

**Technische Details**:
- Self-hosted Analytics (Plausible oder Matomo)
- Custom Dashboard mit Charts
- Export-Funktionen

**Abhängigkeiten**: Keine

---

### 7.2 User Insights
**Priorität**: Niedrig  
**Aufwand**: 1-2 Wochen  
**Beschreibung**:  
- Personalisierte Empfehlungen
- "Ähnliche Angebote" Feature
- Activity Feed

**Abhängigkeiten**: 
- Analytics Dashboard (7.1)

---

## 🔄 Wartung & Verbesserungen (Ongoing)

### Continuous Improvements
- Bug Fixes & Security Updates
- Performance Monitoring & Optimization
- User Feedback Integration
- Dependency Updates
- Code Quality Improvements

---

## 📝 Notizen

### Nicht geplant (explizit ausgeschlossen)
- ❌ File Uploads in Chat-Nachrichten
- ❌ Zahlungsabwicklung (bleibt extern)
- ❌ Transaktions-Moderation (bleibt Nutzer-Verantwortung)
- ❌ End-to-End Verschlüsselung (nicht nötig für Koordinations-Plattform)

### Entscheidungen offen
- ⚠️ Such-Engine: Elasticsearch vs. Algolia (Kosten vs. Self-hosted)
- ⚠️ Push Notifications: Firebase FCM vs. Web Push API (für Mobile)
- ⚠️ Moderation: Self-hosted ML vs. Hugging Face EU API

---

## 📅 Grober Zeitplan

**Q1 2025**: Phase 1 (Real-time & Performance)  
**Q2 2025**: Phase 2 (Mobile App MVP)  
**Q3 2025**: Phase 3 (Erweiterte Features)  
**Q4 2025**: Phase 4 (Sicherheit) + Phase 5 (Skalierung)  
**2026**: Phase 6 & 7 (UX & Analytics)

*Hinweis: Zeitplan ist flexibel und abhängig von MVP-Erfolg und User-Feedback.*

