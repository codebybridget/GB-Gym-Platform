$ErrorActionPreference = "Stop"

Write-Host "Installing Capacitor 8 packages..."
npm install @capacitor/core@^8.5.2 @capacitor/cli@^8.5.2 @capacitor/android@^8.5.2 @capacitor/ios@^8.5.2

Write-Host "Building GB Gym web assets..."
npm run build

Write-Host "Initializing native projects..."
npx cap add android
npx cap add ios
npx cap sync

Write-Host "Capacitor Android and iOS projects are ready."
Write-Host "Android: npx cap open android"
Write-Host "iOS:     npx cap open ios (macOS/Xcode required)"
