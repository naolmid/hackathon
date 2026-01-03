import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://resourcemaster-naolmid.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njc0MDk1NTUsImlkIjoiNGYxYjRkMjYtNDZkZC00NmZhLTlhNjAtMDcyMTRlYzNjOWYyIiwicmlkIjoiYWQxY2QxZmEtOGUwNC00MGU4LTg4YzEtNzBjZmUxYmI4ZGJhIn0.BQ5Ylf67kM2me2vFn9CzA_z53YkfCyaSvx3o3-uwPKyNrfUcOOEmni5y3_m8U54IHM3XJMD2dN3sp8W34EAiDQ"
});

const statements = [
  `CREATE TABLE IF NOT EXISTS "Campus" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "ResourceLocation" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "campusId" TEXT NOT NULL, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "username" TEXT NOT NULL, "password" TEXT NOT NULL, "role" TEXT NOT NULL, "campusId" TEXT, "locationId" TEXT, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "ResourceItem" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "currentQuantity" INTEGER NOT NULL, "locationId" TEXT NOT NULL, "daysUntilDepletion" INTEGER, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "UsageData" ("id" TEXT NOT NULL PRIMARY KEY, "resourceId" TEXT NOT NULL, "usageRate" REAL NOT NULL, "submittedBy" TEXT NOT NULL, "submittedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "Requisition" ("id" TEXT NOT NULL PRIMARY KEY, "resourceId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "urgency" TEXT NOT NULL, "status" TEXT NOT NULL, "burnRate" REAL NOT NULL, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "approvedAt" TEXT)`,
  `CREATE TABLE IF NOT EXISTS "BookLending" ("id" TEXT NOT NULL PRIMARY KEY, "bookId" TEXT NOT NULL, "borrowerName" TEXT NOT NULL, "borrowerId" TEXT, "lentDate" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "dueDate" TEXT NOT NULL, "returnDate" TEXT, "status" TEXT NOT NULL DEFAULT 'LENT', "librarianId" TEXT NOT NULL, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "ResourceAlert" ("id" TEXT NOT NULL PRIMARY KEY, "resourceId" TEXT, "locationId" TEXT NOT NULL, "alertType" TEXT NOT NULL, "urgency" TEXT NOT NULL, "message" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "submittedBy" TEXT NOT NULL, "acknowledgedBy" TEXT, "acknowledgedAt" TEXT, "resolvedAt" TEXT, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "MaintenanceAssignment" ("id" TEXT NOT NULL PRIMARY KEY, "alertId" TEXT NOT NULL, "assignmentType" TEXT NOT NULL, "assignedBy" TEXT NOT NULL, "assignedTo" TEXT NOT NULL, "instructions" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "report" TEXT, "completedAt" TEXT, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "NotificationPreference" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "channel" TEXT NOT NULL, "enabled" INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS "TelegramLink" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "chatId" TEXT, "secureToken" TEXT, "tokenExpires" TEXT, "bonded" INTEGER NOT NULL DEFAULT 0, "notificationPreference" TEXT NOT NULL DEFAULT 'URGENT_ONLY', "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "Message" ("id" TEXT NOT NULL PRIMARY KEY, "fromUserId" TEXT NOT NULL, "toUserId" TEXT NOT NULL, "subject" TEXT, "content" TEXT NOT NULL, "read" INTEGER NOT NULL DEFAULT 0, "readAt" TEXT, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "ResourceMovement" ("id" TEXT NOT NULL PRIMARY KEY, "resourceId" TEXT, "resourceName" TEXT, "fromLocationId" TEXT NOT NULL, "toLocationId" TEXT NOT NULL, "movedBy" TEXT NOT NULL, "reason" TEXT, "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLink_userId_key" ON "TelegramLink"("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLink_chatId_key" ON "TelegramLink"("chatId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLink_secureToken_key" ON "TelegramLink"("secureToken")`
];

async function initDatabase() {
  console.log("Initializing Turso database...");
  
  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("✓", sql.slice(0, 60) + "...");
    } catch (err) {
      console.error("✗", err.message);
    }
  }
  
  console.log("\n✅ Schema created!");
}

initDatabase().catch(console.error);
