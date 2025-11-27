# Authentication Flow - Detaillierte Erklärung

## 🔐 Übersicht

ShareLocal verwendet **JWT (JSON Web Tokens)** für Authentication. Dies ist ein stateless Authentication-Mechanismus, der keine Server-seitige Session-Speicherung erfordert.

## 📋 Authentication Flow Diagramm

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Browser │                    │ Frontend│                    │  API    │
│         │                    │  (Next) │                    │ (Express)│
└────┬────┘                    └────┬───┘                    └────┬─────┘
     │                               │                            │
     │  1. User gibt Credentials ein │                            │
     │──────────────────────────────>│                            │
     │                               │                            │
     │                               │  2. POST /api/auth/login  │
     │                               │  { email, password }      │
     │                               │──────────────────────────>│
     │                               │                            │
     │                               │                            │  3. Verify Password
     │                               │                            │  (bcrypt.compare)
     │                               │                            │
     │                               │                            │  4. Generate JWT Token
     │                               │                            │  (jwt.sign)
     │                               │                            │
     │                               │  5. Response               │
     │                               │  { user, token }          │
     │                               │<──────────────────────────│
     │                               │                            │
     │  6. Token in localStorage     │                            │
     │<──────────────────────────────│                            │
     │                               │                            │
     │                               │                            │
     │  7. Protected Request         │                            │
     │  Authorization: Bearer <token>│                            │
     │──────────────────────────────>│                            │
     │                               │                            │
     │                               │  8. Request mit Token     │
     │                               │  Authorization: Bearer ... │
     │                               │──────────────────────────>│
     │                               │                            │
     │                               │                            │  9. Verify Token
     │                               │                            │  (jwt.verify)
     │                               │                            │
     │                               │                            │  10. Check User exists
     │                               │                            │
     │                               │  11. Response              │
     │                               │  { data: ... }            │
     │                               │<──────────────────────────│
     │                               │                            │
     │  12. Display Data            │                            │
     │<──────────────────────────────│                            │
```

## 🔑 JWT Token Struktur

Ein JWT Token besteht aus drei Teilen, getrennt durch Punkte:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzN2QzMGJiYi0wZWJhLTRhMGQtODRkNy1mMzAwODU1ODU2MjAiLCJlbWFpbCI6Im1heC5tdXN0ZXJtYW5uQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM3ODk1MjAwLCJleHAiOjE3Mzg0OTk2MDB9.signature
```

### Token-Teile:

1. **Header** (Base64-encoded):
   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```

2. **Payload** (Base64-encoded):
   ```json
   {
     "userId": "37d30bbb-0eba-4a0d-84d7-f30085585620",
     "email": "max.mustermann@example.com",
     "iat": 1737895200,  // Issued at (Timestamp)
     "exp": 1738499600   // Expires at (Timestamp, 7 Tage später)
   }
   ```

3. **Signature**:
   - Wird mit `JWT_SECRET` erstellt
   - Verhindert Token-Manipulation

## 🔄 Schritt-für-Schritt Flow

### 1. Login Flow

#### Frontend → API Request:
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "max.mustermann@example.com",
  "password": "test123"
}
```

#### API Verarbeitung:
1. **Validation**: Zod Schema prüft Input (`email`, `password`)
2. **User Lookup**: User wird aus Datenbank geladen (mit Password Hash)
3. **Password Verification**: `bcrypt.compare(password, hash)` prüft Passwort
4. **Token Generation**: 
   ```typescript
   jwt.sign(
     { userId: user.id, email: user.email },
     JWT_SECRET,
     { expiresIn: '7d' }
   )
   ```

#### API → Frontend Response:
```json
{
  "data": {
    "user": {
      "id": "37d30bbb-0eba-4a0d-84d7-f30085585620",
      "email": "max.mustermann@example.com",
      "name": "Max Mustermann",
      // ... weitere User-Daten (OHNE passwordHash)
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Token Storage im Frontend

**Optionen:**
- ✅ **localStorage** (empfohlen für MVP)
  - Persistiert über Browser-Sessions
  - Einfach zu implementieren
  - ⚠️ XSS-Vulnerability (aber für MVP akzeptabel)

- **sessionStorage**
  - Wird beim Schließen des Tabs gelöscht
  - Weniger persistent

- **httpOnly Cookies** (später für Production)
  - Sicherer gegen XSS
  - Erfordert Backend-Anpassungen

**Implementierung:**
```typescript
// Nach erfolgreichem Login
localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### 3. Protected Requests

