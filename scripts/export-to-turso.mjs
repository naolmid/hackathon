import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";

// Local Prisma client (reads from local SQLite)
const localPrisma = new PrismaClient();

// Turso client (writes to production)
const turso = createClient({
  url: "libsql://resourcemaster-naolmid.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njc0MDk1NTUsImlkIjoiNGYxYjRkMjYtNDZkZC00NmZhLTlhNjAtMDcyMTRlYzNjOWYyIiwicmlkIjoiYWQxY2QxZmEtOGUwNC00MGU4LTg4YzEtNzBjZmUxYmI4ZGJhIn0.BQ5Ylf67kM2me2vFn9CzA_z53YkfCyaSvx3o3-uwPKyNrfUcOOEmni5y3_m8U54IHM3XJMD2dN3sp8W34EAiDQ"
});

async function exportToTurso() {
  console.log("🚀 Exporting local database to Turso...\n");

  // Clear Turso tables first (in reverse order of dependencies)
  const tablesToClear = [
    'ResourceMovement', 'Message', 'TelegramLink', 'NotificationPreference',
    'MaintenanceAssignment', 'ResourceAlert', 'BookLending', 'Requisition',
    'UsageData', 'ResourceItem', 'User', 'ResourceLocation', 'Campus'
  ];

  console.log("🗑️ Clearing existing Turso data...");
  for (const table of tablesToClear) {
    try {
      await turso.execute(`DELETE FROM "${table}"`);
    } catch (e) {}
  }

  // 1. Export Campuses
  console.log("\n📍 Exporting Campuses...");
  const campuses = await localPrisma.campus.findMany();
  for (const c of campuses) {
    await turso.execute({
      sql: `INSERT INTO Campus (id, name, createdAt) VALUES (?, ?, ?)`,
      args: [c.id, c.name, c.createdAt.toISOString()]
    });
  }
  console.log(`   ✅ ${campuses.length} campuses`);

  // 2. Export Resource Locations
  console.log("\n📍 Exporting Resource Locations...");
  const locations = await localPrisma.resourceLocation.findMany();
  for (const loc of locations) {
    await turso.execute({
      sql: `INSERT INTO ResourceLocation (id, name, type, campusId, createdAt) VALUES (?, ?, ?, ?, ?)`,
      args: [loc.id, loc.name, loc.type, loc.campusId, loc.createdAt.toISOString()]
    });
  }
  console.log(`   ✅ ${locations.length} locations`);

  // 3. Export Users
  console.log("\n👥 Exporting Users...");
  const users = await localPrisma.user.findMany();
  for (const u of users) {
    await turso.execute({
      sql: `INSERT INTO User (id, email, username, password, role, campusId, locationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.email, u.username, u.password, u.role, u.campusId, u.locationId, u.createdAt.toISOString()]
    });
  }
  console.log(`   ✅ ${users.length} users`);

  // 4. Export Resource Items
  console.log("\n📦 Exporting Resource Items...");
  const resources = await localPrisma.resourceItem.findMany();
  for (const r of resources) {
    await turso.execute({
      sql: `INSERT INTO ResourceItem (id, name, type, quantity, currentQuantity, locationId, daysUntilDepletion, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [r.id, r.name, r.type, r.quantity, r.currentQuantity, r.locationId, r.daysUntilDepletion, r.createdAt.toISOString(), r.updatedAt.toISOString()]
    });
  }
  console.log(`   ✅ ${resources.length} resources`);

  // 5. Export Usage Data
  console.log("\n📊 Exporting Usage Data...");
  const usageData = await localPrisma.usageData.findMany();
  for (const ud of usageData) {
    await turso.execute({
      sql: `INSERT INTO UsageData (id, resourceId, usageRate, submittedBy, submittedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [ud.id, ud.resourceId, ud.usageRate, ud.submittedBy, ud.submittedAt.toISOString()]
    });
  }
  console.log(`   ✅ ${usageData.length} usage records`);

  // 6. Export Requisitions
  console.log("\n📋 Exporting Requisitions...");
  const requisitions = await localPrisma.requisition.findMany();
  for (const req of requisitions) {
    await turso.execute({
      sql: `INSERT INTO Requisition (id, resourceId, quantity, urgency, status, burnRate, createdAt, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [req.id, req.resourceId, req.quantity, req.urgency, req.status, req.burnRate, req.createdAt.toISOString(), req.approvedAt?.toISOString() || null]
    });
  }
  console.log(`   ✅ ${requisitions.length} requisitions`);

  // 7. Export Book Lendings
  console.log("\n📚 Exporting Book Lendings...");
  const bookLendings = await localPrisma.bookLending.findMany();
  for (const bl of bookLendings) {
    await turso.execute({
      sql: `INSERT INTO BookLending (id, bookId, borrowerName, borrowerId, lentDate, dueDate, returnDate, status, librarianId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [bl.id, bl.bookId, bl.borrowerName, bl.borrowerId, bl.lentDate.toISOString(), bl.dueDate.toISOString(), bl.returnDate?.toISOString() || null, bl.status, bl.librarianId, bl.createdAt.toISOString(), bl.updatedAt.toISOString()]
    });
  }
  console.log(`   ✅ ${bookLendings.length} book lendings`);

  // 8. Export Resource Alerts
  console.log("\n🚨 Exporting Resource Alerts...");
  const alerts = await localPrisma.resourceAlert.findMany();
  for (const a of alerts) {
    await turso.execute({
      sql: `INSERT INTO ResourceAlert (id, resourceId, locationId, alertType, urgency, message, status, submittedBy, acknowledgedBy, acknowledgedAt, resolvedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [a.id, a.resourceId, a.locationId, a.alertType, a.urgency, a.message, a.status, a.submittedBy, a.acknowledgedBy, a.acknowledgedAt?.toISOString() || null, a.resolvedAt?.toISOString() || null, a.createdAt.toISOString(), a.updatedAt.toISOString()]
    });
  }
  console.log(`   ✅ ${alerts.length} alerts`);

  // 9. Export Maintenance Assignments
  console.log("\n🔧 Exporting Maintenance Assignments...");
  const assignments = await localPrisma.maintenanceAssignment.findMany();
  for (const ma of assignments) {
    await turso.execute({
      sql: `INSERT INTO MaintenanceAssignment (id, alertId, assignmentType, assignedBy, assignedTo, instructions, status, report, completedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [ma.id, ma.alertId, ma.assignmentType, ma.assignedBy, ma.assignedTo, ma.instructions, ma.status, ma.report, ma.completedAt?.toISOString() || null, ma.createdAt.toISOString(), ma.updatedAt.toISOString()]
    });
  }
  console.log(`   ✅ ${assignments.length} maintenance assignments`);

  // 10. Export Messages
  console.log("\n💬 Exporting Messages...");
  const messages = await localPrisma.message.findMany();
  for (const m of messages) {
    await turso.execute({
      sql: `INSERT INTO Message (id, fromUserId, toUserId, subject, content, read, readAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [m.id, m.fromUserId, m.toUserId, m.subject, m.content, m.read ? 1 : 0, m.readAt?.toISOString() || null, m.createdAt.toISOString()]
    });
  }
  console.log(`   ✅ ${messages.length} messages`);

  // 11. Export Notification Preferences
  console.log("\n🔔 Exporting Notification Preferences...");
  const notifPrefs = await localPrisma.notificationPreference.findMany();
  for (const np of notifPrefs) {
    await turso.execute({
      sql: `INSERT INTO NotificationPreference (id, userId, type, channel, enabled) VALUES (?, ?, ?, ?, ?)`,
      args: [np.id, np.userId, np.type, np.channel, np.enabled ? 1 : 0]
    });
  }
  console.log(`   ✅ ${notifPrefs.length} notification preferences`);

  // 12. Export Telegram Links
  console.log("\n📱 Exporting Telegram Links...");
  const telegramLinks = await localPrisma.telegramLink.findMany();
  for (const tl of telegramLinks) {
    await turso.execute({
      sql: `INSERT INTO TelegramLink (id, userId, chatId, secureToken, tokenExpires, bonded, notificationPreference, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [tl.id, tl.userId, tl.chatId, tl.secureToken, tl.tokenExpires?.toISOString() || null, tl.bonded ? 1 : 0, tl.notificationPreference, tl.createdAt.toISOString()]
    });
  }
  console.log(`   ✅ ${telegramLinks.length} telegram links`);

  // 13. Export Resource Movements
  console.log("\n🚚 Exporting Resource Movements...");
  const movements = await localPrisma.resourceMovement.findMany();
  for (const rm of movements) {
    await turso.execute({
      sql: `INSERT INTO ResourceMovement (id, resourceId, resourceName, fromLocationId, toLocationId, movedBy, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [rm.id, rm.resourceId, rm.resourceName, rm.fromLocationId, rm.toLocationId, rm.movedBy, rm.reason, rm.createdAt.toISOString()]
    });
  }
  console.log(`   ✅ ${movements.length} resource movements`);

  console.log("\n\n🎉🎉🎉 COMPLETE DATABASE EXPORT SUCCESSFUL! 🎉🎉🎉");
  console.log("\nYour production database now has ALL your local data!");
  
  await localPrisma.$disconnect();
}

exportToTurso().catch(console.error);

