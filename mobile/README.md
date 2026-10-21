# Civics Mobile Application (React Native / Expo)

Cross-platform mobile application for the Civics Issue Reporting System built with Expo Router, React Native, and React Query.

For complete system architecture and backend setup, see the main [README.md](../README.md).

---

## 📱 Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment configuration (`.env`)**:
   ```env
   # Android Emulator:
   EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api

   # Physical Device (use your machine's Wi-Fi IP):
   # EXPO_PUBLIC_API_URL=http://192.168.1.X:5001/api

   # Web / iOS Simulator:
   # EXPO_PUBLIC_API_URL=http://localhost:5001/api
   ```

3. **Start the app**:
   ```bash
   npx expo start --clear
   ```
   - Press `a` for Android Emulator
   - Press `w` for Web
   - Scan QR code with Expo Go on Android/iOS

4. **Verify TypeScript integrity**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📂 Project Structure

```
mobile/
├── app/                  # Expo Router file-based screens
│   ├── _layout.tsx       # Root layout, theme, query provider & auth navigation guard
│   ├── index.tsx         # Entry loading & redirection
│   ├── (auth)/           # Login & Registration screens
│   ├── (citizen)/        # Citizen tabs (Feed, Report, Map, Profile, Drafts)
│   └── (officer)/        # Officer tabs (Assigned feed, Map, Profile)
└── src/
    ├── api/              # Axios client & React Query queryKeys
    ├── components/       # Design system components (Button, TextField, Card, etc.)
    ├── constants/        # Category, status & priority mappings
    ├── features/         # Domain modules (auth, complaints, map, notifications, officer)
    ├── hooks/            # App-level utility hooks (useAppState)
    ├── theme/            # Design tokens (colors, typography, spacing, radii)
    └── utils/            # Storage, notifications, error handlers
```
