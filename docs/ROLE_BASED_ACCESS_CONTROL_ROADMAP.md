# Roadmap: Rollenbasierte Zugriffskontrolle (RBAC) & Events-Funktionalität

## Übersicht

Diese Roadmap beschreibt die Implementierung von rollenbasierten Funktionalitäten für ShareLocal:
- **Admin-Rolle**: Vollzugriff auf alle Funktionen inkl. User-Management
- **Event-Manager-Rolle**: Kann Events erstellen und verwalten (Admin kann das auch)
- **User-Rolle**: Standard-Nutzer (wie bisher)

## Aktuelle Situation

### ✅ Bereits vorhanden:
- `UserRole` Enum mit `USER` und `ADMIN` im Prisma Schema
- `role` Feld im User-Model
- JWT-basierte Authentifizierung
- `authenticate` Middleware für geschützte Routes
- `User.isAdmin()` Methode in der Domain-Entity

### ❌ Fehlt noch:
- `EVENT_MANAGER` Rolle im Enum
- Events-Model im Prisma Schema
- RBAC Middleware für Rollenprüfung
- Admin-Routes und Admin-Funktionalitäten
- Event-Routes und Event-Management
- Frontend-Komponenten für Admin-Panel
- Frontend-Komponenten für Event-Management
- Rollenprüfung in bestehenden Routes

---

## Phase 1: Datenbank & Domain Layer (Backend)

**Was**: Diese Phase legt die Grundlage für RBAC und Events im Datenmodell. Wir erweitern das Prisma Schema, aktualisieren die Shared Types und erweitern die Domain Entities.

**Warum**: 
- **Datenmodell-First**: Bevor wir Business Logic implementieren, müssen wir sicherstellen, dass die Datenstruktur korrekt ist. Das Schema ist die "Single Source of Truth" für alle Daten.
- **Type Safety**: Durch die Aktualisierung der Shared Types und Domain Entities stellen wir sicher, dass TypeScript uns bei der Entwicklung unterstützt und Fehler frühzeitig erkennt.
- **Migration-Sicherheit**: Prisma Migrationen sind unveränderlich - Fehler hier würden später teure Refactorings erfordern.
- **Domain-Driven Design**: Die Domain Entities enthalten die Business Logic und Regeln, die unabhängig von der Infrastruktur sind.

---

### 1.1 Prisma Schema erweitern

**Was**: Wir erweitern das Prisma Schema um die `EVENT_MANAGER` Rolle und fügen ein komplettes Events-Model hinzu.

**Warum**:
- **Datenbank-Struktur**: Das Schema definiert, wie Daten in PostgreSQL gespeichert werden. Ohne Events-Model können wir keine Events persistieren.
- **Rollen-Erweiterung**: Die neue `EVENT_MANAGER` Rolle muss im Enum definiert sein, damit Prisma die korrekten Constraints erstellt.
- **Relations**: Die Relation zwischen User und Events ermöglicht es, zu tracken, wer welches Event erstellt hat.
- **Indexes**: Die definierten Indexes verbessern die Performance bei Queries (z.B. Events nach Startdatum sortieren).

**Datei**: `packages/database/prisma/schema.prisma`

**Änderungen**:
1. `UserRole` Enum erweitern:
   ```prisma
   enum UserRole {
     USER
     EVENT_MANAGER
     ADMIN
   }
   ```

2. Events-Model hinzufügen:
   ```prisma
   model Event {
     id          String   @id @default(uuid())
     title       String
     description String   @db.Text
     location    String?  // Stadt/Adresse
     latitude    Float?
     longitude   Float?
     startDate   DateTime
     endDate     DateTime?
     image       String?  // URL zum Event-Bild
     tags        String[]
     
     // Organizer
     organizerId String
     organizer   User     @relation("EventOrganizer", fields: [organizerId], references: [id], onDelete: Cascade)
     
     // Timestamps
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     deletedAt   DateTime? // Soft delete
     
     @@index([organizerId])
     @@index([startDate])
     @@index([createdAt])
     @@map("events")
   }
   ```

3. User-Model erweitern:
   ```prisma
   model User {
     // ... bestehende Felder
     organizedEvents Event[] @relation("EventOrganizer")
   }
   ```

**Migration erstellen**:
```bash
cd packages/database
pnpm db:migrate dev --name add_event_manager_role_and_events
```

**Verifizierung**:
```bash
# 1. Prisma Schema validieren
cd packages/database
pnpm prisma validate

# 2. Prisma Client generieren (sollte ohne Fehler laufen)
pnpm db:generate

# 3. Migration Status prüfen
pnpm prisma migrate status

# 4. Prisma Studio öffnen und prüfen:
#    - UserRole Enum enthält USER, EVENT_MANAGER, ADMIN
#    - Events-Tabelle existiert mit allen Feldern
#    - User-Tabelle hat organizedEvents Relation
pnpm db:studio

# 5. TypeScript-Kompilierung prüfen (sollte ohne Fehler sein)
cd ../..
pnpm --filter @sharelocal/database build
```

**Erwartete Ergebnisse**:
- ✅ `prisma validate` gibt keine Fehler zurück
- ✅ `db:generate` generiert Prisma Client ohne Fehler
- ✅ Migration wird als "applied" angezeigt
- ✅ Prisma Studio zeigt Events-Tabelle und erweiterte UserRole Enum
- ✅ TypeScript-Kompilierung erfolgreich

**Dauer**: ~30 Minuten

---

### 1.2 Shared Types aktualisieren

**Was**: Wir aktualisieren die TypeScript Types im `@sharelocal/shared` Package, um die neue Rolle und Event-Interface zu reflektieren.

**Warum**:
- **Type Consistency**: Frontend und Backend müssen die gleichen Types verwenden, um Type-Safety über die gesamte Anwendung zu gewährleisten.
- **Shared Package**: Das `@sharelocal/shared` Package ist die zentrale Quelle für Types, die von mehreren Packages verwendet werden (API, Web, Mobile).
- **Frühe Fehlererkennung**: Wenn Types nicht synchronisiert sind, werden Compile-Fehler sofort sichtbar, nicht erst zur Laufzeit.
- **Developer Experience**: Autocomplete und Type-Checking in der IDE funktionieren nur mit korrekten Types.

**Datei**: `packages/shared/src/index.ts`

**Änderungen**:
1. `UserRole` Type erweitern:
   ```typescript
   export type UserRole = 'USER' | 'EVENT_MANAGER' | 'ADMIN';
   ```

2. Event Types hinzufügen:
   ```typescript
   export interface Event {
     id: string;
     title: string;
     description: string;
     location?: string | null;
     latitude?: number | null;
     longitude?: number | null;
     startDate: Date;
     endDate?: Date | null;
     image?: string | null;
     tags: string[];
     organizerId: string;
     createdAt: Date;
     updatedAt: Date;
     deletedAt?: Date | null;
   }
   ```

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/shared
pnpm build

# 2. Types exportieren prüfen
node -e "const { UserRole, Event } = require('./dist/index.js'); console.log('UserRole:', UserRole); console.log('Event:', Event);"

# 3. In anderen Packages importieren testen (sollte ohne Fehler sein)
cd ../api
pnpm build  # Sollte UserRole und Event Types finden können

