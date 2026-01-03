import { createClient } from "@libsql/client";
import crypto from "crypto";

const client = createClient({
  url: "libsql://resourcemaster-naolmid.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njc0MDk1NTUsImlkIjoiNGYxYjRkMjYtNDZkZC00NmZhLTlhNjAtMDcyMTRlYzNjOWYyIiwicmlkIjoiYWQxY2QxZmEtOGUwNC00MGU4LTg4YzEtNzBjZmUxYmI4ZGJhIn0.BQ5Ylf67kM2me2vFn9CzA_z53YkfCyaSvx3o3-uwPKyNrfUcOOEmni5y3_m8U54IHM3XJMD2dN3sp8W34EAiDQ"
});

// Simple hash function (for demo - not secure for production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log("Seeding Turso database...");
  const now = new Date().toISOString();
  
  // Clear existing data
  const tables = ['ResourceMovement', 'Message', 'TelegramLink', 'NotificationPreference', 
                  'MaintenanceAssignment', 'ResourceAlert', 'BookLending', 'Requisition', 
                  'UsageData', 'ResourceItem', 'User', 'ResourceLocation', 'Campus'];
  
  for (const table of tables) {
    try {
      await client.execute(`DELETE FROM "${table}"`);
      console.log(`Cleared ${table}`);
    } catch (e) {}
  }
  
  // Create Campus
  await client.execute({
    sql: `INSERT INTO Campus (id, name, createdAt) VALUES (?, ?, ?)`,
    args: ['campus-hachalu', 'Hachalu Hundesa Campus', now]
  });
  console.log("✓ Created campus");
  
  // Create Locations
  const locations = [
    ['loc-hachalu-cafeteria', 'HHC CAMPUS', 'CAFETERIA', 'campus-hachalu'],
    ['loc-hachalu-library', 'Main Library', 'LIBRARY', 'campus-hachalu'],
    ['loc-hachalu-complab1', 'Computer Lab 1', 'COMPUTER_LAB', 'campus-hachalu'],
    ['loc-hachalu-complab2', 'Computer Lab 2', 'COMPUTER_LAB', 'campus-hachalu'],
    ['loc-hachalu-complab3', 'Computer Lab 3', 'COMPUTER_LAB', 'campus-hachalu'],
    ['loc-hachalu-complab4', 'Computer Lab 4', 'COMPUTER_LAB', 'campus-hachalu'],
    ['loc-hachalu-biolab', 'Biology Lab', 'BIOLOGY_LAB', 'campus-hachalu'],
    ['loc-hachalu-chemlab', 'Chemistry Lab', 'CHEMISTRY_LAB', 'campus-hachalu'],
    ['loc-hachalu-lh01', 'Lecture Hall LH01', 'LECTURE_HALL', 'campus-hachalu'],
    ['loc-hachalu-lh02', 'Lecture Hall LH02', 'LECTURE_HALL', 'campus-hachalu'],
    ['loc-hachalu-cr01', 'Classroom CR01', 'CLASSROOM', 'campus-hachalu'],
    ['loc-hachalu-cr02', 'Classroom CR02', 'CLASSROOM', 'campus-hachalu'],
    ['loc-hachalu-cr03', 'Classroom CR03', 'CLASSROOM', 'campus-hachalu'],
    ['loc-hachalu-print', 'Print House', 'PRINT_HOUSE', 'campus-hachalu'],
  ];
  
  for (const [id, name, type, campusId] of locations) {
    await client.execute({
      sql: `INSERT INTO ResourceLocation (id, name, type, campusId, createdAt) VALUES (?, ?, ?, ?, ?)`,
      args: [id, name, type, campusId, now]
    });
  }
  console.log("✓ Created locations");
  
  // Create Users
  const users = [
    ['user-uadmin', 'uadmin@ambo.edu.et', 'universityadmin', hashPassword('university admin'), 'UNIVERSITY_ADMIN', 'campus-hachalu', null],
    ['user-cadmin', 'cadmin@ambo.edu.et', 'campusadmin', hashPassword('campus admin'), 'CAMPUS_ADMIN', 'campus-hachalu', null],
    ['user-lib', 'lib@ambo.edu.et', 'librarian', hashPassword('librarian'), 'LIBRARIAN', 'campus-hachalu', 'loc-hachalu-library'],
    ['user-print', 'print@ambo.edu.et', 'printpersonnel', hashPassword('print personnel'), 'PRINT_PERSONNEL', 'campus-hachalu', 'loc-hachalu-print'],
    ['user-lab', 'lab@ambo.edu.et', 'labmanager', hashPassword('lab manager'), 'LAB_MANAGER', 'campus-hachalu', 'loc-hachalu-complab1'],
    ['user-it', 'it@ambo.edu.et', 'itstaff', hashPassword('it staff'), 'IT_STAFF', 'campus-hachalu', null],
    ['user-cafe', 'cafe@ambo.edu.et', 'cafeteria', hashPassword('cafeteria'), 'CAFETERIA', 'campus-hachalu', 'loc-hachalu-cafeteria'],
    ['user-maint', 'maint@ambo.edu.et', 'maintenancestaff', hashPassword('maintenance staff'), 'MAINTENANCE_STAFF', 'campus-hachalu', null],
  ];
  
  for (const [id, email, username, password, role, campusId, locationId] of users) {
    await client.execute({
      sql: `INSERT INTO User (id, email, username, password, role, campusId, locationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, email, username, password, role, campusId, locationId, now]
    });
  }
  console.log("✓ Created users");
  
  // Create Resources
  const resources = [
    // Cafeteria
    ['res-pot1', 'Large Cooking Pot', 'EQUIPMENT', 19, 19, 'loc-hachalu-cafeteria'],
    ['res-injera', 'Injera Maker', 'EQUIPMENT', 5, 5, 'loc-hachalu-cafeteria'],
    ['res-plates', 'Dinner Plates', 'CONSUMABLE', 500, 485, 'loc-hachalu-cafeteria'],
    // Library Books
    ['res-book1', 'Introduction to Algorithms by Cormen (#44001)', 'BOOK', 1, 1, 'loc-hachalu-library'],
    ['res-book2', 'Clean Code by Robert Martin (#44002)', 'BOOK', 1, 0, 'loc-hachalu-library'],
    ['res-book3', 'The Pragmatic Programmer by Hunt (#44003)', 'BOOK', 1, 1, 'loc-hachalu-library'],
    ['res-book4', 'Design Patterns by Gang of Four (#44004)', 'BOOK', 1, 1, 'loc-hachalu-library'],
    ['res-book5', 'Structure and Interpretation by Abelson (#44005)', 'BOOK', 1, 0, 'loc-hachalu-library'],
    // Computer Labs
    ['res-comp1', 'Dell Desktop Computer', 'EQUIPMENT', 25, 25, 'loc-hachalu-complab1'],
    ['res-comp2', 'HP Desktop Computer', 'EQUIPMENT', 30, 30, 'loc-hachalu-complab2'],
    ['res-comp3', 'Dell Desktop Computer', 'EQUIPMENT', 28, 28, 'loc-hachalu-complab3'],
    ['res-comp4', 'Lenovo Desktop Computer', 'EQUIPMENT', 22, 22, 'loc-hachalu-complab4'],
    // Classrooms
    ['res-desk1', 'Student Desk', 'FURNITURE', 40, 40, 'loc-hachalu-cr01'],
    ['res-desk2', 'Student Desk', 'FURNITURE', 45, 45, 'loc-hachalu-cr02'],
    ['res-wb1', 'Whiteboard', 'EQUIPMENT', 2, 2, 'loc-hachalu-lh01'],
    ['res-wb2', 'Whiteboard', 'EQUIPMENT', 2, 2, 'loc-hachalu-lh02'],
    // Print House
    ['res-paper', 'A4 Paper Reams', 'CONSUMABLE', 100, 45, 'loc-hachalu-print'],
    ['res-ink', 'Printer Ink Cartridge', 'CONSUMABLE', 20, 8, 'loc-hachalu-print'],
  ];
  
  for (const [id, name, type, qty, currQty, locId] of resources) {
    await client.execute({
      sql: `INSERT INTO ResourceItem (id, name, type, quantity, currentQuantity, locationId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, type, qty, currQty, locId, now, now]
    });
  }
  console.log("✓ Created resources");
  
  // Create sample book lending
  await client.execute({
    sql: `INSERT INTO BookLending (id, bookId, borrowerName, borrowerId, lentDate, dueDate, status, librarianId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['lending-1', 'res-book2', 'Naol Mideksa', 'UGR/5680/17', now, new Date(Date.now() + 30*24*60*60*1000).toISOString(), 'LENT', 'user-lib', now, now]
  });
  await client.execute({
    sql: `INSERT INTO BookLending (id, bookId, borrowerName, borrowerId, lentDate, dueDate, status, librarianId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['lending-2', 'res-book5', 'Abebe Kebede', 'UGR/4521/17', now, new Date(Date.now() + 30*24*60*60*1000).toISOString(), 'LENT', 'user-lib', now, now]
  });
  console.log("✓ Created book lendings");
  
  // Create sample alerts
  await client.execute({
    sql: `INSERT INTO ResourceAlert (id, locationId, alertType, urgency, message, status, submittedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['alert-1', 'loc-hachalu-cafeteria', 'EQUIPMENT_BREAKDOWN', 'URGENT', 'Injera maker broke and we are not giving food anymore. Students are starving!', 'PENDING', 'user-cafe', now, now]
  });
  await client.execute({
    sql: `INSERT INTO ResourceAlert (id, locationId, alertType, urgency, message, status, submittedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['alert-2', 'loc-hachalu-print', 'LOW_STOCK', 'SERIOUS', 'Paper stock running low - only 45 reams left', 'PENDING', 'user-print', now, now]
  });
  await client.execute({
    sql: `INSERT INTO ResourceAlert (id, locationId, alertType, urgency, message, status, submittedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['alert-3', 'loc-hachalu-complab1', 'MAINTENANCE_NEEDED', 'DAY_TO_DAY', 'Computer #5 needs keyboard replacement', 'PENDING', 'user-lab', now, now]
  });
  console.log("✓ Created alerts");
  
  console.log("\n✅ Database seeded successfully!");
}

seed().catch(console.error);

