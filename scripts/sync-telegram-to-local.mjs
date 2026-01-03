import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";

// Turso client (READ from cloud)
const turso = createClient({
  url: "libsql://resourcemaster-naolmid.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njc0MDk1NTUsImlkIjoiNGYxYjRkMjYtNDZkZC00NmZhLTlhNjAtMDcyMTRlYzNjOWYyIiwicmlkIjoiYWQxY2QxZmEtOGUwNC00MGU4LTg4YzEtNzBjZmUxYmI4ZGJhIn0.BQ5Ylf67kM2me2vFn9CzA_z53YkfCyaSvx3o3-uwPKyNrfUcOOEmni5y3_m8U54IHM3XJMD2dN3sp8W34EAiDQ"
});

// Local Prisma client (WRITE to local)
const localPrisma = new PrismaClient();

async function syncTelegramToLocal() {
  console.log("📱 Syncing Telegram data from cloud to local...\n");

  // Read TelegramLink from Turso
  const result = await turso.execute("SELECT * FROM TelegramLink");
  
  console.log(`Found ${result.rows.length} Telegram links in cloud`);

  for (const row of result.rows) {
    try {
      // First check if user exists locally
      const user = await localPrisma.user.findUnique({
        where: { id: row.userId }
      });

      if (!user) {
        console.log(`⚠️ User ${row.userId} not found locally, skipping...`);
        continue;
      }

      // Upsert the telegram link
      await localPrisma.telegramLink.upsert({
        where: { userId: row.userId },
        update: {
          chatId: row.chatId,
          secureToken: row.secureToken,
          tokenExpires: row.tokenExpires ? new Date(row.tokenExpires) : null,
          bonded: row.bonded === 1,
          notificationPreference: row.notificationPreference || "URGENT_ONLY",
        },
        create: {
          id: row.id,
          userId: row.userId,
          chatId: row.chatId,
          secureToken: row.secureToken,
          tokenExpires: row.tokenExpires ? new Date(row.tokenExpires) : null,
          bonded: row.bonded === 1,
          notificationPreference: row.notificationPreference || "URGENT_ONLY",
        },
      });
      
      console.log(`✅ Synced Telegram for user ${row.userId} (bonded: ${row.bonded === 1})`);
    } catch (e) {
      console.error(`❌ Error syncing ${row.userId}:`, e.message);
    }
  }

  console.log("\n🎉 Telegram sync complete! Localhost now has Telegram data.");
  await localPrisma.$disconnect();
}

syncTelegramToLocal().catch(console.error);

