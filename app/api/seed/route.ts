export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Use POST to seed the database" });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seed...');

    // Delete child records first (in correct order to avoid foreign key violations)
    console.log('🗑️ Deleting ALL old data...');
    
    // Delete records that reference users FIRST
    await prisma.message.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.telegramLink.deleteMany({});
    await prisma.usageData.deleteMany({});
    await prisma.requisition.deleteMany({});
    await prisma.bookLending.deleteMany({});
    await prisma.resourceMovement.deleteMany({});
    await prisma.resourceAlert.deleteMany({});
    await prisma.maintenanceAssignment.deleteMany({});
    
    // Delete all resource items (they reference locations)
    await prisma.resourceItem.deleteMany({});
    
    // Delete ALL locations (they reference campuses)
    await prisma.resourceLocation.deleteMany({});
    
    // Delete ALL users (now safe since nothing references them)
    await prisma.user.deleteMany({});
    
    // Delete ALL campuses (now safe since nothing references them)
    await prisma.campus.deleteMany({});
    
    console.log('✅ Deleted all old data');

    // Create ONLY Hachalu Hundesa Campus
    const hachaluCampus = await prisma.campus.create({
      data: {
        id: 'campus-hachalu',
        name: 'Hachalu Hundesa Campus',
      },
    });

    console.log('✅ Created/updated campus');

    // Create Resource Locations (only Hachalu Campus) - MAXIMALIST
    const locations = [
      // Library
      { id: 'loc-hachalu-library', name: 'Main Library', type: 'LIBRARY', campusId: hachaluCampus.id },
      
      // Computer Labs (Lab 1-9)
      { id: 'loc-hachalu-lab1', name: 'Computer Lab 1', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab2', name: 'Computer Lab 2', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab3', name: 'Computer Lab 3', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab4', name: 'Computer Lab 4', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab5', name: 'Computer Lab 5', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab6', name: 'Computer Lab 6', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab7', name: 'Computer Lab 7', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab8', name: 'Computer Lab 8', type: 'LAB', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lab9', name: 'Computer Lab 9', type: 'LAB', campusId: hachaluCampus.id },
      
      // Biology Lab
      { id: 'loc-hachalu-bio-lab', name: 'Biology Lab', type: 'LAB', campusId: hachaluCampus.id },
      
      // Cafeteria
      { id: 'loc-hachalu-cafeteria', name: 'HHC CAMPUS', type: 'CAFETERIA', campusId: hachaluCampus.id },
      
      // Print House
      { id: 'loc-hachalu-print', name: 'Print House', type: 'PRINT_HOUSE', campusId: hachaluCampus.id },
      
      // Lecture Halls (LH01-04) - Whiteboards
      { id: 'loc-hachalu-lh01', name: 'Lecture Hall LH01', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lh02', name: 'Lecture Hall LH02', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lh03', name: 'Lecture Hall LH03', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-lh04', name: 'Lecture Hall LH04', type: 'CLASSROOM', campusId: hachaluCampus.id },
      
      // Classrooms (CR01-15) - Desks
      { id: 'loc-hachalu-cr01', name: 'Classroom CR01', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr02', name: 'Classroom CR02', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr03', name: 'Classroom CR03', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr04', name: 'Classroom CR04', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr05', name: 'Classroom CR05', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr06', name: 'Classroom CR06', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr07', name: 'Classroom CR07', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr08', name: 'Classroom CR08', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr09', name: 'Classroom CR09', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr10', name: 'Classroom CR10', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr11', name: 'Classroom CR11', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr12', name: 'Classroom CR12', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr13', name: 'Classroom CR13', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr14', name: 'Classroom CR14', type: 'CLASSROOM', campusId: hachaluCampus.id },
      { id: 'loc-hachalu-cr15', name: 'Classroom CR15', type: 'CLASSROOM', campusId: hachaluCampus.id },
      
      // IT Department
      { id: 'loc-hachalu-it', name: 'IT Department', type: 'IT_DEPARTMENT', campusId: hachaluCampus.id },
      
      // Finance Office
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

    console.log('✅ Created locations');

    // Create Users
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

    // Get all locations
    const library = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-library' } });
    const labs = await Promise.all([
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab1' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab2' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab3' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab4' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab5' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab6' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab7' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab8' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lab9' } }),
    ]);
    const bioLab = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-bio-lab' } });
    const cafeteria = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cafeteria' } });
    const printHouse = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-print' } });
    const lectureHalls = await Promise.all([
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lh01' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lh02' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lh03' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-lh04' } }),
    ]);
    const classrooms = await Promise.all([
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr01' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr02' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr03' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr04' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr05' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr06' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr07' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr08' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr09' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr10' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr11' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr12' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr13' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr14' } }),
      prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-cr15' } }),
    ]);
    const itDept = await prisma.resourceLocation.findUnique({ where: { id: 'loc-hachalu-it' } });

    if (!library || labs.some(l => !l) || !bioLab || !cafeteria || !printHouse || lectureHalls.some(l => !l) || classrooms.some(l => !l) || !itDept) {
      throw new Error("Locations not found after creation");
    }

    // Create Resource Items - MAXIMALIST with specific types
    const resources: any[] = [];
    
    // Library Resources - Books with proper titles and authors
    const bookTitles = [
      'Mein Kampf by Adolf Hitler',
      'The Great Gatsby by F. Scott Fitzgerald',
      'To Kill a Mockingbird by Harper Lee',
      '1984 by George Orwell',
      'Pride and Prejudice by Jane Austen',
      'The Catcher in the Rye by J.D. Salinger',
      'Lord of the Flies by William Golding',
      'Animal Farm by George Orwell',
      'Brave New World by Aldous Huxley',
      'The Lord of the Rings by J.R.R. Tolkien',
      'Harry Potter and the Philosopher\'s Stone by J.K. Rowling',
      'The Hobbit by J.R.R. Tolkien',
      'The Chronicles of Narnia by C.S. Lewis',
      'Jane Eyre by Charlotte Brontë',
      'Wuthering Heights by Emily Brontë',
      'Moby Dick by Herman Melville',
      'The Adventures of Huckleberry Finn by Mark Twain',
      'The Scarlet Letter by Nathaniel Hawthorne',
      'Frankenstein by Mary Shelley',
      'Dracula by Bram Stoker',
      'War and Peace by Leo Tolstoy',
      'Crime and Punishment by Fyodor Dostoevsky',
      'The Brothers Karamazov by Fyodor Dostoevsky',
      'Anna Karenina by Leo Tolstoy',
      'Les Misérables by Victor Hugo',
      'The Count of Monte Cristo by Alexandre Dumas',
      'Don Quixote by Miguel de Cervantes',
      'The Odyssey by Homer',
      'The Iliad by Homer',
      'The Divine Comedy by Dante Alighieri',
      'The Canterbury Tales by Geoffrey Chaucer',
      'Hamlet by William Shakespeare',
      'Romeo and Juliet by William Shakespeare',
      'Macbeth by William Shakespeare',
      'Othello by William Shakespeare',
      'King Lear by William Shakespeare',
      'A Midsummer Night\'s Dream by William Shakespeare',
      'The Tempest by William Shakespeare',
      'Julius Caesar by William Shakespeare',
      'The Merchant of Venice by William Shakespeare',
      'Much Ado About Nothing by William Shakespeare',
      'Twelfth Night by William Shakespeare',
      'As You Like It by William Shakespeare',
      'The Taming of the Shrew by William Shakespeare',
      'Richard III by William Shakespeare',
      'Henry V by William Shakespeare',
      'Antony and Cleopatra by William Shakespeare',
      'Coriolanus by William Shakespeare',
      'Timon of Athens by William Shakespeare',
      'Titus Andronicus by William Shakespeare',
      'Pericles by William Shakespeare',
      'Cymbeline by William Shakespeare',
      'The Winter\'s Tale by William Shakespeare',
      'The Two Gentlemen of Verona by William Shakespeare',
      'Love\'s Labour\'s Lost by William Shakespeare',
      'The Comedy of Errors by William Shakespeare',
      'All\'s Well That Ends Well by William Shakespeare',
      'Measure for Measure by William Shakespeare',
      'Troilus and Cressida by William Shakespeare',
      'The Merry Wives of Windsor by William Shakespeare',
      'King John by William Shakespeare',
      'Richard II by William Shakespeare',
      'Henry IV, Part 1 by William Shakespeare',
      'Henry IV, Part 2 by William Shakespeare',
      'Henry VI, Part 1 by William Shakespeare',
      'Henry VI, Part 2 by William Shakespeare',
      'Henry VI, Part 3 by William Shakespeare',
      'Henry VIII by William Shakespeare',
    ];
    
    for (let i = 44021; i <= 44100; i++) {
      const bookIndex = i - 44021;
      const bookTitle = bookIndex < bookTitles.length 
        ? `${bookTitles[bookIndex]} (#${i})`
        : `Book #${i}`;
      
      resources.push({
        name: bookTitle,
        type: 'BOOK',
        quantity: 1,
        currentQuantity: Math.random() > 0.3 ? 1 : 0, // Some books are lent
        locationId: library!.id,
      });
    }
    resources.push(
      { name: 'Library Desk', type: 'DESK', quantity: 25, currentQuantity: 25, locationId: library!.id },
      { name: 'Library Chair', type: 'CHAIR', quantity: 100, currentQuantity: 98, locationId: library!.id },
      { name: 'Bookshelf Unit', type: 'FURNITURE', quantity: 30, currentQuantity: 30, locationId: library!.id },
    );

    // Computer Labs (Lab 1-9) - Computers
    let computerCounter = 1;
    labs.forEach((lab, labIndex) => {
      if (!lab) return;
      const labNum = labIndex + 1;
      const computerCount = labNum <= 3 ? 25 : labNum <= 6 ? 30 : 35; // More computers in later labs
      
      for (let i = 1; i <= computerCount; i++) {
        resources.push({
          name: `Computer ${String(computerCounter).padStart(3, '0')}`,
          type: 'COMPUTER',
          quantity: 1,
          currentQuantity: Math.random() > 0.1 ? 1 : 0, // Some might be moved
          locationId: lab.id,
        });
        computerCounter++;
      }
      
      // Lab chairs and desks
      resources.push(
        { name: `Lab ${labNum} Desk`, type: 'DESK', quantity: computerCount, currentQuantity: computerCount, locationId: lab.id },
        { name: `Lab ${labNum} Chair`, type: 'CHAIR', quantity: computerCount, currentQuantity: computerCount - 2, locationId: lab.id },
      );
    });

    // Bio Lab Equipment
    resources.push(
      { name: 'Microscope BioLab-001', type: 'MICROSCOPE', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
      { name: 'Microscope BioLab-002', type: 'MICROSCOPE', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
      { name: 'Incubator Unit 4', type: 'INCUBATOR', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
      { name: 'Centrifuge', type: 'CENTRIFUGE', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
      { name: 'Autoclave', type: 'AUTOCLAVE', quantity: 1, currentQuantity: 1, locationId: bioLab!.id },
      { name: 'Chemical Storage Cabinet', type: 'CABINET', quantity: 3, currentQuantity: 3, locationId: bioLab!.id },
      { name: 'Sodium Chloride', type: 'CHEMICAL', quantity: 50, currentQuantity: 42, locationId: bioLab!.id },
      { name: 'Hydrochloric Acid', type: 'CHEMICAL', quantity: 20, currentQuantity: 15, locationId: bioLab!.id },
      { name: 'Petri Dish', type: 'LAB_SUPPLY', quantity: 200, currentQuantity: 187, locationId: bioLab!.id },
    );

    // Cafeteria Equipment
    for (let i = 1; i <= 19; i++) {
      resources.push({
        name: `Big Dish Preparing Pot #${i}`,
        type: 'POT',
        quantity: 1,
        currentQuantity: 1,
        locationId: cafeteria!.id,
      });
    }
    resources.push(
      { name: 'Injera Maker', type: 'COOKING_EQUIPMENT', quantity: 1, currentQuantity: 1, locationId: cafeteria!.id },
      { name: 'Cafeteria Table', type: 'TABLE', quantity: 30, currentQuantity: 30, locationId: cafeteria!.id },
      { name: 'Cafeteria Chair', type: 'CHAIR', quantity: 120, currentQuantity: 118, locationId: cafeteria!.id },
      { name: 'Serving Tray', type: 'TRAY', quantity: 50, currentQuantity: 48, locationId: cafeteria!.id },
    );

    // Print House Supplies
    resources.push(
      { name: 'A4 Paper Ream', type: 'PAPER', quantity: 100, currentQuantity: 15, locationId: printHouse!.id },
      { name: 'A3 Paper Ream', type: 'PAPER', quantity: 50, currentQuantity: 8, locationId: printHouse!.id },
      { name: 'Black Ink Cartridge', type: 'INK', quantity: 20, currentQuantity: 3, locationId: printHouse!.id },
      { name: 'Color Ink Cartridge', type: 'INK', quantity: 15, currentQuantity: 2, locationId: printHouse!.id },
      { name: 'Toner Cartridge', type: 'TONER', quantity: 10, currentQuantity: 1, locationId: printHouse!.id },
      { name: 'Printer', type: 'PRINTER', quantity: 5, currentQuantity: 5, locationId: printHouse!.id },
    );

    // Lecture Halls (LH01-04) - Whiteboards
    lectureHalls.forEach((lh, idx) => {
      if (!lh) return;
      const hallNum = idx + 1;
      resources.push(
        { name: `Whiteboard LH0${hallNum}-1`, type: 'WHITEBOARD', quantity: 1, currentQuantity: 1, locationId: lh.id },
        { name: `Whiteboard LH0${hallNum}-2`, type: 'WHITEBOARD', quantity: 1, currentQuantity: 1, locationId: lh.id },
        { name: `Projector LH0${hallNum}`, type: 'PROJECTOR', quantity: 1, currentQuantity: 1, locationId: lh.id },
        { name: `Lecture Hall LH0${hallNum} Chair`, type: 'CHAIR', quantity: 150, currentQuantity: 148, locationId: lh.id },
      );
    });

    // Classrooms (CR01-15) - Desks
    classrooms.forEach((cr, idx) => {
      if (!cr) return;
      const roomNum = idx + 1;
      resources.push(
        { name: `Desk CR${String(roomNum).padStart(2, '0')}`, type: 'DESK', quantity: 30, currentQuantity: 30, locationId: cr.id },
        { name: `Chair CR${String(roomNum).padStart(2, '0')}`, type: 'CHAIR', quantity: 30, currentQuantity: 29, locationId: cr.id },
        { name: `Whiteboard CR${String(roomNum).padStart(2, '0')}`, type: 'WHITEBOARD', quantity: 1, currentQuantity: 1, locationId: cr.id },
      );
    });

    // IT Department
    resources.push(
      { name: 'Network Switch', type: 'NETWORK_EQUIPMENT', quantity: 5, currentQuantity: 5, locationId: itDept!.id },
      { name: 'Router', type: 'ROUTER', quantity: 3, currentQuantity: 3, locationId: itDept!.id },
      { name: 'Server Rack', type: 'SERVER_RACK', quantity: 2, currentQuantity: 2, locationId: itDept!.id },
      { name: 'Server Computer', type: 'COMPUTER', quantity: 8, currentQuantity: 8, locationId: itDept!.id },
    );

    // Delete existing data in correct order (child records first)
    await prisma.usageData.deleteMany({});
    await prisma.requisition.deleteMany({});
    await prisma.bookLending.deleteMany({});
    await prisma.resourceMovement.deleteMany({});
    await prisma.resourceAlert.deleteMany({});
    await prisma.maintenanceAssignment.deleteMany({});
    await prisma.resourceItem.deleteMany({});
    for (const resource of resources) {
      await prisma.resourceItem.create({ data: resource });
    }

    console.log('✅ Created resources');

    // Get users for alerts
    const librarian = await prisma.user.findUnique({ where: { username: 'librarian' } });
    const cafeteriaUser = await prisma.user.findUnique({ where: { username: 'cafeteria' } });
    const printPersonnel = await prisma.user.findUnique({ where: { username: 'printpersonnel' } });
    const itStaff = await prisma.user.findUnique({ where: { username: 'itstaff' } });

    if (!librarian || !cafeteriaUser || !printPersonnel || !itStaff) {
      throw new Error("Users not found after creation");
    }

    // Create new alerts (already deleted above)
    const alerts = [
      {
        locationId: printHouse!.id,
        alertType: 'DEPLETION',
        urgency: 'SERIOUS',
        message: 'A4 Paper stock dropped below 20%',
        submittedBy: printPersonnel.id,
        status: 'PENDING',
      },
      {
        locationId: cafeteria!.id,
        alertType: 'EQUIPMENT_BREAKDOWN',
        urgency: 'URGENT',
        message: 'Injera maker broke and we\'re not giving food anymore. Students are starving',
        submittedBy: cafeteriaUser.id,
        status: 'PENDING',
      },
      {
        locationId: bioLab!.id,
        alertType: 'MAINTENANCE',
        urgency: 'SERIOUS',
        message: 'Incubator Unit 4 reporting erratic temperature',
        submittedBy: librarian.id,
        status: 'PENDING',
      },
      {
        locationId: labs[3]!.id, // Lab 4
        alertType: 'INVENTORY_CHANGE',
        urgency: 'DAY_TO_DAY',
        message: 'Computer 003 moved to Lab9',
        submittedBy: itStaff.id,
        status: 'PENDING',
      },
    ];

    for (const alert of alerts) {
      await prisma.resourceAlert.create({ data: alert });
    }

    console.log('✅ Created alerts');

    // Create book lending (already deleted above)
    const book44021 = await prisma.resourceItem.findFirst({ where: { name: 'Mein Kampf by Adolf Hitler (#44021)' } });
    if (book44021) {
      await prisma.bookLending.create({
        data: {
          bookId: book44021.id,
          borrowerName: 'Naol Mideksa',
          borrowerId: 'ugr/5680/17',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          librarianId: librarian.id,
          status: 'LENT',
        },
      });
    }

    console.log('✅ Created book lending');

    // Create usage data (already deleted above)
    const a4Paper = await prisma.resourceItem.findFirst({ where: { name: 'A4 Paper Ream' } });
    if (a4Paper) {
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

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully!',
      stats: {
        campuses: 3,
        locations: locations.length,
        users: users.length,
        resources: resources.length,
        alerts: alerts.length,
      }
    });
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: 'Failed to seed database', 
        details: error.message || String(error),
        code: error.code,
        meta: error.meta,
      },
      { status: 500 }
    );
  }
}

