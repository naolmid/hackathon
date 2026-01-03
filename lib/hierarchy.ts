import { prisma } from "./prisma";

export interface HierarchyNode {
  id: string;
  name: string;
  type: "campus" | "location" | "resource";
  children?: HierarchyNode[];
}

/**
 * Get full hierarchy for a user based on their role
 */
export async function getUserHierarchy(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      campus: {
        include: {
          resourceLocations: {
            include: {
              resources: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  // University Admin sees all campuses
  if (user.role === "UNIVERSITY_ADMIN") {
    const campuses = await prisma.campus.findMany({
      include: {
        resourceLocations: {
          include: {
            resources: true,
          },
        },
      },
    });

    return campuses.map((campus) => ({
      id: campus.id,
      name: campus.name,
      type: "campus" as const,
      children: campus.resourceLocations.map((location) => ({
        id: location.id,
        name: location.name,
        type: "location" as const,
        children: location.resources.map((resource) => ({
          id: resource.id,
          name: resource.name,
          type: "resource" as const,
        })),
      })),
    }));
  }

  // Campus Admin sees their campus
  if (user.role === "CAMPUS_ADMIN" && user.campus) {
    return [
      {
        id: user.campus.id,
        name: user.campus.name,
        type: "campus" as const,
        children: user.campus.resourceLocations.map((location) => ({
          id: location.id,
          name: location.name,
          type: "location" as const,
          children: location.resources.map((resource) => ({
            id: resource.id,
            name: resource.name,
            type: "resource" as const,
          })),
        })),
      },
    ];
  }

  // Personnel see their location
  if (user.locationId) {
    const location = await prisma.resourceLocation.findUnique({
      where: { id: user.locationId },
      include: {
        resources: true,
      },
    });

    if (location) {
      return [
        {
          id: location.id,
          name: location.name,
          type: "location" as const,
          children: location.resources.map((resource) => ({
            id: resource.id,
            name: resource.name,
            type: "resource" as const,
          })),
        },
      ];
    }
  }

  return [];
}

/**
 * Get all campuses (for University Admin)
 */
export async function getAllCampuses() {
  return await prisma.campus.findMany({
    include: {
      resourceLocations: {
        include: {
          _count: {
            select: { resources: true },
          },
        },
      },
    },
  });
}

/**
 * Get locations for a campus
 */
export async function getLocationsByCampus(campusId: string) {
  return await prisma.resourceLocation.findMany({
    where: { campusId },
    include: {
      _count: {
        select: { resources: true },
      },
    },
  });
}

/**
 * Get resources for a location
 */
export async function getResourcesByLocation(locationId: string) {
  const resources = await prisma.resourceItem.findMany({
    where: { locationId },
    include: {
      _count: {
        select: {
          usageHistory: true,
          requisitions: true,
          bookLendings: true,
        },
      },
      bookLendings: {
        where: {
          status: "LENT",
        },
        orderBy: {
          lentDate: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Add lending status to resources
  return resources.map((resource) => {
    const isLent = resource.type === "BOOK" && resource.currentQuantity === 0;
    const activeLending = resource.bookLendings?.[0] || null;
    
    return {
      ...resource,
      isLent,
      activeLending,
    };
  });
}

