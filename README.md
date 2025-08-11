# ChemoCare

ChemoCare is a Flutter application skeleton for assisting patients during
chemotherapy treatment. It demonstrates critical flows such as onboarding with
consent, symptom tracking, voice reporting and medication reminders using a
modular architecture with Riverpod.

## Getting Started

1. Install [Flutter](https://flutter.dev) (stable channel).
2. Navigate to the project directory:

```bash
cd chemo_care
```

3. Initialize Firebase for your platforms:

```bash
flutterfire configure
```

4. Run the application:

```bash
flutter run
```

## Testing

Run unit, widget and integration tests:

```bash
flutter test
flutter test integration_test
```

## Environment Variables

Firebase configuration is handled via `flutterfire configure`. For local
development you may create a `.env` file (not committed) for API keys if
required by additional services.

## Directory Structure

Source code lives under `lib/src` following a layered architecture
(`presentation`, `application`, `domain`, `data`). Mock services and in-memory
repositories are provided for ease of testing.

Firestore collection schemas and sample security rules are located in the
`docs` folder.
