# GB Gym Mobile App

GB Gym is prepared to use Capacitor as the native mobile runtime while keeping the existing React application and backend API. Capacitor supports Android, iOS, and the web from the same web application.

## One-time native setup

From the frontend directory, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\mobile\setup-capacitor.ps1
```

The script installs Capacitor 8, builds the React app, creates Android and iOS projects, and syncs the web assets.

Then:

```powershell
npx cap open android
```

For iOS, use a Mac with Xcode:

```bash
npx cap open ios
```

## Production app configuration

- App ID: `com.gbgym.platform`
- App name: `GB Gym`
- Web build directory: `dist`
- API remains the existing GB Gym production API (`VITE_API_URL` can override it for staging/development).

Do not put database credentials, Paystack secret keys, Cloudinary secrets, or JWT secrets in the frontend or native project.

## Store builds

Google Play requires a signed Android App Bundle (`.aab`). Apple requires a signed iOS archive uploaded through Xcode/Transporter and App Store Connect. Store certificates/signing credentials must be created in the respective developer accounts and must never be committed to GitHub.
