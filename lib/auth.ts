import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  campusId?: string | null;
}

// Demo credentials mapping
const DEMO_CREDENTIALS: Record<string, string> = {
  universityadmin: "university admin",
  campusadmin: "campus admin",
  librarian: "librarian",
  printpersonnel: "print personnel",
  financestaff: "finance staff",
  labmanager: "lab manager",
  itstaff: "it staff",
  facilities: "facilities",
  security: "security",
  investigator: "investigator",
  maintenancestaff: "maintenance staff",
};

export async function verifyCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const normalizedUsername = username.toLowerCase().trim();
  const expectedPassword = DEMO_CREDENTIALS[normalizedUsername];

  if (!expectedPassword || password !== expectedPassword) {
    return null;
  }

  // For demo, create or get user from database
  let user = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (!user) {
    // Map username to role enum
    const roleMap: Record<string, string> = {
      universityadmin: "UNIVERSITY_ADMIN",
      campusadmin: "CAMPUS_ADMIN",
      librarian: "LIBRARIAN",
      printpersonnel: "PRINT_PERSONNEL",
      financestaff: "FINANCE_STAFF",
      labmanager: "LAB_MANAGER",
      itstaff: "IT_STAFF",
      facilities: "FACILITIES",
      security: "SECURITY",
      investigator: "INVESTIGATOR",
      maintenancestaff: "MAINTENANCE_STAFF",
    };

    // Create demo user
    user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: `${normalizedUsername}@ambou.edu.et`,
        password: await bcrypt.hash(password, 10),
        role: roleMap[normalizedUsername] as any,
      },
    });
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    campusId: user.campusId,
  };
}

