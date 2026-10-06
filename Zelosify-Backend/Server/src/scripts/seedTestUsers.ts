import axios from "axios";
import dotenv from "dotenv";
import prisma from "../config/prisma/prisma.js";
import { getAdminToken } from "../utils/keycloak/getAdminToken.js";
import { Role } from "@prisma/client";

dotenv.config();

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080/auth";
const REALM = process.env.KEYCLOAK_REALM || "Zelosify";

interface TestUserDef {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
}

const TEST_USERS: TestUserDef[] = [
  {
    username: "zen",
    email: "zen@example.com",
    firstName: "Zen",
    lastName: "Tester",
    password: "password123",
    role: Role.IT_VENDOR,
  },
  {
    username: "user0",
    email: "vendor@example.com",
    firstName: "Test",
    lastName: "Vendor",
    password: "password123",
    role: Role.IT_VENDOR,
  },
  {
    username: "user1",
    email: "manager@example.com",
    firstName: "Test",
    lastName: "Manager",
    password: "password123",
    role: Role.HIRING_MANAGER,
  },
];

async function seedKeycloakAndDb() {
  console.log("🚀 Starting Keycloak & DB test user provisioning...");

  // 1. Ensure Tenant exists
  const tenant = await prisma.tenants.findFirst({
    where: { companyName: "Bruce Wayne Corp" },
  });

  if (!tenant) {
    throw new Error("Bruce Wayne Corp tenant not found. Please run seedOpenings first.");
  }
  console.log(`🏢 Using Tenant: ${tenant.companyName} (${tenant.tenantId})`);

  // 2. Get Keycloak Admin Token
  const adminToken = await getAdminToken();
  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  for (const userDef of TEST_USERS) {
    console.log(`\n👤 Provisioning Keycloak user: ${userDef.username} (${userDef.email})...`);

    // Check if user exists in Keycloak
    const searchRes = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
      {
        headers: authHeaders,
        params: { username: userDef.username },
      }
    );

    let keycloakId: string;

    if (searchRes.data && searchRes.data.length > 0) {
      keycloakId = searchRes.data[0].id;
      console.log(`ℹ️ Keycloak user already exists with ID: ${keycloakId}. Resetting password...`);
      // Reset password
      await axios.put(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${keycloakId}/reset-password`,
        {
          type: "password",
          value: userDef.password,
          temporary: false,
        },
        { headers: authHeaders }
      );
    } else {
      // Create Keycloak user
      const createRes = await axios.post(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
        {
          username: userDef.username,
          email: userDef.email,
          firstName: userDef.firstName,
          lastName: userDef.lastName,
          enabled: true,
          emailVerified: true,
          credentials: [
            {
              type: "password",
              value: userDef.password,
              temporary: false,
            },
          ],
        },
        { headers: authHeaders }
      );

      const locationHeader = createRes.headers.location;
      keycloakId = locationHeader.split("/").pop();
      console.log(`✅ Keycloak user created with ID: ${keycloakId}`);
    }

    // 3. Upsert user in PostgreSQL
    const dbUser = await prisma.user.upsert({
      where: {
        email_provider: {
          email: userDef.email,
          provider: "KEYCLOAK",
        },
      },
      update: {
        username: userDef.username,
        externalId: keycloakId,
        tenantId: tenant.tenantId,
        role: userDef.role,
        profileComplete: true,
      },
      create: {
        username: userDef.username,
        email: userDef.email,
        firstName: userDef.firstName,
        lastName: userDef.lastName,
        role: userDef.role,
        tenantId: tenant.tenantId,
        externalId: keycloakId,
        profileComplete: true,
        provider: "KEYCLOAK",
      },
    });

    console.log(`✅ Synced with DB User: ${dbUser.email} (Role: ${dbUser.role}, ID: ${dbUser.id})`);

    // If this is hiring manager user1, reassign openings to this user
    if (userDef.role === Role.HIRING_MANAGER) {
      const updated = await prisma.opening.updateMany({
        where: { tenantId: tenant.tenantId },
        data: { hiringManagerId: dbUser.id },
      });
      console.log(`📋 Assigned ${updated.count} openings to Hiring Manager ${dbUser.email}`);
    }
  }

  console.log("\n🎉 All test users successfully provisioned and ready!");
}

seedKeycloakAndDb()
  .catch((err) => {
    console.error("❌ Seeding failed:", err.response?.data || err.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