#### Frontend → API Request:
```typescript
GET /api/listings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Middleware (`authenticate`):
1. **Extract Token**: Aus `Authorization` Header extrahieren
   ```typescript
   const token = authHeader.substring(7); // Remove 'Bearer '
   ```

2. **Verify Token**: 
   ```typescript
   const payload = authService.verifyToken(token);
   // Prüft:
   // - Token ist valide (Signature korrekt)
   // - Token ist nicht abgelaufen (exp > now)
   ```

3. **Check User**: User existiert noch in Datenbank
   ```typescript
   const user = await userRepository.findById(payload.userId);
   if (!user || user.isDeleted()) {
     throw new AppError(401, 'User not found');
   }
   ```

4. **Add to Request**: User-Context wird zu Request hinzugefügt
   ```typescript
   req.user = {
     userId: payload.userId,
     email: payload.email,
   };
   ```

5. **Continue**: Request wird weitergeleitet an Route Handler

### 4. Token Refresh (später)

**Aktuell**: Token läuft nach 7 Tagen ab → User muss sich neu einloggen

**Später**: Refresh Token Mechanismus
- Access Token: Kurzlebig (15 Minuten)
- Refresh Token: Langlebig (7 Tage)
- Automatisches Refresh bei abgelaufenem Access Token

## 🛡️ Security Considerations

### ✅ Aktuell implementiert:
- Password Hashing mit bcrypt (10 salt rounds)
- JWT Signature Verification
- Token Expiration (7 Tage)
- User Existence Check bei jedem Request

### ⚠️ Für Production zu beachten:
- **HTTPS only**: Tokens sollten nie über HTTP gesendet werden
- **httpOnly Cookies**: Statt localStorage für besseren XSS-Schutz
- **CSRF Protection**: Für Cookie-basierte Auth
- **Rate Limiting**: Schutz gegen Brute-Force Attacks
- **Token Blacklist**: Für Logout (erfordert Redis/Database)
- **Refresh Tokens**: Für bessere Security

## 📱 Frontend Implementation Plan

### 1. Auth Context/Provider
```typescript
// lib/auth/AuthContext.tsx
- Zustand für: user, token, isAuthenticated
- Funktionen: login(), logout(), register()
- Token aus localStorage laden beim App-Start
```

### 2. API Client
```typescript
// lib/api/client.ts
- Axios/Fetch Instance mit Interceptor
- Automatisches Hinzufügen von Authorization Header
- Token Refresh Logic (später)
- Error Handling für 401 (Token expired)
```

### 3. Protected Routes
```typescript
// middleware.ts oder components/ProtectedRoute.tsx
- Prüft ob User eingeloggt ist
- Redirect zu /login wenn nicht authentifiziert
```

### 4. Login/Register Pages
```typescript
// app/login/page.tsx
// app/register/page.tsx
- Form mit React Hook Form + Zod
- API Calls zu /api/auth/login oder /api/auth/register
- Token Storage
- Redirect nach erfolgreichem Login
```

## 🔍 Token Decoding (Frontend)

**Wichtig**: Token kann im Frontend dekodiert werden (ohne Secret), aber **nicht verifiziert** werden.

```typescript
// Nur für Display-Zwecke (z.B. User-ID anzeigen)
function decodeToken(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// Beispiel:
const payload = decodeToken(token);
console.log(payload.userId); // "37d30bbb-0eba-4a0d-84d7-f30085585620"
console.log(payload.email);  // "max.mustermann@example.com"
console.log(payload.exp);    // Expiration Timestamp
```

**Aber**: Verifikation der Signature erfordert `JWT_SECRET`, der nur im Backend existiert.

## 📝 Zusammenfassung

1. **Login**: User sendet Credentials → API gibt Token zurück
2. **Storage**: Token wird in localStorage gespeichert
3. **Requests**: Token wird in `Authorization: Bearer <token>` Header gesendet
4. **Verification**: API prüft Token bei jedem Request
5. **Context**: User-Daten werden aus Token extrahiert und zu Request hinzugefügt

**Vorteile:**
- ✅ Stateless (keine Server-Sessions)
- ✅ Skalierbar (keine Shared Session Store nötig)
- ✅ Mobile-freundlich (Token kann einfach gespeichert werden)

**Nachteile:**
- ⚠️ Token kann nicht vor Ablauf invalidiert werden (ohne Blacklist)
- ⚠️ Token-Größe (größer als Session-ID)

