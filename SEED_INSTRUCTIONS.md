# HOW TO SEED THE DATABASE

## Option 1: Use the Seed Page (Easiest)

1. Make sure your dev server is running: `npm run dev`
2. Open your browser and go to: `http://localhost:3000/seed`
3. Click the "Seed Database" button
4. Wait for success message

## Option 2: Use the API Directly

1. Make sure your dev server is running: `npm run dev`
2. Open your browser console (F12)
3. Run this command:
```javascript
fetch('/api/seed', { method: 'POST' }).then(r => r.json()).then(console.log)
```

## Option 3: Use Prisma Seed Script

1. Make sure you have a DATABASE_URL in your .env file
2. Run: `npx tsx prisma/seed.ts`

## Troubleshooting

If you get errors:
1. Check if DATABASE_URL is set in .env file
2. Make sure the database exists
3. Run `npx prisma db push` to sync schema
4. Check the browser console for error messages

