# ResourceMaster - University Resource Planning Platform

Administrative control platform for Ambo University.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Glock Grotesk Font

Place your Glock Grotesk font files in `/public/fonts/`:
- `GlockGrotesk-Regular.woff2`
- `GlockGrotesk-Medium.woff2`
- `GlockGrotesk-Bold.woff2`

If you don't have the font files yet, the app will use a system font fallback.

### 3. Logo Files

Make sure these logo files are in the `/public` directory:
- `intro.png` - Loading screen logo
- `to be used inside.png` - ResourceMaster logo (top left)
- `university.png` - Ambo University logo (bottom)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

- `universityadmin` / `university admin`
- `campusadmin` / `campus admin`
- `librarian` / `librarian`
- `printpersonnel` / `print personnel`
- `financestaff` / `finance staff`
- `labmanager` / `lab manager`
- `itstaff` / `it staff`
- `facilities` / `facilities`
- `security` / `security`
- `investigator` / `investigator`
- `maintenancestaff` / `maintenance staff`

## Design System

- **Background:** #012a33
- **Text:** White (#ffffff)
- **Accent:** #007acc
- **Font:** Glock Grotesk (low letter spacing)
- **Border Radius:** 24px (cards)

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma (to be configured)
- Socket.io (for real-time updates)

