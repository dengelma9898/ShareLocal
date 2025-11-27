# @sharelocal/mobile - Agent Context

Flutter Mobile App Package - Flutter 3.27.x + Dart 3.7+

## Setup commands

- Install deps: `flutter pub get` (vom Package-Root)
- Run app: `flutter run` (vom Package-Root)
- Run tests: `flutter test`
- Analyze code: `flutter analyze`
- Build APK: `flutter build apk`
- Build iOS: `flutter build ios`

## Dev environment tips

- Flutter SDK 3.27.x oder höher erforderlich
- Dart 3.7+ erforderlich
- iOS: Xcode erforderlich (macOS)
- Android: Android Studio mit Android SDK erforderlich
- Emulator/Simulator oder physisches Gerät für Testing

## Code style

- Dart Style Guide befolgen
- `analysis_options.yaml` für Linting-Regeln
- Prefer const constructors
- Immutable Widgets bevorzugt
- Riverpod oder Bloc für State Management (später)

## Testing instructions

- Test-Framework: Flutter Test
- Unit Tests: `flutter test`
- Widget Tests: `flutter test test/widget_test.dart`
- Integration Tests: `flutter test integration_test/` (später)
- Coverage-Ziel: 70%+ für kritische Komponenten

## Package structure

```
lib/
├── main.dart         # Entry point
├── app/              # App Setup (später)
├── features/         # Feature Modules (später)
├── shared/           # Shared Widgets/Utils (später)
└── core/             # Core Functionality (später)
```

## Dependencies

- Flutter SDK 3.27.x
- Dart 3.7+
- Riverpod oder Bloc (später)
- Dio für HTTP (später)
- flutter_map für Maps (später)
- Hive oder SQLite für Storage (später)

## Important notes

- Offline-First Architektur bevorzugt
- Image Caching implementieren
- Platform-spezifische Code in `platform/` Verzeichnis
- Internationalisierung mit `flutter_localizations`
- Performance: Lazy Loading für Listen

