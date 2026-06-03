# 📒 NotePass

**NotePass** is a modern, offline-first note taking and password management app built with **React Native + Expo**.

It combines **rich note editing**, **secure password storage**, **encrypted backups**, and a clean productivity-focused interface into one lightweight mobile application.

---

## ✨ Features

### 📝 Rich Notes

* Create, edit, delete notes
* Rich text editor with native toolbar
* Interactive checklists
* Inline image attachments
* Text color customization
* Background theme customization

### 🔐 Secure Password Vault

* Dedicated password manager section
* Encrypted storage using **Expo SecureStore**
* Safe organization for sensitive credentials

### 📂 Backup & Restore

* Export all data into a single backup file
* Import previous backups
* Smart merge system prevents duplicates
* Share or locally save backups

### 🔒 End-to-End Security

* AES encryption using **crypto-js**
* Password-protected backup files
* Proprietary `.notepass` format
* Data remains unreadable without the Master Password

### 🎨 Customization & Productivity

* List View / Masonry Grid View
* Search, sorting, and filtering
* Pin important notes
* Trash recovery system
* Native Android modal navigation support

---

## 🛠 Tech Stack

* **React Native**
* **Expo**
* **Expo Router**
* **AsyncStorage**
* **Expo SecureStore**
* **Expo Image Picker**
* **Expo Document Picker**
* **crypto-js**

---

## 📦 Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd notepass
```

Install dependencies:

```bash
npm install
```

Run the project:

```bash
npx expo start
```

Launch using:

* Android Emulator
* iOS Simulator
* Expo Go App

---

# 🚀 Changelog

## V4.0 — The Rich Editor Update *(Current)*

### Native Rich Editor Toolbar

Replaced basic text inputs with a dynamic native bottom toolbar.

### Image Support

Integrated **expo-image-picker** for attaching multiple images inline within notes.

### Interactive Checklists

Added one-tap conversion from paragraphs to checkable to-do lists.

### Custom Styling Palettes

* 7 Background color themes
* 7 High-contrast text colors
* Auto-dismiss palettes while typing

### Native Hardware Navigation

Added Android back-button & swipe gesture support for all modals.

---

## V3.1 — The Secure Vault Update

### Encryption

Implemented **AES encryption** using **crypto-js** for backup security.

### Proprietary Backup Format

Introduced `.notepass` extension with binary MIME handling.

### Smart Data Merge

Imports intelligently merge only missing items without overwriting existing local data.

### Export Routing

Users can choose between:

* Local file save
* App sharing (Email, WhatsApp, etc.)

---

## V3.0 — Backup & Restore

### Data Portability

Export all notes and passwords into a single backup file.

### Importing

Added file import using **expo-document-picker**.

---

## V2.0 — Security & Organization

### Secure Password Vault

Added encrypted password storage using **Expo SecureStore**.

---

## V1.0 — Core Engine

### Foundation

Built full CRUD note operations.

### Local Storage

Offline persistence using **AsyncStorage**.

### Dynamic Views

Switch between:

* List View
* Masonry Grid View

### Search & Sort

Added:

* Real-time search
* Alphabetical sorting
* Date-based sorting

---
