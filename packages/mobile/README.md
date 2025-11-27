# @sharelocal/mobile

Flutter Mobile App für ShareLocal - Flutter 3.27.x + Dart 3.7+

## 🚀 Quick Start

### Voraussetzungen

- **Flutter** 3.27.x oder höher
- **Dart** 3.7+ oder höher
- **iOS**: Xcode (macOS)
- **Android**: Android Studio mit Android SDK

### Installation

```bash
# In das Mobile-Verzeichnis wechseln
cd packages/mobile

# Dependencies installieren
flutter pub get
```

### Entwicklung

```bash
# App auf verbundenem Gerät/Emulator starten
flutter run

# Für spezifisches Gerät
flutter run -d <device-id>

# Verfügbare Geräte auflisten
flutter devices
```

## 📁 Projekt-Struktur

```
lib/
├── main.dart         # Entry Point
app/                  # App Setup (später)
features/             # Feature Modules (später)
shared/               # Shared Widgets/Utils (später)
core/                 # Core Functionality (später)
```

## 🛠️ Technologie-Stack

- **Framework**: Flutter 3.27.x
- **Sprache**: Dart 3.7+
- **State Management**: Riverpod oder Bloc (später)
- **HTTP**: Dio (später)
- **Storage**: Hive oder SQLite (später)
- **Maps**: flutter_map (OpenStreetMap) (später)

## 📝 Scripts

- `flutter pub get` - Installiert Dependencies
- `flutter run` - Startet die App auf einem verbundenen Gerät/Emulator
- `flutter test` - Führt Tests aus
- `flutter analyze` - Führt Code-Analyse aus
- `flutter build apk` - Build für Android
- `flutter build ios` - Build für iOS

## 🎨 Code Style

- Dart Style Guide befolgen
- `analysis_options.yaml` für Linting-Regeln
- Prefer const constructors
- Immutable Widgets bevorzugt

## 📦 Dependencies

Siehe `pubspec.yaml` für aktuelle Dependencies.

## ⚠️ Wichtige Regeln

- Offline-First Architektur bevorzugt
- Image Caching implementieren
- Platform-spezifische Code in `platform/` Verzeichnis
- Performance: Lazy Loading für Listen

## 📚 Weitere Dokumentation

- [AGENTS.md](AGENTS.md) - Detaillierte Anweisungen für AI Coding Agents
- [Flutter Documentation](https://docs.flutter.dev/)

---

**Status:** 🚧 In Entwicklung
