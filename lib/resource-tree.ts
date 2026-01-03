import { prisma } from "./prisma";

export interface ResourceTreeNode {
  id: string;
  name: string;
  type: string;
  quantity: number;
  currentQuantity: number;
  daysUntilDepletion: number | null;
  children?: ResourceTreeNode[];
}

/**
 * Build a tree structure of resources for navigation
 */
export async function buildResourceTree(campusId?: string, locationId?: string) {
  if (locationId) {
    // Get resources for specific location
    const resources = await prisma.resourceItem.findMany({
      where: { locationId },
      include: {
        location: {
          include: {
            campus: true,
          },
        },
      },
    });

    return resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      quantity: resource.quantity,
      currentQuantity: resource.currentQuantity,
      daysUntilDepletion: resource.daysUntilDepletion,
    }));
  }

  if (campusId) {
    // Get all locations and their resources for a campus
    const locations = await prisma.resourceLocation.findMany({
      where: { campusId },
      include: {
        resources: true,
      },
    });

    return locations.map((location) => ({
      id: location.id,
      name: location.name,
      type: location.type,
      quantity: 0,
      currentQuantity: 0,
      daysUntilDepletion: null,
      children: location.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        quantity: resource.quantity,
        currentQuantity: resource.currentQuantity,
        daysUntilDepletion: resource.daysUntilDepletion,
      })),
    }));
  }

  // Get all campuses with their locations and resources
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
    type: "CAMPUS",
    quantity: 0,
    currentQuantity: 0,
    daysUntilDepletion: null,
    children: campus.resourceLocations.map((location) => ({
      id: location.id,
      name: location.name,
      type: location.type,
      quantity: 0,
      currentQuantity: 0,
      daysUntilDepletion: null,
      children: location.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        quantity: resource.quantity,
        currentQuantity: resource.currentQuantity,
        daysUntilDepletion: resource.daysUntilDepletion,
      })),
    })),
  }));
}

/**
 * Search resources across all levels
 */
export async function searchResources(query: string, campusId?: string) {
  const where: any = {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { type: { contains: query, mode: "insensitive" } },
    ],
  };

  if (campusId) {
    where.location = {
      campusId,
    };
  }

  const resources = await prisma.resourceItem.findMany({
    where,
    include: {
      location: {
        include: {
          campus: true,
        },
      },
    },
    take: 50,
  });

  return resources;
}

/**
 * Filter resources by type
 */
export async function filterResourcesByType(
  resourceType: string,
  locationId?: string
) {
  const where: any = {
    type: resourceType,
  };

  if (locationId) {
    where.locationId = locationId;
  }

  return await prisma.resourceItem.findMany({
    where,
    include: {
      location: {
        include: {
          campus: true,
        },
      },
    },
  });
}

