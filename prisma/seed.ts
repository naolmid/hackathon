import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Delete all non-Hachalu campuses first
  await prisma.campus.deleteMany({
    where: {
      id: { not: 'campus-hachalu' }
    }
  });

  // Create ONLY Hachalu Hundesa Campus
  const hachaluCampus = await prisma.campus.upsert({
    where: { id: 'campus-hachalu' },
    update: {
      name: 'Hachalu Hundesa Campus',
    },
    create: {
      id: 'campus-hachalu',
      name: 'Hachalu Hundesa Campus',
    },
  });

  console.log('✅ Created campus');

  // Delete all locations not belonging to Hachalu Campus
  await prisma.resourceLocation.deleteMany({
    where: {
      campusId: { not: hachaluCampus.id }
    }
  });

  // Create Resource Locations (ONLY Hachalu Campus)
  const locations = [
    { id: 'loc-hachalu-library', name: 'Main Library', type: 'LIBRARY', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-lab4', name: 'Computer Lab 4', type: 'LAB', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-lab9', name: 'Computer Lab 9', type: 'LAB', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-bio-lab', name: 'Biology Lab', type: 'LAB', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-cafeteria', name: 'HHC CAMPUS', type: 'CAFETERIA', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-print', name: 'Print House', type: 'PRINT_HOUSE', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-classroom-a', name: 'Classroom Block A', type: 'CLASSROOM', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-it', name: 'IT Department', type: 'IT_DEPARTMENT', campusId: hachaluCampus.id },
    { id: 'loc-hachalu-finance', name: 'Finance Office', type: 'FINANCE_OFFICE', campusId: hachaluCampus.id },
  ];

  for (const loc of locations) {
    await prisma.resourceLocation.upsert({
      where: { id: loc.id },
      update: {
        name: loc.name,
        type: loc.type,
        campusId: loc.campusId,
      },
      create: loc,
    });
  }

  console.log('✅ Created resource locations');

  // Create Users (password is just the role name for demo)
  const users = [
    { id: 'user-university-admin', username: 'universityadmin', email: 'universityadmin@ambou.edu.et', password: 'university admin', role: 'UNIVERSITY_ADMIN', campusId: null },
    { id: 'user-campus-admin', username: 'campusadmin', email: 'campusadmin@ambou.edu.et', password: 'campus admin', role: 'CAMPUS_ADMIN', campusId: hachaluCampus.id },
    { id: 'user-librarian', username: 'librarian', email: 'librarian@ambou.edu.et', password: 'librarian', role: 'LIBRARIAN', campusId: hachaluCampus.id },
    { id: 'user-print-personnel', username: 'printpersonnel', email: 'print@ambou.edu.et', password: 'print personnel', role: 'PRINT_PERSONNEL', campusId: hachaluCampus.id },
    { id: 'user-finance-staff', username: 'financestaff', email: 'finance@ambou.edu.et', password: 'finance staff', role: 'FINANCE_STAFF', campusId: hachaluCampus.id },
    { id: 'user-lab-manager', username: 'labmanager', email: 'labmanager@ambou.edu.et', password: 'lab manager', role: 'LAB_MANAGER', campusId: hachaluCampus.id },
    { id: 'user-it-staff', username: 'itstaff', email: 'it@ambou.edu.et', password: 'it staff', role: 'IT_STAFF', campusId: hachaluCampus.id },
    { id: 'user-facilities', username: 'facilities', email: 'facilities@ambou.edu.et', password: 'facilities', role: 'FACILITIES', campusId: hachaluCampus.id },
    { id: 'user-security', username: 'security', email: 'security@ambou.edu.et', password: 'security', role: 'SECURITY', campusId: hachaluCampus.id },
    { id: 'user-investigator', username: 'investigator', email: 'investigator@ambou.edu.et', password: 'investigator', role: 'INVESTIGATOR', campusId: hachaluCampus.id },
    { id: 'user-maintenance', username: 'maintenancestaff', email: 'maintenance@ambou.edu.et', password: 'maintenance staff', role: 'MAINTENANCE_STAFF', campusId: hachaluCampus.id },
    { id: 'user-cafeteria', username: 'cafeteria', email: 'cafeteria@ambou.edu.et', password: 'cafeteria', role: 'CAFETERIA', campusId: hachaluCampus.id },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }

  console.log('✅ Created users');

  // Create Resource Items
  const library = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-library' } });
  const lab4 = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab4' } });
  const lab9 = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab9' } });
  const bioLab = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-bio-lab' } });
  const cafeteria = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cafeteria' } });
  const printHouse = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-print' } });
  const itDept = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-it' } });

  const resources = [
    // Library Books
    { name: 'Mein Kampf by Adolf Hitler (#44021)', type: 'BOOK', quantity: 1, currentQuantity: 0, locationId: library!.id },
    { name: 'The Great Gatsby by F. Scott Fitzgerald (#44022)', type: 'BOOK', quantity: 1, currentQuantity: 1, locationId: library!.id },
    { name: 'To Kill a Mockingbird by Harper Lee (#44023)', type: 'BOOK', quantity: 1, currentQuantity: 1, locationId: library!.id },
    { name: 'Introduction to Computer Science', type: 'BOOK', quantity: 5, currentQuantity: 3, locationId: library!.id },
    { name: 'Data Structures and Algorithms', type: 'BOOK', quantity: 3, currentQuantity: 2, locationId: library!.id },
    { name: 'Database Systems', type: 'BOOK', quantity: 4, currentQuantity: 4, locationId: library!.id },
    { name: 'Library Desk', type: 'LIBRARY_FURNITURE', quantity: 10, currentQuantity: 10, locationId: library!.id },
    { name: 'Library Chair', type: 'LIBRARY_FURNITURE', quantity: 50, currentQuantity: 48, locationId: library!.id },
    
    // Lab 4 Computers
    { name: 'Computer Lab4-001', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-002', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-003', type: 'COMPUTER', quantity: 1, currentQuantity: 0, locationId: lab4!.id },
    { name: 'Computer Lab4-004', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-005', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-006', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-007', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-008', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-009', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-010', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-011', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-012', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-013', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-014', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-015', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-016', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-017', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-018', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-019', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    { name: 'Computer Lab4-020', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab4!.id },
    
    // Lab 9 Computers
    { name: 'Computer Lab9-001', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-002', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-003', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-004', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-005', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-006', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-007', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-008', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-009', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-010', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-011', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-012', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-013', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-014', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-015', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-016', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-017', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-018', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-019', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-020', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-021', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-022', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-023', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-024', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-025', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-026', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-027', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-028', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    { name: 'Computer Lab9-029', type: 'COMPUTER', quantity: 1, currentQuantity: 1, locationId: lab9!.id },
    
    // Bio Lab Equipment
    { name: 'Microscope BioLab-001', type: 'LAB_EQUIPMENT', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
    { name: 'Microscope BioLab-002', type: 'LAB_EQUIPMENT', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
    { name: 'Incubator Unit 4', type: 'LAB_EQUIPMENT', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
    { name: 'Centrifuge', type: 'LAB_EQUIPMENT', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
    { name: 'Autoclave', type: 'LAB_EQUIPMENT', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
    
    // Cafeteria Equipment
    { name: 'Big Dish Preparing Pot #1', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #2', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #3', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #4', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #5', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #6', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #7', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #8', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #9', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #10', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #11', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #12', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #13', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #14', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #15', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #16', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #17', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #18', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Big Dish Preparing Pot #19', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    { name: 'Injera Maker', type: 'MAINTENANCE_SUPPLY', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
    
    // Print House Supplies
    { name: 'A4 Paper Ream', type: 'PAPER', quantity: 100, currentQuantity: 15, locationId: printHouse!.id },
    { name: 'A3 Paper Ream', type: 'PAPER', quantity: 50, currentQuantity: 8, locationId: printHouse!.id },
    { name: 'Black Ink Cartridge', type: 'INK', quantity: 20, currentQuantity: 3, locationId: printHouse!.id },
    { name: 'Color Ink Cartridge', type: 'INK', quantity: 15, currentQuantity: 2, locationId: printHouse!.id },
    { name: 'Toner Cartridge', type: 'TONER', quantity: 10, currentQuantity: 1, locationId: printHouse!.id },
    
    // IT Department
    { name: 'Network Switch', type: 'NETWORK_EQUIPMENT', quantity: 5, currentQuantity: 5, locationId: itDept!.id },
    { name: 'Router', type: 'NETWORK_EQUIPMENT', quantity: 3, currentQuantity: 3, locationId: itDept!.id },
    { name: 'Server Rack', type: 'NETWORK_EQUIPMENT', quantity: 2, currentQuantity: 2, locationId: itDept!.id },
  ];

  for (const resource of resources) {
    await prisma.resourceItem.create({
      data: resource,
    });
  }

  console.log('✅ Created resource items');

  // Create some sample alerts
  const librarian = await prisma.user.findUnique({ where: { username: 'librarian' } });
  const cafeteriaUser = await prisma.user.findUnique({ where: { username: 'cafeteria' } });
  const printPersonnel = await prisma.user.findUnique({ where: { username: 'printpersonnel' } });
  const itStaff = await prisma.user.findUnique({ where: { username: 'itstaff' } });

  const alerts = [
    {
      locationId: printHouse!.id,
      alertType: 'DEPLETION',
      urgency: 'MEDIUM',
      message: 'A4 Paper stock dropped below 20%',
      submittedBy: printPersonnel!.id,
      status: 'PENDING',
    },
    {
      locationId: cafeteria!.id,
      alertType: 'EQUIPMENT_BREAKDOWN',
      urgency: 'CRITICAL',
      message: 'Injera maker broke and we\'re not giving food anymore. Students are starving',
      submittedBy: cafeteriaUser!.id,
      status: 'PENDING',
    },
    {
      locationId: bioLab!.id,
      alertType: 'MAINTENANCE',
      urgency: 'HIGH',
      message: 'Incubator Unit 4 reporting erratic temperature',
      submittedBy: librarian!.id,
      status: 'PENDING',
    },
    {
      locationId: lab4!.id,
      alertType: 'INVENTORY_CHANGE',
      urgency: 'LOW',
      message: 'Computer Lab4-003 moved to Lab9',
      submittedBy: itStaff!.id,
      status: 'PENDING',
    },
  ];

  for (const alert of alerts) {
    await prisma.resourceAlert.create({
      data: alert,
    });
  }

  console.log('✅ Created sample alerts');

  // Create some book lendings
  const book44021 = await prisma.resourceItem.findFirst({ where: { name: 'Mein Kampf by Adolf Hitler (#44021)' } });
  if (book44021 && librarian) {
    await prisma.bookLending.create({
      data: {
        bookId: book44021.id,
        borrowerName: 'Naol Mideksa',
        borrowerId: 'ugr/5680/17',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        librarianId: librarian.id,
        status: 'LENT',
      },
    });
  }

  console.log('✅ Created book lending');

  // Create some usage data for burn rate predictions
  const a4Paper = await prisma.resourceItem.findFirst({ where: { name: 'A4 Paper Ream' } });
  if (a4Paper && printPersonnel) {
    await prisma.usageData.createMany({
      data: [
        { resourceId: a4Paper.id, usageRate: 5.2, submittedBy: printPersonnel.id },
        { resourceId: a4Paper.id, usageRate: 4.8, submittedBy: printPersonnel.id },
        { resourceId: a4Paper.id, usageRate: 5.5, submittedBy: printPersonnel.id },
        { resourceId: a4Paper.id, usageRate: 4.9, submittedBy: printPersonnel.id },
        { resourceId: a4Paper.id, usageRate: 5.1, submittedBy: printPersonnel.id },
      ],
    });
  }

  console.log('✅ Created usage data');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