cd ../web
pnpm build  # Sollte UserRole und Event Types finden können
```

**Erwartete Ergebnisse**:
- ✅ `packages/shared` baut ohne Fehler
- ✅ `UserRole` Type enthält 'USER' | 'EVENT_MANAGER' | 'ADMIN'
- ✅ `Event` Interface ist exportiert
- ✅ API und Web Packages können die Types importieren ohne TypeScript-Fehler

**Dauer**: ~15 Minuten

---

### 1.3 Domain Entity erweitern

**Was**: Wir erweitern die User Domain Entity um Rollen-Helper-Methoden und erstellen eine neue Event Domain Entity.

**Warum**:
- **Business Logic**: Domain Entities enthalten die Geschäftslogik, die unabhängig von der Infrastruktur ist. Die `canManageEvents()` Methode ist ein Beispiel für eine Business Rule.
- **Encapsulation**: Die Helper-Methoden (`isEventManager()`, `canManageEvents()`) kapseln die Logik, wer was tun darf. Dies macht den Code lesbarer und wartbarer.
- **Testbarkeit**: Domain Entities können ohne Datenbank getestet werden, da sie reine TypeScript-Klassen sind.
- **Ports & Adapters**: Die Domain Layer ist unabhängig von Express, Prisma, etc. - sie kann später leicht ausgetauscht werden.

**Datei**: `packages/api/src/domain/entities/User.ts`

**Änderungen**:
1. `UserRole` Type erweitern:
   ```typescript
   role: 'USER' | 'EVENT_MANAGER' | 'ADMIN';
   ```

2. Helper-Methoden hinzufügen:
   ```typescript
   isEventManager(): boolean {
     return this.data.role === 'EVENT_MANAGER' || this.data.role === 'ADMIN';
   }
   
   canManageEvents(): boolean {
     return this.isEventManager() || this.isAdmin();
   }
   ```

**Neue Datei**: `packages/api/src/domain/entities/Event.ts`
- Event Domain Entity erstellen (analog zu User/Listing)

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. Unit-Tests für User Entity schreiben und ausführen
#    (Test für isEventManager() und canManageEvents())
pnpm test -- User.test.ts

# 3. Manuell testen in Node REPL:
node -e "
const { User } = require('./dist/domain/entities/User.js');
const user = new User({
  id: '1',
  email: 'test@test.com',
  name: 'Test',
  role: 'EVENT_MANAGER',
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date()
});
console.log('isAdmin:', user.isAdmin()); // false
console.log('isEventManager:', user.isEventManager()); // true
console.log('canManageEvents:', user.canManageEvents()); // true
"
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ `User.isEventManager()` gibt `true` für EVENT_MANAGER und ADMIN zurück
- ✅ `User.canManageEvents()` gibt `true` für EVENT_MANAGER und ADMIN zurück
- ✅ `User.isAdmin()` gibt `true` nur für ADMIN zurück
- ✅ Event Entity existiert und kann instanziiert werden

**Dauer**: ~45 Minuten

---

## Phase 2: Backend - RBAC Middleware & Infrastructure

**Was**: Diese Phase implementiert die rollenbasierte Zugriffskontrolle im Backend. Wir erstellen Middleware für Rollenprüfung, implementieren Event- und Admin-Routes, sowie die notwendigen Repositories und Use Cases.

**Warum**:
- **Sicherheit**: RBAC-Middleware stellt sicher, dass nur autorisierte User auf bestimmte Endpoints zugreifen können. Dies ist kritisch für die Sicherheit der Anwendung.
- **Separation of Concerns**: Die Middleware trennt die Authentifizierung/Autorisierung von der Business Logic, was den Code wartbarer macht.
- **Wiederverwendbarkeit**: Die `requireRole()` Middleware kann für alle Routes verwendet werden, die Rollenprüfung benötigen.
- **Ports & Adapters**: Repositories und Use Cases folgen der Hexagonal Architecture, was Testbarkeit und Austauschbarkeit ermöglicht.

---

### 2.1 RBAC Middleware erstellen

**Was**: Wir erstellen eine Middleware-Factory `requireRole()`, die prüft, ob der authentifizierte User eine der erlaubten Rollen hat.

**Warum**:
- **Zentrale Autorisierung**: Statt in jeder Route manuell zu prüfen, ob ein User die richtige Rolle hat, können wir die Middleware wiederverwenden.
- **Konsistenz**: Alle Routes verwenden die gleiche Logik für Rollenprüfung, was Fehler reduziert.
- **Express Middleware Pattern**: Folgt dem Standard Express-Pattern für Middleware, was für andere Entwickler vertraut ist.
- **Error Handling**: Die Middleware kann einheitliche Fehlerantworten (403 Forbidden) zurückgeben.

**Neue Datei**: `packages/api/src/adapters/http/middleware/rbac.ts`

**Funktionalität**:
- `requireRole(roles: UserRole[])` - Middleware Factory
- Prüft, ob authentifizierter User eine der erlaubten Rollen hat
- Erweitert `AuthenticatedRequest` um vollständiges User-Objekt

**Implementierung**:
```typescript
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export function requireRole(
  roles: UserRole[],
  authService: AuthService,
  userRepository: UserRepository
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // 1. Authentifizierung prüfen (via authenticate middleware)
    // 2. User aus DB laden
    // 3. Rolle prüfen
    // 4. Bei Erfolg: User-Rolle zu req.user hinzufügen
  };
}
```

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. Unit-Tests für RBAC Middleware schreiben
pnpm test -- rbac.test.ts

# 3. Integration-Test: Middleware mit Express testen
#    - Test mit gültigem Token und korrekter Rolle → sollte durchlassen
#    - Test mit gültigem Token aber falscher Rolle → sollte 403 zurückgeben
#    - Test ohne Token → sollte 401 zurückgeben

# 4. Manuell testen mit HTTP-Request:
#    (Nachdem Event-Routes implementiert sind)
curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}' 
# Erwartet: 403 Forbidden (USER hat nicht EVENT_MANAGER Rolle)

curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <EVENT_MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}' 
# Erwartet: 201 Created oder 400 Bad Request (wenn Validierung fehlt)
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Unit-Tests für RBAC Middleware bestehen
- ✅ Middleware gibt 403 Forbidden für falsche Rolle zurück
- ✅ Middleware gibt 401 Unauthorized für fehlendes Token zurück
- ✅ Middleware lässt Requests mit korrekter Rolle durch

**Dauer**: ~1 Stunde

---

### 2.2 Auth Middleware erweitern

**Was**: Wir erweitern die bestehende `authenticate` Middleware, um die User-Rolle im Request-Objekt verfügbar zu machen.

**Warum**:
- **RBAC-Integration**: Die RBAC-Middleware benötigt Zugriff auf die User-Rolle. Statt die Rolle jedes Mal aus der DB zu laden, können wir sie im Request speichern.
- **Performance**: Wenn die Rolle bereits im Request verfügbar ist, müssen wir nicht erneut die DB abfragen.
- **Konsistenz**: Alle Middleware kann auf `req.user.role` zugreifen, was den Code vereinfacht.
- **Backward Compatibility**: Wir erweitern die bestehende Middleware, ohne bestehende Funktionalität zu brechen.

**Datei**: `packages/api/src/adapters/http/middleware/auth.ts`

**Änderungen**:
- `AuthenticatedRequest` erweitern um `role` Feld
- Optional: Vollständiges User-Objekt in Request laden (für RBAC)

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. Bestehende Auth-Tests sollten weiterhin funktionieren
pnpm test -- auth.test.ts

# 3. Prüfen, dass req.user.role verfügbar ist:
#    In einer Route: console.log(req.user?.role) sollte die Rolle ausgeben

# 4. Integration-Test: Authentifizierte Route testen
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <VALID_TOKEN>"
# Response sollte user.role enthalten
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Bestehende Auth-Tests bestehen weiterhin
- ✅ `req.user.role` ist verfügbar in authentifizierten Routes
- ✅ `/api/users/me` gibt User mit Rolle zurück

**Dauer**: ~30 Minuten

---

### 2.3 Event Repository & Use Cases

**Was**: Wir implementieren das Repository Pattern für Events und die entsprechenden Use Cases (Create, Read, Update, Delete).

**Warum**:
- **Ports & Adapters**: Das Repository Interface (`EventRepository`) ist ein Port - die Implementierung (`PrismaEventRepository`) ist ein Adapter. Dies ermöglicht es, später z.B. auf MongoDB umzusteigen, ohne die Use Cases zu ändern.
- **Business Logic**: Use Cases enthalten die Geschäftslogik (z.B. "Nur der Organizer kann ein Event bearbeiten"). Diese Logik ist unabhängig von Express oder Prisma.
- **Testbarkeit**: Use Cases können mit Mock-Repositories getestet werden, ohne eine echte Datenbank zu benötigen.
- **Single Responsibility**: Jeder Use Case hat eine klare Verantwortlichkeit (z.B. `CreateEventUseCase` erstellt nur Events).

**Neue Dateien**:
- `packages/api/src/ports/repositories/EventRepository.ts` - Repository Interface
- `packages/api/src/adapters/database/PrismaEventRepository.ts` - Prisma Implementierung
- `packages/api/src/application/use-cases/CreateEventUseCase.ts`
- `packages/api/src/application/use-cases/UpdateEventUseCase.ts`
- `packages/api/src/application/use-cases/DeleteEventUseCase.ts`
- `packages/api/src/application/use-cases/GetEventUseCase.ts`
- `packages/api/src/application/use-cases/GetAllEventsUseCase.ts`

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. Unit-Tests für Use Cases schreiben
pnpm test -- CreateEventUseCase.test.ts
pnpm test -- UpdateEventUseCase.test.ts
pnpm test -- DeleteEventUseCase.test.ts

# 3. Repository-Tests schreiben
pnpm test -- PrismaEventRepository.test.ts

# 4. Integration-Test: Event erstellen via Repository
#    (In Test-Datenbank)
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.event.create({
  data: {
    title: 'Test Event',
    description: 'Test',
    organizerId: 'USER_ID',
    startDate: new Date(),
    tags: []
  }
}).then(e => console.log('Event created:', e.id));
"
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Alle Use Case Tests bestehen
- ✅ Repository Tests bestehen
- ✅ Event kann in Datenbank erstellt werden
- ✅ Event kann aus Datenbank gelesen werden
- ✅ Event kann aktualisiert werden
- ✅ Event kann gelöscht werden (Soft Delete)

**Dauer**: ~3 Stunden

---

### 2.4 Event Routes erstellen

**Was**: Wir erstellen REST-Endpoints für Event-Management mit entsprechender RBAC-Implementierung.

**Warum**:
- **RESTful API**: Die Endpoints folgen REST-Konventionen (GET für Lesen, POST für Erstellen, PUT für Aktualisieren, DELETE für Löschen), was für API-Consumer vertraut ist.
- **Sicherheit**: Jeder Endpoint hat die richtige RBAC-Middleware, um sicherzustellen, dass nur autorisierte User zugreifen können.
- **Separation**: Öffentliche Endpoints (GET) sind für alle zugänglich, während schreibende Operationen (POST, PUT, DELETE) geschützt sind.
- **Organizer-Check**: Die Logik "Nur der Organizer kann sein Event bearbeiten" wird hier implementiert, zusätzlich zur Admin-Ausnahme.

**Neue Datei**: `packages/api/src/adapters/http/routes/eventRoutes.ts`

**Endpoints**:
- `GET /api/events` - Liste aller Events (öffentlich)
- `GET /api/events/:id` - Event-Details (öffentlich)
- `POST /api/events` - Event erstellen (EVENT_MANAGER oder ADMIN)
- `PUT /api/events/:id` - Event aktualisieren (nur Organizer oder ADMIN)
- `DELETE /api/events/:id` - Event löschen (nur Organizer oder ADMIN)

**RBAC-Implementierung**:
- `POST /api/events`: `requireRole(['EVENT_MANAGER', 'ADMIN'])`
- `PUT /api/events/:id`: Organizer-Check + Admin-Check
- `DELETE /api/events/:id`: Organizer-Check + Admin-Check

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. API Server starten
pnpm dev

# 3. Endpoints testen (in separatem Terminal):

# GET /api/events (öffentlich, sollte funktionieren)
curl http://localhost:3001/api/events
# Erwartet: 200 OK mit Events-Array

# GET /api/events/:id (öffentlich)
curl http://localhost:3001/api/events/<EVENT_ID>
# Erwartet: 200 OK mit Event-Details

# POST /api/events (nur EVENT_MANAGER/ADMIN)
curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","startDate":"2025-01-01T00:00:00Z"}'
# Erwartet: 403 Forbidden

curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <EVENT_MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test","startDate":"2025-01-01T00:00:00Z"}'
# Erwartet: 201 Created

# PUT /api/events/:id (nur Organizer oder ADMIN)
curl -X PUT http://localhost:3001/api/events/<EVENT_ID> \
  -H "Authorization: Bearer <OTHER_USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'
# Erwartet: 403 Forbidden (nicht der Organizer)

curl -X PUT http://localhost:3001/api/events/<EVENT_ID> \
  -H "Authorization: Bearer <ORGANIZER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'
# Erwartet: 200 OK

# DELETE /api/events/:id (nur Organizer oder ADMIN)
curl -X DELETE http://localhost:3001/api/events/<EVENT_ID> \
  -H "Authorization: Bearer <OTHER_USER_TOKEN>"
# Erwartet: 403 Forbidden

curl -X DELETE http://localhost:3001/api/events/<EVENT_ID> \
  -H "Authorization: Bearer <ORGANIZER_TOKEN>"
# Erwartet: 200 OK
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ GET-Endpoints sind öffentlich zugänglich
- ✅ POST-Endpoint gibt 403 für USER zurück
- ✅ POST-Endpoint akzeptiert EVENT_MANAGER und ADMIN
- ✅ PUT-Endpoint akzeptiert nur Organizer oder ADMIN
- ✅ DELETE-Endpoint akzeptiert nur Organizer oder ADMIN
- ✅ Alle Endpoints geben korrekte HTTP-Status-Codes zurück

**Dauer**: ~2 Stunden

---

### 2.5 Admin Routes erstellen

**Was**: Wir erstellen spezielle Admin-Endpoints für User-Management, Statistiken und Plattform-Verwaltung.

**Warum**:
- **Admin-Funktionalität**: Admins benötigen spezielle Endpoints, die normale User nicht sehen sollten (z.B. User-Rolle ändern, User löschen).
- **Sicherheit**: Alle Admin-Routes sind mit `requireRole(['ADMIN'])` geschützt, um sicherzustellen, dass nur Admins zugreifen können.
- **Separation**: Admin-Routes sind in einem separaten Router (`/api/admin/*`), was die Struktur klar hält.
- **Plattform-Management**: Statistiken und Übersichten helfen Admins, die Plattform zu verwalten und zu überwachen.

**Neue Datei**: `packages/api/src/adapters/http/routes/adminRoutes.ts`

**Endpoints**:
- `GET /api/admin/users` - Alle User auflisten (ADMIN)
- `GET /api/admin/users/:id` - User-Details (ADMIN)
- `PUT /api/admin/users/:id/role` - User-Rolle ändern (ADMIN)
- `DELETE /api/admin/users/:id` - User löschen (ADMIN)
- `GET /api/admin/stats` - Plattform-Statistiken (ADMIN)
- `GET /api/admin/listings` - Alle Listings (ADMIN)
- `GET /api/admin/events` - Alle Events (ADMIN)

**RBAC-Implementierung**:
- Alle Routes: `requireRole(['ADMIN'])`

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. API Server starten
pnpm dev

# 3. Admin-Endpoints testen (in separatem Terminal):

# GET /api/admin/users (nur ADMIN)
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <USER_TOKEN>"
# Erwartet: 403 Forbidden

curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# Erwartet: 200 OK mit User-Liste

# PUT /api/admin/users/:id/role (nur ADMIN)
curl -X PUT http://localhost:3001/api/admin/users/<USER_ID>/role \
  -H "Authorization: Bearer <EVENT_MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"EVENT_MANAGER"}'
# Erwartet: 403 Forbidden

curl -X PUT http://localhost:3001/api/admin/users/<USER_ID>/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"EVENT_MANAGER"}'
# Erwartet: 200 OK, User-Rolle geändert

# GET /api/admin/stats (nur ADMIN)
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# Erwartet: 200 OK mit Statistiken

# DELETE /api/admin/users/:id (nur ADMIN)
curl -X DELETE http://localhost:3001/api/admin/users/<USER_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# Erwartet: 200 OK, User gelöscht (Soft Delete)
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Alle Admin-Endpoints geben 403 für Nicht-Admin zurück
- ✅ Alle Admin-Endpoints akzeptieren nur ADMIN-Token
- ✅ User-Rolle kann geändert werden (nur durch Admin)
- ✅ Statistiken werden zurückgegeben
- ✅ User kann gelöscht werden (Soft Delete)

**Dauer**: ~2 Stunden

---

### 2.6 Validation Schemas

**Was**: Wir erstellen Zod-Schemas für Event-Validierung und erweitern die User-Schemas um Rollen-Validierung.

**Warum**:
- **Input Validation**: Zod-Schemas validieren alle Eingaben, bevor sie in die Use Cases gelangen. Dies verhindert ungültige Daten in der Datenbank.
- **Type Safety**: Zod-Schemas generieren TypeScript-Types, die für Type-Safety sorgen.
- **Security**: Validierung verhindert Injection-Angriffe und ungültige Datenstrukturen.
- **Developer Experience**: Fehler werden früh erkannt und klar gemeldet, nicht erst zur Laufzeit.

**Neue Datei**: `packages/api/src/domain/validation/eventSchemas.ts`

**Schemas**:
- `createEventSchema` (Zod)
- `updateEventSchema` (Zod)
- `eventParamsSchema` (Zod)

**Datei erweitern**: `packages/api/src/domain/validation/userSchemas.ts`
- `updateUserRoleSchema` hinzufügen

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. Validation-Tests schreiben
pnpm test -- eventSchemas.test.ts
pnpm test -- userSchemas.test.ts

# 3. Manuell testen: Ungültige Daten sollten abgelehnt werden
curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <EVENT_MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":""}'  # Leerer Titel
# Erwartet: 400 Bad Request mit Validierungsfehler

curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <EVENT_MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'  # Fehlendes startDate
# Erwartet: 400 Bad Request mit Validierungsfehler

curl -X PUT http://localhost:3001/api/admin/users/<USER_ID>/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"INVALID_ROLE"}'
# Erwartet: 400 Bad Request mit Validierungsfehler
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Validation-Tests bestehen
- ✅ Ungültige Event-Daten werden abgelehnt (400 Bad Request)
- ✅ Ungültige Rollen werden abgelehnt (400 Bad Request)
- ✅ Validierungsfehler enthalten klare Fehlermeldungen

**Dauer**: ~1 Stunde

---

### 2.7 App Integration

**Was**: Wir registrieren die neuen Event- und Admin-Routes in der Express-App und fügen die notwendigen Dependencies hinzu.

**Warum**:
- **Route Registration**: Express muss wissen, welche Routes verfügbar sind. Ohne Registrierung sind die Endpoints nicht erreichbar.
- **Dependency Injection**: Die Use Cases werden als Dependencies übergeben, was Testbarkeit und Flexibilität ermöglicht.
- **Middleware Order**: Die Reihenfolge der Middleware ist wichtig (z.B. Rate Limiting vor Routes, Error Handler nach Routes).

**Datei**: `packages/api/src/adapters/http/app.ts`

**Änderungen**:
1. Event Routes registrieren
2. Admin Routes registrieren
3. Dependencies für Event-UseCases hinzufügen

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/api
pnpm build

# 2. API Server starten und prüfen, dass alle Routes registriert sind
pnpm dev

# 3. Routes prüfen (in separatem Terminal):
curl http://localhost:3001/api/events
# Erwartet: 200 OK (Route existiert)

curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
# Erwartet: 200 OK (Route existiert)

# 4. Prüfen, dass keine Route-Fehler in der Konsole erscheinen
#    (z.B. "Route not found" oder Middleware-Fehler)

# 5. Health Check sollte weiterhin funktionieren
curl http://localhost:3001/health
# Erwartet: 200 OK
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ API Server startet ohne Fehler
- ✅ Event-Routes sind unter `/api/events` erreichbar
- ✅ Admin-Routes sind unter `/api/admin/*` erreichbar
- ✅ Bestehende Routes funktionieren weiterhin
- ✅ Keine Route-Konflikte oder Middleware-Fehler

**Dauer**: ~30 Minuten

---

## Phase 3: Frontend - API Client & Hooks

**Was**: Diese Phase implementiert die Frontend-API-Integration. Wir erstellen API-Clients für Events und Admin-Funktionalitäten und erweitern den Auth Context um Rollen-Helper.

**Warum**:
- **API-Abstraktion**: API-Clients kapseln die HTTP-Logik (URLs, Headers, Error Handling) und bieten eine saubere TypeScript-API für Komponenten.
- **Type Safety**: Die API-Clients verwenden die Types aus `@sharelocal/shared`, was Type-Safety über Frontend und Backend gewährleistet.
- **Wiederverwendbarkeit**: Komponenten können die API-Clients verwenden, ohne sich um HTTP-Details kümmern zu müssen.
- **Auth Context**: Der erweiterte Auth Context macht Rollen-Informationen überall im Frontend verfügbar.

---

### 3.1 API Client erweitern

**Was**: Wir erstellen neue API-Client-Module für Events und Admin-Funktionalitäten mit allen CRUD-Operationen.

**Warum**:
- **Separation of Concerns**: API-Logik ist getrennt von UI-Komponenten, was Wartbarkeit verbessert.
- **Error Handling**: Zentrale Fehlerbehandlung in den API-Clients (z.B. 403 Forbidden für fehlende Berechtigungen).
- **Consistency**: Alle API-Calls folgen dem gleichen Pattern (z.B. `apiClient.get()`, `apiClient.post()`).
- **Testing**: API-Clients können mit Mock-Implementierungen getestet werden.

**Datei**: `packages/web/lib/api/events.ts` (neu)
- `getAllEvents()`
- `getEvent(id)`
- `createEvent(data)`
- `updateEvent(id, data)`
- `deleteEvent(id)`

**Datei**: `packages/web/lib/api/admin.ts` (neu)
- `getAllUsers()`
- `getUser(id)`
- `updateUserRole(id, role)`
- `deleteUser(id)`
- `getAdminStats()`

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/web
pnpm build

# 2. Types prüfen: API-Clients sollten korrekte Types haben
#    (IDE sollte Autocomplete für Event und Admin-Funktionen zeigen)

# 3. Manuell testen in Browser Console (nach Login):
import { getAllEvents, createEvent } from '@/lib/api/events';
import { getAllUsers, updateUserRole } from '@/lib/api/admin';

// Events API sollte verfügbar sein
console.log(typeof getAllEvents); // "function"

// Admin API sollte verfügbar sein
console.log(typeof getAllUsers); // "function"

# 4. API-Calls sollten korrekte Types zurückgeben
const events = await getAllEvents();
// events sollte Event[] Type haben

# 5. Fehlerbehandlung testen (403 Forbidden sollte korrekt behandelt werden)
try {
  await createEvent({...}); // Als USER
} catch (error) {
  // Sollte 403 Fehler korrekt behandeln
}
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ API-Clients haben korrekte Types (keine `any` Types)
- ✅ Autocomplete funktioniert in IDE
- ✅ API-Calls geben korrekt typisierte Responses zurück
- ✅ Fehlerbehandlung funktioniert (403, 404, etc.)

**Dauer**: ~1 Stunde

---

### 3.2 Auth Context erweitern

**Was**: Wir erweitern den Auth Context um Helper-Methoden für Rollenprüfung (`isAdmin()`, `isEventManager()`, `canManageEvents()`).

**Warum**:
- **UX**: Komponenten können basierend auf der User-Rolle UI-Elemente anzeigen/verstecken (z.B. "Event erstellen" Button nur für Event Manager).
- **Konsistenz**: Die gleichen Helper-Methoden wie im Backend (`User.canManageEvents()`) werden im Frontend verwendet.
- **React Context**: Der Auth Context macht User-Informationen überall verfügbar, ohne Props durch die Komponenten-Hierarchie zu reichen.
- **Performance**: Die Rollen-Informationen werden nur einmal geladen und im Context gespeichert.

**Datei**: `packages/web/lib/auth/AuthContext.tsx`

**Änderungen**:
- Helper-Methoden hinzufügen:
  ```typescript
  isAdmin(): boolean
  isEventManager(): boolean
  canManageEvents(): boolean
  ```

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/web
pnpm build

# 2. In Browser Console testen (nach Login):
import { useAuth } from '@/lib/auth/AuthContext';

// In React-Komponente:
const { user, isAdmin, isEventManager, canManageEvents } = useAuth();

console.log('isAdmin:', isAdmin()); // true/false basierend auf Rolle
console.log('isEventManager:', isEventManager()); // true für EVENT_MANAGER oder ADMIN
console.log('canManageEvents:', canManageEvents()); // true für EVENT_MANAGER oder ADMIN

# 3. Testen mit verschiedenen Rollen:
#    - Als USER: isAdmin() = false, canManageEvents() = false
#    - Als EVENT_MANAGER: isAdmin() = false, canManageEvents() = true
#    - Als ADMIN: isAdmin() = true, canManageEvents() = true

# 4. Prüfen, dass user.role korrekt gesetzt ist
console.log('User role:', user?.role); // Sollte 'USER' | 'EVENT_MANAGER' | 'ADMIN' sein
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ `isAdmin()` gibt `true` nur für ADMIN zurück
- ✅ `isEventManager()` gibt `true` für EVENT_MANAGER und ADMIN zurück
- ✅ `canManageEvents()` gibt `true` für EVENT_MANAGER und ADMIN zurück
- ✅ `user.role` ist korrekt gesetzt nach Login

**Dauer**: ~30 Minuten

---

## Phase 4: Frontend - UI Komponenten

**Was**: Diese Phase implementiert alle UI-Komponenten für Event-Management und Admin-Panel, sowie die entsprechenden Next.js Seiten.

**Warum**:
- **User Experience**: Nutzer benötigen eine intuitive UI, um Events zu erstellen, anzuzeigen und zu verwalten.
- **Admin-Tools**: Admins benötigen ein Dashboard, um die Plattform zu verwalten (User-Management, Statistiken).
- **Konsistenz**: Komponenten verwenden das bestehende Design-System (shadcn/ui), was für einheitliches UI sorgt.
- **Next.js App Router**: Die Seiten folgen dem Next.js 16 App Router Pattern, was Server Components und optimale Performance ermöglicht.

---

### 4.1 Event-Management Komponenten

**Was**: Wir erstellen wiederverwendbare React-Komponenten für Event-Anzeige, -Erstellung und -Bearbeitung.

**Warum**:
- **Wiederverwendbarkeit**: Komponenten wie `EventCard` können in verschiedenen Kontexten verwendet werden (Event-Liste, Dashboard, etc.).
- **Separation**: Jede Komponente hat eine klare Verantwortlichkeit (z.B. `EventForm` nur für Formular-Logik).
- **Type Safety**: Komponenten verwenden die Types aus `@sharelocal/shared`, was Type-Safety gewährleistet.
- **Accessibility**: Komponenten sollten WCAG-Standards folgen (z.B. ARIA-Labels, Keyboard-Navigation).

**Neue Komponenten**:
- `packages/web/components/events/EventList.tsx` - Event-Liste
- `packages/web/components/events/EventCard.tsx` - Event-Card
- `packages/web/components/events/EventForm.tsx` - Event-Formular (Create/Edit)
- `packages/web/components/events/EventDetail.tsx` - Event-Details

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/web
pnpm build

# 2. Next.js Dev Server starten
pnpm dev

# 3. Manuell im Browser testen:
#    - Navigiere zu /events
#    - Event-Liste sollte angezeigt werden
#    - Event-Cards sollten korrekt gerendert werden
#    - Klick auf Event sollte zu Event-Details führen
#    - Event-Details sollten alle Informationen anzeigen

# 4. Als EVENT_MANAGER/ADMIN testen:
#    - "Event erstellen" Button sollte sichtbar sein
#    - Event-Formular sollte funktionieren
#    - Event kann erstellt werden

# 5. Als USER testen:
#    - "Event erstellen" Button sollte NICHT sichtbar sein
#    - Event-Details sollten lesbar sein

# 6. Browser Console prüfen:
#    - Keine React-Warnings oder Fehler
#    - Keine TypeScript-Fehler
#    - API-Calls sollten erfolgreich sein (200 OK)
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Next.js Dev Server startet ohne Fehler
- ✅ Event-Liste wird korrekt angezeigt
- ✅ Event-Details werden korrekt angezeigt
- ✅ Event-Formular funktioniert (für EVENT_MANAGER/ADMIN)
- ✅ Rollenbasierte UI funktioniert (Buttons nur für berechtigte User)
- ✅ Keine Console-Fehler oder Warnings

**Dauer**: ~4 Stunden

---

### 4.2 Admin Panel Komponenten

**Was**: Wir erstellen Admin-spezifische Komponenten für User-Management, Statistiken und Plattform-Übersicht.

**Warum**:
- **Admin-Workflow**: Admins benötigen spezielle Tools, die normale User nicht sehen sollten (z.B. User-Rolle ändern, User löschen).
- **Data Visualization**: Statistiken helfen Admins, die Plattform zu überwachen und Entscheidungen zu treffen.
- **Efficiency**: Tabellen und Filter ermöglichen es Admins, schnell große Datenmengen zu durchsuchen.
- **Security**: Komponenten sollten nur für Admins sichtbar sein (via `useAuth().isAdmin()` Check).

**Neue Komponenten**:
- `packages/web/components/admin/AdminDashboard.tsx` - Admin Dashboard
- `packages/web/components/admin/UserManagement.tsx` - User-Verwaltung
- `packages/web/components/admin/UserTable.tsx` - User-Tabelle
- `packages/web/components/admin/UserRoleSelector.tsx` - Rollen-Auswahl
- `packages/web/components/admin/AdminStats.tsx` - Statistiken

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/web
pnpm build

# 2. Next.js Dev Server starten
pnpm dev

# 3. Als ADMIN im Browser testen:
#    - Navigiere zu /admin
#    - Admin-Dashboard sollte angezeigt werden
#    - User-Management sollte verfügbar sein
#    - User-Tabelle sollte alle User anzeigen
#    - Rollen-Auswahl sollte funktionieren
#    - Statistiken sollten angezeigt werden

# 4. Als USER testen:
#    - /admin sollte nicht zugänglich sein (Redirect oder 403)
#    - Admin-Link sollte NICHT in Navigation sichtbar sein

# 5. User-Rolle ändern testen:
#    - Als ADMIN: User-Rolle ändern
#    - Prüfen, dass Änderung in Datenbank gespeichert wird
#    - Prüfen, dass UI aktualisiert wird

# 6. Browser Console prüfen:
#    - Keine React-Warnings oder Fehler
#    - API-Calls sollten erfolgreich sein
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Admin-Dashboard ist nur für ADMIN zugänglich
- ✅ User-Management funktioniert (Rolle ändern, User löschen)
- ✅ Statistiken werden korrekt angezeigt
- ✅ Rollenbasierte Navigation funktioniert (Admin-Link nur für ADMIN)
- ✅ Keine Console-Fehler oder Warnings

**Dauer**: ~4 Stunden

---

### 4.3 Navigation & Layout

**Was**: Wir erweitern die Navigation um rollenbasierte Links und erstellen die Next.js Seiten für Events und Admin.

**Warum**:
- **Navigation**: Nutzer müssen einfach zu Events und Admin-Bereichen navigieren können.
- **Rollenbasierte UI**: Links sollten nur angezeigt werden, wenn der User die entsprechende Rolle hat (z.B. Admin-Link nur für Admins).
- **Next.js Pages**: Die Seiten folgen dem App Router Pattern, was Server Components und optimale Performance ermöglicht.
- **Routing**: Next.js Dynamic Routes (`[id]`) ermöglichen es, Event-Details und Bearbeitungsseiten zu erstellen.

**Datei**: `packages/web/components/layout/Navigation.tsx`

**Änderungen**:
- Admin-Link hinzufügen (nur für ADMIN)
- Events-Link hinzufügen (für alle)
- "Event erstellen" Button (nur für EVENT_MANAGER/ADMIN)

**Neue Seiten**:
- `packages/web/app/admin/page.tsx` - Admin Dashboard
- `packages/web/app/admin/users/page.tsx` - User-Verwaltung
- `packages/web/app/events/page.tsx` - Event-Liste
- `packages/web/app/events/new/page.tsx` - Event erstellen
- `packages/web/app/events/[id]/page.tsx` - Event-Details
- `packages/web/app/events/[id]/edit/page.tsx` - Event bearbeiten

**Verifizierung**:
```bash
# 1. TypeScript-Kompilierung prüfen
cd packages/web
pnpm build

# 2. Next.js Dev Server starten
pnpm dev

# 3. Navigation testen:
#    - Events-Link sollte für alle sichtbar sein
#    - Admin-Link sollte nur für ADMIN sichtbar sein
#    - "Event erstellen" Button sollte nur für EVENT_MANAGER/ADMIN sichtbar sein

# 4. Routing testen:
#    - /events → Event-Liste
#    - /events/new → Event erstellen (nur EVENT_MANAGER/ADMIN)
#    - /events/[id] → Event-Details
#    - /events/[id]/edit → Event bearbeiten (nur Organizer/ADMIN)
#    - /admin → Admin-Dashboard (nur ADMIN)
#    - /admin/users → User-Management (nur ADMIN)

# 5. Rollenbasierte Redirects testen:
#    - USER versucht /events/new → sollte zu Login oder Homepage redirecten
#    - USER versucht /admin → sollte zu Login oder Homepage redirecten

# 6. Browser Console prüfen:
#    - Keine Routing-Fehler
#    - Keine 404-Fehler für existierende Routes
```

**Erwartete Ergebnisse**:
- ✅ TypeScript-Kompilierung erfolgreich
- ✅ Alle Routes sind korrekt konfiguriert
- ✅ Navigation zeigt/versteckt Links basierend auf Rolle
- ✅ Rollenbasierte Redirects funktionieren
- ✅ Keine Routing-Fehler oder 404s

**Dauer**: ~2 Stunden

---

## Phase 5: Testing

**Was**: Diese Phase implementiert umfassende Tests für RBAC, Events und Admin-Funktionalitäten auf Backend- und Frontend-Seite.

**Warum**:
- **Sicherheit**: Tests stellen sicher, dass RBAC korrekt funktioniert und keine Sicherheitslücken bestehen.
- **Regression Prevention**: Tests verhindern, dass neue Features bestehende Funktionalität brechen.
- **Documentation**: Tests dienen als lebendige Dokumentation, die zeigt, wie die Features verwendet werden sollen.
- **Confidence**: Mit Tests können wir sicher refactoren und neue Features hinzufügen, ohne Angst vor Breaking Changes zu haben.

---

### 5.1 Backend Tests

**Was**: Wir erstellen Unit-Tests für RBAC-Middleware und Integration-Tests für Event- und Admin-Endpoints.

**Warum**:
- **RBAC-Tests**: Unit-Tests für Middleware stellen sicher, dass Rollenprüfung korrekt funktioniert (z.B. 403 Forbidden für falsche Rolle).
- **Integration-Tests**: End-to-End Tests für Endpoints stellen sicher, dass die gesamte Kette (Route → Middleware → Use Case → Repository) funktioniert.
- **Edge Cases**: Tests sollten Edge Cases abdecken (z.B. User versucht fremdes Event zu bearbeiten, Admin kann alles).
- **Test Coverage**: Ziel ist 70%+ Coverage für kritische Komponenten (siehe `.cursorrules`).

**Neue Test-Dateien**:
- `packages/api/src/__tests__/unit/middleware/rbac.test.ts`
- `packages/api/src/__tests__/integration/events.test.ts`
- `packages/api/src/__tests__/integration/admin.test.ts`

**Erweiterte Tests**:
- `packages/api/src/__tests__/integration/auth.test.ts` - Rollenprüfung testen

**Verifizierung**:
```bash
# 1. Alle Tests ausführen
cd packages/api
pnpm test

# 2. Spezifische Test-Suites ausführen:
pnpm test -- rbac.test.ts
pnpm test -- events.test.ts
pnpm test -- admin.test.ts

# 3. Test-Coverage prüfen (sollte 70%+ für kritische Komponenten sein)
pnpm test -- --coverage

# 4. Integration-Tests sollten folgende Szenarien abdecken:
#    - RBAC: USER kann nicht auf EVENT_MANAGER-Routes zugreifen
#    - RBAC: EVENT_MANAGER kann Events erstellen
#    - RBAC: ADMIN kann alles
#    - Events: Organizer kann sein Event bearbeiten
#    - Events: Andere User können fremde Events nicht bearbeiten
#    - Admin: Nur ADMIN kann User-Rolle ändern
#    - Admin: Nur ADMIN kann User löschen

# 5. Edge Cases testen:
#    - Gelöschter User versucht zu authentifizieren
#    - User mit geänderter Rolle (Token noch alt)
#    - Event-Organizer wird gelöscht
```

**Erwartete Ergebnisse**:
- ✅ Alle Tests bestehen (100% Pass-Rate)
- ✅ Test-Coverage ist 70%+ für kritische Komponenten
- ✅ RBAC-Tests decken alle Rollen-Kombinationen ab
- ✅ Event-Tests decken alle CRUD-Operationen ab
- ✅ Admin-Tests decken alle Admin-Funktionen ab
- ✅ Edge Cases sind abgedeckt

**Dauer**: ~3 Stunden

---

### 5.2 Frontend Tests

**Was**: Wir erstellen E2E-Tests mit Playwright für Event-Management und Admin-Funktionalitäten.

**Warum**:
- **User Flows**: E2E-Tests simulieren echte User-Interaktionen (z.B. Login → Event erstellen → Event bearbeiten).
- **Cross-Browser**: Playwright testet in verschiedenen Browsern, was Browser-spezifische Bugs findet.
- **Visual Regression**: Playwright kann Screenshots vergleichen, um visuelle Regressionen zu finden.
- **CI/CD**: E2E-Tests laufen in CI/CD, um sicherzustellen, dass Features nach Deployment funktionieren.

**E2E Tests**:
- `packages/web/e2e/admin.spec.ts` - Admin-Funktionalitäten
- `packages/web/e2e/events.spec.ts` - Event-Management

**Verifizierung**:
```bash
# 1. E2E-Tests ausführen
cd packages/web
pnpm test:e2e

# 2. Spezifische Test-Suites ausführen:
pnpm test:e2e -- admin.spec.ts
pnpm test:e2e -- events.spec.ts

# 3. Tests sollten folgende User-Flows abdecken:

# Admin-Flow:
#    - Login als ADMIN
#    - Navigiere zu /admin
#    - Siehe User-Liste
#    - Ändere User-Rolle
#    - Prüfe, dass Änderung gespeichert wurde
#    - Siehe Statistiken

# Event-Manager-Flow:
#    - Login als EVENT_MANAGER
#    - Navigiere zu /events
#    - Klicke "Event erstellen"
#    - Fülle Event-Formular aus
#    - Erstelle Event
#    - Prüfe, dass Event in Liste erscheint
#    - Bearbeite Event
#    - Prüfe, dass Änderung gespeichert wurde

# User-Flow:
#    - Login als USER
#    - Navigiere zu /events
#    - Prüfe, dass "Event erstellen" Button NICHT sichtbar ist
#    - Versuche /events/new zu öffnen → sollte redirecten
#    - Versuche /admin zu öffnen → sollte redirecten

# 4. Visual Regression Tests (optional):
#    - Screenshots vergleichen
#    - UI sollte konsistent sein
```

**Erwartete Ergebnisse**:
- ✅ Alle E2E-Tests bestehen
- ✅ Admin-Flow funktioniert komplett
- ✅ Event-Manager-Flow funktioniert komplett
- ✅ User-Flow zeigt korrekte Einschränkungen
- ✅ Rollenbasierte UI funktioniert korrekt
- ✅ Keine flaky Tests (Tests sollten konsistent sein)

**Dauer**: ~2 Stunden

---

## Phase 6: Dokumentation & Migration

**Was**: Diese Phase aktualisiert Seed-Daten für Tests und Development und dokumentiert alle neuen Features.

**Warum**:
- **Development**: Seed-Daten ermöglichen es Entwicklern, schnell mit Test-Daten zu arbeiten, ohne manuell Daten erstellen zu müssen.
- **Testing**: Seed-Daten werden auch in Tests verwendet, um konsistente Test-Umgebungen zu haben.
- **Documentation**: Dokumentation hilft neuen Entwicklern, die Features zu verstehen und zu verwenden.
- **Maintenance**: Gute Dokumentation erleichtert Wartung und Erweiterungen.

---

### 6.1 Seed-Daten aktualisieren

**Was**: Wir erweitern das Seed-Script um Test-User mit `EVENT_MANAGER` Rolle und Test-Events.

**Warum**:
- **Development**: Entwickler können sofort mit Events arbeiten, ohne sie manuell zu erstellen.
- **Testing**: Tests können auf konsistenten Seed-Daten basieren, was Tests reproduzierbar macht.
- **Demo**: Seed-Daten ermöglichen es, die Features schnell zu demonstrieren.
- **Consistency**: Alle Entwickler haben die gleichen Test-Daten, was Bugs leichter reproduzierbar macht.

**Datei**: `packages/database/prisma/seed.ts`

**Änderungen**:
- Test-User mit `EVENT_MANAGER` Rolle erstellen
- Test-Events erstellen

**Verifizierung**:
```bash
# 1. Seed-Daten ausführen
cd packages/database
pnpm db:seed

# 2. Prisma Studio öffnen und prüfen:
pnpm db:studio

# 3. In Prisma Studio prüfen:
#    - Mindestens 1 User mit EVENT_MANAGER Rolle existiert
#    - Mindestens 1 User mit ADMIN Rolle existiert
#    - Mindestens 3 Test-Events existieren
#    - Events haben verschiedene Organizer (EVENT_MANAGER und ADMIN)
#    - Events haben verschiedene Start-Daten

# 4. Test-User-Credentials dokumentieren:
#    - EVENT_MANAGER: email=?, password=?
#    - ADMIN: email=?, password=?
#    (Diese sollten in README oder Test-Dokumentation stehen)

# 5. Manuell testen: Login mit Test-User
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eventmanager@test.com","password":"test123"}'
# Sollte Token und User mit EVENT_MANAGER Rolle zurückgeben
```

**Erwartete Ergebnisse**:
- ✅ Seed-Script läuft ohne Fehler
- ✅ Test-User mit EVENT_MANAGER Rolle existiert
- ✅ Test-User mit ADMIN Rolle existiert
- ✅ Test-Events existieren mit verschiedenen Organizern
- ✅ Login mit Test-Usern funktioniert
- ✅ Test-User haben korrekte Rollen

**Dauer**: ~30 Minuten

---

### 6.2 Dokumentation aktualisieren

**Was**: Wir dokumentieren alle neuen Endpoints, Models und Features in den entsprechenden README-Dateien und AGENTS.md.

**Warum**:
- **API-Dokumentation**: Entwickler müssen wissen, welche Endpoints verfügbar sind und wie sie verwendet werden.
- **Schema-Dokumentation**: Das Events-Model sollte dokumentiert sein, damit Entwickler verstehen, welche Felder verfügbar sind.
- **AI Agents**: AGENTS.md hilft AI Coding Agents, die richtigen Entscheidungen zu treffen (z.B. welche Rolle für welche Funktion benötigt wird).
- **Onboarding**: Neue Entwickler können schneller produktiv werden, wenn die Dokumentation vollständig ist.

**Dateien**:
- `packages/api/README.md` - Admin & Event Endpoints dokumentieren
- `packages/database/README.md` - Events-Model dokumentieren
- `AGENTS.md` - RBAC-Regeln dokumentieren

**Verifizierung**:
```bash
# 1. Dokumentation lesen und prüfen:

# packages/api/README.md:
#    - Event-Endpoints sind dokumentiert mit Beispielen
#    - Admin-Endpoints sind dokumentiert mit Beispielen
#    - RBAC-Regeln sind erklärt
#    - Authentifizierung ist dokumentiert

# packages/database/README.md:
#    - Events-Model ist dokumentiert
#    - UserRole Enum ist dokumentiert
#    - Relations sind erklärt

# AGENTS.md:
#    - RBAC-Regeln sind dokumentiert
#    - Rollen-Matrix ist vorhanden
#    - Best Practices für Rollenprüfung sind erklärt

# 2. Dokumentation sollte folgende Informationen enthalten:
#    - Welche Rollen existieren
#    - Welche Funktionen jede Rolle hat
#    - Wie man Rollen in Code prüft
#    - Beispiele für API-Calls mit verschiedenen Rollen
#    - Test-User-Credentials

# 3. Prüfen, dass Dokumentation aktuell ist:
#    - Alle neuen Endpoints sind dokumentiert
#    - Keine veralteten Informationen
#    - Code-Beispiele funktionieren noch
```

**Erwartete Ergebnisse**:
- ✅ API-Dokumentation ist vollständig und aktuell
- ✅ Database-Dokumentation erklärt Events-Model
- ✅ AGENTS.md enthält RBAC-Regeln
- ✅ Code-Beispiele funktionieren
- ✅ Test-User-Credentials sind dokumentiert
- ✅ Dokumentation ist für neue Entwickler verständlich

**Dauer**: ~1 Stunde

---

## Implementierungsreihenfolge (Empfohlen)

### Sprint 1: Foundation (Backend)

**Was**: Dieser Sprint legt die Grundlage für RBAC und Events. Wir erweitern das Datenmodell, aktualisieren Types und implementieren die RBAC-Middleware.

**Warum**:
- **Foundation First**: Bevor wir Features implementieren, müssen wir sicherstellen, dass die Datenstruktur und die Sicherheits-Infrastruktur vorhanden sind.
- **Dependencies**: Alle späteren Sprints bauen auf dieser Foundation auf. Ohne RBAC-Middleware können wir keine geschützten Routes erstellen.
- **Type Safety**: Durch frühe Type-Updates vermeiden wir TypeScript-Fehler in späteren Sprints.
- **Incremental**: Dieser Sprint ist selbstständig und kann getestet werden, ohne dass andere Features vorhanden sein müssen.

**Aufgaben**:
1. ✅ Phase 1.1: Prisma Schema erweitern
2. ✅ Phase 1.2: Shared Types aktualisieren
3. ✅ Phase 1.3: Domain Entity erweitern
4. ✅ Phase 2.1: RBAC Middleware erstellen
5. ✅ Phase 2.2: Auth Middleware erweitern

**Geschätzte Dauer**: 1-2 Tage

---

### Sprint 2: Events Backend

**Was**: Dieser Sprint implementiert die komplette Backend-Funktionalität für Events, inklusive Repository, Use Cases, Routes und Validierung.

**Warum**:
- **Complete Feature**: Events sind ein vollständiges Feature, das unabhängig von Admin-Funktionalitäten implementiert werden kann.
- **API First**: Das Backend wird zuerst implementiert, damit das Frontend später eine stabile API verwenden kann.
- **RBAC Integration**: Dieser Sprint nutzt die RBAC-Middleware aus Sprint 1, um Events zu schützen.
- **Testability**: Backend-Features können mit Integration-Tests getestet werden, ohne Frontend.

**Aufgaben**:
1. ✅ Phase 2.3: Event Repository & Use Cases
2. ✅ Phase 2.4: Event Routes erstellen
3. ✅ Phase 2.6: Validation Schemas
4. ✅ Phase 2.7: App Integration

**Geschätzte Dauer**: 1-2 Tage

---

### Sprint 3: Admin Backend

**Was**: Dieser Sprint implementiert die Admin-Routes und umfassende Backend-Tests für Events und Admin-Funktionalitäten.

**Warum**:
- **Admin Features**: Admin-Funktionalitäten sind kritisch für Plattform-Management und sollten früh implementiert werden.
- **Testing**: Backend-Tests stellen sicher, dass RBAC korrekt funktioniert und keine Sicherheitslücken bestehen.
- **Quality Assurance**: Tests geben uns Vertrauen, dass die Features korrekt funktionieren, bevor wir das Frontend implementieren.
- **Documentation**: Tests dienen als Dokumentation für die erwartete Funktionalität.

**Aufgaben**:
1. ✅ Phase 2.5: Admin Routes erstellen
2. ✅ Phase 5.1: Backend Tests (Events & Admin)

**Geschätzte Dauer**: 1 Tag

---

### Sprint 4: Frontend Foundation

**Was**: Dieser Sprint implementiert die Frontend-Infrastruktur: API-Clients, erweiterten Auth Context und grundlegende Navigation.

**Warum**:
- **API Integration**: API-Clients ermöglichen es Frontend-Komponenten, mit dem Backend zu kommunizieren.
- **Auth Context**: Der erweiterte Auth Context macht Rollen-Informationen überall verfügbar, was für rollenbasierte UI notwendig ist.
- **Navigation**: Grundlegende Navigation ermöglicht es Nutzern, zu Events und Admin-Bereichen zu navigieren.
- **Foundation**: Wie Sprint 1 im Backend legt dieser Sprint die Grundlage für alle Frontend-Features.

**Aufgaben**:
1. ✅ Phase 3.1: API Client erweitern
2. ✅ Phase 3.2: Auth Context erweitern
3. ✅ Phase 4.3: Navigation & Layout (Grundstruktur)

**Geschätzte Dauer**: 1 Tag

---

### Sprint 5: Frontend Events

**Was**: Dieser Sprint implementiert alle UI-Komponenten für Event-Management und die entsprechenden E2E-Tests.

**Warum**:
- **User Experience**: Nutzer benötigen eine intuitive UI, um Events zu erstellen, anzuzeigen und zu verwalten.
- **Complete Feature**: Events sind jetzt vollständig implementiert (Backend + Frontend).
- **E2E Tests**: Tests stellen sicher, dass der gesamte User-Flow funktioniert (z.B. Login → Event erstellen → Event bearbeiten).
- **Incremental Value**: Nach diesem Sprint können Nutzer bereits Events verwenden, auch wenn Admin-Features noch fehlen.

**Aufgaben**:
1. ✅ Phase 4.1: Event-Management Komponenten
2. ✅ Phase 5.2: Frontend Tests (Events)

**Geschätzte Dauer**: 1-2 Tage

---

### Sprint 6: Frontend Admin

**Was**: Dieser Sprint implementiert das Admin-Panel, Admin-E2E-Tests, aktualisiert Seed-Daten und vervollständigt die Dokumentation.

**Warum**:
- **Admin Tools**: Admins benötigen ein vollständiges Dashboard für Plattform-Management.
- **Testing**: E2E-Tests für Admin-Features stellen sicher, dass kritische Funktionen (z.B. User-Rolle ändern) korrekt funktionieren.
- **Development**: Seed-Daten ermöglichen es Entwicklern, schnell mit Test-Daten zu arbeiten.
- **Documentation**: Vollständige Dokumentation hilft neuen Entwicklern und dient als Referenz für zukünftige Features.

**Aufgaben**:
1. ✅ Phase 4.2: Admin Panel Komponenten
2. ✅ Phase 5.2: Frontend Tests (Admin)
3. ✅ Phase 6.1: Seed-Daten aktualisieren
4. ✅ Phase 6.2: Dokumentation aktualisieren

**Geschätzte Dauer**: 1-2 Tage

---

## Wichtige Überlegungen

### Sicherheit
- ✅ **Backend-Validierung ist Pflicht**: Frontend-Checks sind nur UX, keine Sicherheit
- ✅ **JWT Token sollte Rolle enthalten**: Optional für Performance (aktuell wird User aus DB geladen)
- ✅ **Rate Limiting**: Admin-Routes sollten strengeres Rate Limiting haben
- ✅ **Audit Logging**: Admin-Aktionen sollten geloggt werden (später)

### Performance
- ✅ **User-Rolle im JWT**: Kann später optimiert werden, um DB-Query zu sparen
- ✅ **Caching**: Event-Liste kann gecacht werden
- ✅ **Pagination**: Alle Listen sollten paginiert sein

### UX
- ✅ **Fehlermeldungen**: Klare Meldungen bei fehlenden Berechtigungen
- ✅ **Redirects**: Bei fehlenden Berechtigungen zu Login/Homepage
- ✅ **Loading States**: Während Rollenprüfung

### Migration
- ✅ **Bestehende User**: Alle bekommen `USER` Rolle (Default)
- ✅ **Admin-User**: Manuell in DB setzen oder via Seed
- ✅ **Backward Compatibility**: Bestehende API-Calls sollten weiterhin funktionieren

---

## Rollen-Matrix

| Funktion | USER | EVENT_MANAGER | ADMIN |
|----------|------|---------------|-------|
| Listings erstellen | ✅ | ✅ | ✅ |
| Events anzeigen | ✅ | ✅ | ✅ |
| Events erstellen | ❌ | ✅ | ✅ |
| Events bearbeiten | ❌ | Nur eigene | ✅ |
| Events löschen | ❌ | Nur eigene | ✅ |
| User-Profile anzeigen | ✅ | ✅ | ✅ |
| User-Profile bearbeiten | Nur eigenes | Nur eigenes | ✅ |
| User-Rolle ändern | ❌ | ❌ | ✅ |
| User löschen | ❌ | ❌ | ✅ |
| Plattform-Statistiken | ❌ | ❌ | ✅ |
| Alle Listings verwalten | ❌ | ❌ | ✅ |

---

## Nächste Schritte

1. **Review dieser Roadmap** mit dem Team
2. **Priorisierung** der Features
3. **Sprint-Planung** starten
4. **Phase 1** implementieren (Datenbank & Domain Layer)

---

## Offene Fragen

- [ ] Soll `EVENT_MANAGER` auch eigene Events löschen können?
- [ ] Sollen Events öffentlich sichtbar sein oder nur für registrierte User?
- [ ] Brauchen wir Event-Kategorien (analog zu Listings)?
- [ ] Sollen Events mit Listings verknüpft werden können?
- [ ] Brauchen wir Event-Registrierungen (Teilnehmer)?

---

---

## Verifizierungs-Checkliste (Gesamtübersicht)

Nach Abschluss aller Phasen sollten folgende Checks durchgeführt werden:

### ✅ Datenbank & Schema
- [ ] Prisma Schema validiert (`pnpm prisma validate`)
- [ ] Migration erfolgreich angewendet (`pnpm prisma migrate status`)
- [ ] Prisma Client generiert ohne Fehler (`pnpm db:generate`)
- [ ] Events-Tabelle existiert in Datenbank
- [ ] UserRole Enum enthält USER, EVENT_MANAGER, ADMIN
- [ ] Test-Daten vorhanden (via `pnpm db:seed`)

### ✅ Backend - TypeScript & Build
- [ ] API Package baut ohne Fehler (`pnpm --filter @sharelocal/api build`)
- [ ] Shared Package baut ohne Fehler (`pnpm --filter @sharelocal/shared build`)
- [ ] Database Package baut ohne Fehler (`pnpm --filter @sharelocal/database build`)
- [ ] Keine TypeScript-Fehler in allen Packages
- [ ] Alle Types sind korrekt (keine `any` Types)

### ✅ Backend - RBAC & Security
- [ ] RBAC Middleware funktioniert (403 für falsche Rolle)
- [ ] Auth Middleware funktioniert (401 für fehlendes Token)
- [ ] Event-Routes sind korrekt geschützt
- [ ] Admin-Routes sind korrekt geschützt (nur ADMIN)
- [ ] Organizer-Check funktioniert (nur Organizer kann Event bearbeiten)

### ✅ Backend - API Endpoints
- [ ] `GET /api/events` - Liste aller Events (öffentlich)
- [ ] `GET /api/events/:id` - Event-Details (öffentlich)
- [ ] `POST /api/events` - Event erstellen (EVENT_MANAGER/ADMIN)
- [ ] `PUT /api/events/:id` - Event aktualisieren (Organizer/ADMIN)
- [ ] `DELETE /api/events/:id` - Event löschen (Organizer/ADMIN)
- [ ] `GET /api/admin/users` - User-Liste (ADMIN)
- [ ] `PUT /api/admin/users/:id/role` - Rolle ändern (ADMIN)
- [ ] `DELETE /api/admin/users/:id` - User löschen (ADMIN)
- [ ] `GET /api/admin/stats` - Statistiken (ADMIN)

### ✅ Backend - Tests
- [ ] Alle Unit-Tests bestehen (`pnpm test`)
- [ ] Alle Integration-Tests bestehen
- [ ] RBAC-Tests bestehen (alle Rollen-Kombinationen)
- [ ] Event-Tests bestehen (CRUD-Operationen)
- [ ] Admin-Tests bestehen (alle Admin-Funktionen)
- [ ] Test-Coverage ist 70%+ für kritische Komponenten

### ✅ Frontend - Build & Types
- [ ] Web Package baut ohne Fehler (`pnpm --filter @sharelocal/web build`)
- [ ] Keine TypeScript-Fehler
- [ ] API-Clients haben korrekte Types
- [ ] Auth Context funktioniert korrekt

### ✅ Frontend - UI & Navigation
- [ ] Event-Liste wird angezeigt
- [ ] Event-Details werden angezeigt
- [ ] Event-Formular funktioniert (für EVENT_MANAGER/ADMIN)
- [ ] Admin-Dashboard ist nur für ADMIN zugänglich
- [ ] User-Management funktioniert (für ADMIN)
- [ ] Rollenbasierte Navigation funktioniert
- [ ] Rollenbasierte UI-Elemente werden korrekt angezeigt/versteckt

### ✅ Frontend - E2E Tests
- [ ] Alle E2E-Tests bestehen (`pnpm test:e2e`)
- [ ] Admin-Flow funktioniert komplett
- [ ] Event-Manager-Flow funktioniert komplett
- [ ] User-Flow zeigt korrekte Einschränkungen
- [ ] Keine flaky Tests

### ✅ Dokumentation
- [ ] API-Dokumentation ist vollständig
- [ ] Database-Dokumentation erklärt Events-Model
- [ ] AGENTS.md enthält RBAC-Regeln
- [ ] Code-Beispiele funktionieren
- [ ] Test-User-Credentials sind dokumentiert

### ✅ Manuelle Tests (Smoke Tests)

**Als USER:**
- [ ] Kann Events anzeigen
- [ ] Kann Event-Details anzeigen
- [ ] Kann NICHT Events erstellen (Button nicht sichtbar)
- [ ] Kann NICHT auf /admin zugreifen
- [ ] Kann NICHT fremde Events bearbeiten

**Als EVENT_MANAGER:**
- [ ] Kann Events anzeigen
- [ ] Kann Events erstellen
- [ ] Kann eigene Events bearbeiten
- [ ] Kann NICHT fremde Events bearbeiten
- [ ] Kann NICHT auf /admin zugreifen

**Als ADMIN:**
- [ ] Kann Events anzeigen
- [ ] Kann Events erstellen
- [ ] Kann alle Events bearbeiten
- [ ] Kann auf /admin zugreifen
- [ ] Kann User-Rollen ändern
- [ ] Kann User löschen
- [ ] Kann Statistiken anzeigen

---

## Quick Verification Commands

```bash
# 1. Alle Packages bauen
pnpm build

# 2. Alle Tests ausführen
pnpm test
pnpm test:e2e

# 3. Schema validieren
cd packages/database
pnpm prisma validate
pnpm db:generate

# 4. API Server starten und testen
cd packages/api
pnpm dev
# In separatem Terminal:
curl http://localhost:3001/api/events
curl http://localhost:3001/api/admin/users -H "Authorization: Bearer <ADMIN_TOKEN>"

# 5. Frontend starten und manuell testen
cd packages/web
pnpm dev
# Browser: http://localhost:3000
```

---

**Erstellt**: 2025-01-XX
**Status**: Draft - Zur Review
**Autor**: AI Coding Agent
