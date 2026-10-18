# Civics Issue Reporting System

A full-stack, enterprise-grade civic issue reporting and management platform designed to connect citizens with municipal officers and administrators.

---

## 🏛️ System Architecture

The project consists of three main parts:
1. **`mobile/`**: React Native (Expo Router) cross-platform mobile application for **Citizens** and **Officers**.
2. **`MobileBackend/`**: Node.js/Express REST API serving the mobile clients with JWT authentication, issue lifecycle management, geo-queries, image uploads, and push notification tokens.
3. **`Backend/`**: Administrative and duplicate-candidate backend management system with core data models and testing suites.

```
Civics-Issue-Reporting-System/
├── Backend/                 # Admin backend & test suites
├── MobileBackend/           # Mobile API server (Port 5001)
├── mobile/                  # React Native mobile app (Expo)
│   ├── app/                 # Expo Router file-based screens
│   │   ├── (auth)/          # Login & registration flows
│   │   ├── (citizen)/       # Citizen tabs: Feed, Report, Map, Profile, Drafts
│   │   └── (officer)/       # Officer tabs: Assigned tasks, Map, Profile
│   └── src/                 # Reusable components, hooks, api client, theme
└── shared/                  # Common domain models, validation, and rules
```

---

## ✨ Features by Role

### 🧑‍💼 Citizen Features
- **Issue Submission Flow**: Multi-step reporting wizard with live camera capture / gallery picker, automated compression, GPS lock, interactive Leaflet map pin adjustment, and category selection.
- **Offline Resilience & Drafts**: Report issues even with no internet connection. Submissions are saved securely to local storage (`AsyncStorage`) and auto-synced when connection resumes.
- **Interactive Map**: View real-time cluster map of nearby reported issues.
- **Status Tracking & Timeline**: Live status updates (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved` / `Rejected`).
- **Citizen Confirmation & Ratings**: Confirm issue resolution or submit feedback.

### 👮 Officer Features
- **Assigned Tasks Feed**: Direct dashboard of complaints assigned to the officer with priority indicators.
- **Progress Updates with Evidence**: Update complaint status (`In Progress`, `Resolved`) with remarks and photographic proof directly from the field.
- **Geographic Task Map**: View all assigned issues plotted on an interactive map.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or later
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI.
- **Expo Go** (optional for physical device testing) or **Android Studio Emulator**.

---

### 2. Start the Backend Server

```bash
cd MobileBackend
npm install
npm start
```
*The server will start on `http://localhost:5001` (or your LAN IP for physical device testing).*

---

### 3. Start the Mobile App

```bash
cd mobile
npm install
```

Configure your `.env` file in `mobile/`:
```env
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```
*(Tip: If testing on an Android Emulator, use `http://10.0.2.2:5001/api`. For a physical phone, use your machine's local Wi-Fi IP e.g. `http://192.168.1.X:5001/api`).*

Start the Expo development server:
```bash
npx expo start --clear
```

- Press `a` to run on Android Emulator.
- Press `w` to run on Web Browser.
- Scan the QR code using Expo Go on your mobile device.

---

## 🔑 Default Roles & Accounts

| Role | Access Scope |
|---|---|
| **Citizen** | Report issues, track complaints, view nearby map, manage offline drafts. |
| **Officer** | View assigned issues, update work progress with photos and remarks. |
| **Admin** | Web administrative dashboard for department management. |

---

## 🛠️ Verification & Quality Checks

Run the TypeScript type check across the mobile codebase:
```bash
cd mobile
npx tsc --noEmit
```
*(Passing with 0 errors)*
