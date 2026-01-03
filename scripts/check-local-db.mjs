import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDb() {
  const resources = await prisma.resourceItem.count();
  const users = await prisma.user.count();
  const campuses = await prisma.campus.count();
  const locations = await prisma.resourceLocation.count();
  const alerts = await prisma.resourceAlert.count();
  const messages = await prisma.message.count();
  const bookLendings = await prisma.bookLending.count();

  console.log("📊 Local Database Status:");
  console.log("========================");
  console.log(`Campuses: ${campuses}`);
  console.log(`Locations: ${locations}`);
  console.log(`Users: ${users}`);
  console.log(`Resources: ${resources}`);
  console.log(`Alerts: ${alerts}`);
  console.log(`Messages: ${messages}`);
  console.log(`Book Lendings: ${bookLendings}`);
  
  await prisma.$disconnect();
}

checkDb().catch(console.error);

