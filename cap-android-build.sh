#!/bin/bash

npm run build

# Run npx cap sync
npx cap sync

# Navigate to the Android directory
cd android

# Build the APK using Gradle
./gradlew assembleDebug

# Generate timestamp (format: YYYYMMDD_HHMMSS)
timestamp=$(date +"%Y%m%d_%H%M%S")

new_filename="app-debug_${timestamp}.apk"

# Copy the generated APK to the parent directory
cp app/build/outputs/apk/debug/app-debug.apk ../${new_filename}

# Navigate back to the project root directory
cd ..
