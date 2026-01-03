import { prisma } from "./prisma";

export interface BurnRateResult {
  averageDailyUsage: number;
  daysUntilDepletion: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number; // 0-1, based on number of data points
}

/**
 * Calculate burn rate for a resource based on historical usage data
 */
export async function calculateBurnRate(resourceId: string): Promise<BurnRateResult | null> {
  const resource = await prisma.resourceItem.findUnique({
    where: { id: resourceId },
    include: {
      usageHistory: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 30, // Last 30 data points
      },
    },
  });

  if (!resource || resource.usageHistory.length === 0) {
    return null;
  }

  // Calculate average daily usage
  const totalUsage = resource.usageHistory.reduce(
    (sum, entry) => sum + entry.usageRate,
    0
  );
  const averageDailyUsage = totalUsage / resource.usageHistory.length;

  // Calculate days until depletion
  const daysUntilDepletion = Math.floor(
    resource.currentQuantity / averageDailyUsage
  );

  // Determine urgency
  let urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  if (daysUntilDepletion <= 7) {
    urgency = "CRITICAL";
  } else if (daysUntilDepletion <= 14) {
    urgency = "HIGH";
  } else if (daysUntilDepletion <= 30) {
    urgency = "MEDIUM";
  } else {
    urgency = "LOW";
  }

  // Calculate confidence based on number of data points
  const confidence = Math.min(resource.usageHistory.length / 10, 1);

  return {
    averageDailyUsage,
    daysUntilDepletion,
    urgency,
    confidence,
  };
}

/**
 * Calculate burn rate for all resources in a location
 */
export async function calculateBurnRatesForLocation(locationId: string) {
  const resources = await prisma.resourceItem.findMany({
    where: { locationId },
    include: {
      usageHistory: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 30,
      },
    },
  });

  const results = await Promise.all(
    resources.map(async (resource) => {
      if (resource.usageHistory.length === 0) {
        return {
          resourceId: resource.id,
          resourceName: resource.name,
          burnRate: null,
        };
      }

      const burnRate = await calculateBurnRate(resource.id);
      return {
        resourceId: resource.id,
        resourceName: resource.name,
        burnRate,
      };
    })
  );

  return results;
}

/**
 * Update all resource depletion predictions
 */
export async function updateAllDepletionPredictions() {
  const resources = await prisma.resourceItem.findMany({
    include: {
      usageHistory: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 30,
      },
    },
  });

  const updates = await Promise.all(
    resources.map(async (resource) => {
      if (resource.usageHistory.length === 0) {
        return null;
      }

      const burnRate = await calculateBurnRate(resource.id);
      if (!burnRate) return null;

      return prisma.resourceItem.update({
        where: { id: resource.id },
        data: {
          daysUntilDepletion: burnRate.daysUntilDepletion,
        },
      });
    })
  );

  return updates.filter(Boolean);
}

