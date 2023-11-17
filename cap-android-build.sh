#!/bin/bash

# Run npx cap sync
npx cap sync

# Navigate to the Android directory
cd android

# Build the APK using Gradle
./gradlew assembleDebug

# Copy the generated APK to the parent directory
cp app/build/outputs/apk/debug/app-debug.apk ../

# Navigate back to the project root directory
cd ..
