import prisma from "../config/prisma/prisma.js";
import { Role } from "@prisma/client";

export async function seedForHireguy() {
  console.log("🌱 Starting seed/reassign for user 'hireguy'...");

  // 1. Ensure Tenant exists
  const companyName = "Bruce Wayne Corp";
  let tenant = await prisma.tenants.findFirst({
    where: { companyName },
  });

  if (!tenant) {
    tenant = await prisma.tenants.create({
      data: { companyName },
    });
    console.log(`✅ Created tenant: ${tenant.companyName} (${tenant.tenantId})`);
  } else {
    console.log(`ℹ️ Found tenant: ${tenant.companyName} (${tenant.tenantId})`);
  }

  // 2. Find or create user hireguy
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "hireguy" },
        { email: "hireguy" },
        { email: { contains: "hireguy", mode: "insensitive" } },
      ],
    },
  });

  if (!user) {
    console.log("Creating user 'hireguy' in database...");
    user = await prisma.user.create({
      data: {
        username: "hireguy",
        email: "hireguy@waynecorp.com",
        firstName: "Hire",
        lastName: "Guy",
        role: Role.HIRING_MANAGER,
        tenantId: tenant.tenantId,
        profileComplete: true,
        provider: "KEYCLOAK",
      },
    });
    console.log(`✅ Created user: ${user.username} (${user.id})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: Role.HIRING_MANAGER,
        tenantId: tenant.tenantId,
        profileComplete: true,
      },
    });
    console.log(`✅ Updated user ${user.username || user.email} with HIRING_MANAGER role and tenantId.`);
  }

  // 3. Reassign existing openings to hireguy
  const updateResult = await prisma.opening.updateMany({
    where: { tenantId: tenant.tenantId },
    data: { hiringManagerId: user.id },
  });

  console.log(`📋 Reassigned ${updateResult.count} openings to Hiring Manager ${user.username || user.email} (${user.id})`);

  // 5. Re-evaluate any failed or pending profiles
  const pendingOrFailedProfiles = await prisma.hiringProfile.findMany({
    where: {
      isDeleted: false,
      opening: { tenantId: tenant.tenantId },
      recommendationStatus: { in: ["FAILED", "PENDING"] },
    },
    select: { id: true },
  });

  if (pendingOrFailedProfiles.length > 0) {
    console.log(`🔄 Re-evaluating ${pendingOrFailedProfiles.length} failed/pending profiles...`);
    const { recommendationDispatcher } = await import("../services/recommendation/recommendationDispatcher.js");
    for (const p of pendingOrFailedProfiles) {
      await prisma.hiringProfile.update({
        where: { id: p.id },
        data: { recommendationStatus: "PENDING" },
      });
      recommendationDispatcher.dispatch(p.id);
    }
  }

  // 4. Verify count
  const myOpeningsCount = await prisma.opening.count({
    where: {
      tenantId: tenant.tenantId,
      hiringManagerId: user.id,
    },
  });

  console.log(`🎉 Total active openings for '${user.username}': ${myOpeningsCount}`);
  return { user, count: myOpeningsCount };
}

export default seedForHireguy;
