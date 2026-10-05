import prisma from "../config/prisma/prisma.js";
import { OpeningStatus } from "@prisma/client";

/**
 * Seeds the database with Bruce Wayne Corp tenant, hiring manager,
 * and at least 12 realistic contract openings.
 *
 * This script is fully idempotent: running it multiple times will
 * not create duplicate tenants or duplicate opening records.
 */
async function seedOpenings() {
  try {
    console.log("🌱 Starting idempotent database seeding...");

    // 1. Ensure Tenant exists
    const companyName = "Bruce Wayne Corp";
    let tenant = await prisma.tenants.findFirst({
      where: { companyName },
    });

    if (!tenant) {
      tenant = await prisma.tenants.create({
        data: {
          companyName,
        },
      });
      console.log(`✅ Created tenant: ${tenant.companyName} (${tenant.tenantId})`);
    } else {
      console.log(`ℹ️ Tenant already exists: ${tenant.companyName} (${tenant.tenantId})`);
    }

    // 2. Resolve Hiring Manager for this tenant
    const seedEmail = process.env.SEED_HIRING_MANAGER_EMAIL?.trim();
    let hiringManager: any = null;

    // Preference A: Environment variable SEED_HIRING_MANAGER_EMAIL if specified
    if (seedEmail) {
      hiringManager = await prisma.user.findFirst({
        where: {
          email: seedEmail,
          tenantId: tenant.tenantId,
        },
      });
      if (hiringManager) {
        console.log(
          `🎯 Found hiring manager matching SEED_HIRING_MANAGER_EMAIL (${seedEmail}): ${hiringManager.id}`
        );
      } else {
        console.log(
          `⚠️ SEED_HIRING_MANAGER_EMAIL specified (${seedEmail}) but not found in tenant. Checking existing managers...`
        );
      }
    }

    // Preference B: Existing HIRING_MANAGER user belonging to Bruce Wayne Corp
    if (!hiringManager) {
      hiringManager = await prisma.user.findFirst({
        where: {
          tenantId: tenant.tenantId,
          role: "HIRING_MANAGER",
        },
      });
      if (hiringManager) {
        console.log(
          `🏢 Using existing HIRING_MANAGER in ${companyName}: ${hiringManager.email} (${hiringManager.id})`
        );
      }
    }

    // Preference C: Fallback to seed user Lucius Fox
    if (!hiringManager) {
      const fallbackEmail = "lucius.fox@waynecorp.com";
      hiringManager = await prisma.user.upsert({
        where: {
          email_provider: {
            email: fallbackEmail,
            provider: "KEYCLOAK",
          },
        },
        update: {
          tenantId: tenant.tenantId,
          role: "HIRING_MANAGER",
          department: "Applied Sciences & Engineering",
        },
        create: {
          username: "lucius.fox",
          email: fallbackEmail,
          firstName: "Lucius",
          lastName: "Fox",
          role: "HIRING_MANAGER",
          department: "Applied Sciences & Engineering",
          tenantId: tenant.tenantId,
          externalId: "seed-hiring-manager-lucius-fox",
          profileComplete: true,
          provider: "KEYCLOAK",
        },
      });
      console.log(
        `👤 Created/verified fallback seed hiring manager: Lucius Fox (${hiringManager.id})`
      );
    }

    console.log(
      `✅ Using hiring manager: ${hiringManager.firstName || hiringManager.username || hiringManager.email} (${hiringManager.id})`
    );

    // 3. Define 12 diverse, realistic contract openings
    const now = new Date();
    const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const openingsData = [
      {
        title: "Senior React Frontend Engineer",
        description:
          "Build scalable, responsive web applications for Wayne Enterprise internal tooling and vendor portals using React 19, Next.js, and TypeScript.",
        location: "Remote (US/Eastern)",
        contractType: "Contract - 6 Months",
        experienceMin: 5,
        experienceMax: 8,
        requiredSkills: [
          "React",
          "TypeScript",
          "Next.js",
          "Redux Toolkit",
          "Tailwind CSS",
          "Jest",
          "Web Performance",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(180),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Lead Node.js Backend Engineer",
        description:
          "Design and implement high-throughput RESTful microservices, asynchronous task queues, and database access layers using Node.js and TypeScript.",
        location: "Gotham City, NJ (Hybrid)",
        contractType: "Contract - 12 Months",
        experienceMin: 7,
        experienceMax: 10,
        requiredSkills: [
          "Node.js",
          "Express",
          "TypeScript",
          "PostgreSQL",
          "Prisma",
          "Redis",
          "Docker",
          "REST API Design",
        ],
        postedDate: now,
        actionDate: addDays(21),
        expectedCompletionDate: addDays(365),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Senior Full Stack Engineer",
        description:
          "Deliver end-to-end features spanning modern Next.js client experiences, server actions, and relational PostgreSQL data models.",
        location: "Remote (US/Pacific)",
        contractType: "Contract-to-Hire",
        experienceMin: 5,
        experienceMax: 9,
        requiredSkills: [
          "React",
          "Node.js",
          "TypeScript",
          "Next.js",
          "PostgreSQL",
          "Prisma",
          "Tailwind CSS",
          "CI/CD",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(270),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Senior Java Backend Engineer",
        description:
          "Architect and maintain enterprise-grade transaction processing services and distributed event pipelines using Spring Boot and Kafka.",
        location: "Metropolis, NY (On-site)",
        contractType: "Contract - 9 Months",
        experienceMin: 6,
        experienceMax: 10,
        requiredSkills: [
          "Java 21",
          "Spring Boot",
          "Microservices",
          "Apache Kafka",
          "PostgreSQL",
          "Kubernetes",
          "JUnit",
        ],
        postedDate: now,
        actionDate: addDays(30),
        expectedCompletionDate: addDays(270),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Machine Learning Engineer",
        description:
          "Develop and deploy specialized machine learning evaluation pipelines, vector search retrieval systems, and LLM orchestration workflows.",
        location: "Gotham City, NJ (Hybrid)",
        contractType: "Contract - 12 Months",
        experienceMin: 4,
        experienceMax: 8,
        requiredSkills: [
          "Python",
          "PyTorch",
          "Hugging Face",
          "Vector Databases",
          "MLOps",
          "Docker",
          "FastAPI",
        ],
        postedDate: now,
        actionDate: addDays(21),
        expectedCompletionDate: addDays(365),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Staff Data Engineer",
        description:
          "Scale Wayne Corp's analytics data platform, building robust streaming and batch ingestion pipelines using Spark, Airflow, and Snowflake.",
        location: "Remote (US/Central)",
        contractType: "Contract - 6 Months",
        experienceMin: 8,
        experienceMax: 12,
        requiredSkills: [
          "Python",
          "Apache Spark",
          "Apache Airflow",
          "Snowflake",
          "dbt",
          "PostgreSQL",
          "Data Modeling",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(180),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Senior DevOps & Infrastructure Engineer",
        description:
          "Automate containerized deployment pipelines, maintain multi-cluster Kubernetes environments, and enforce GitOps workflows.",
        location: "Gotham City, NJ (On-site)",
        contractType: "Contract - 12 Months",
        experienceMin: 6,
        experienceMax: 9,
        requiredSkills: [
          "Terraform",
          "Kubernetes",
          "Docker",
          "GitHub Actions",
          "Linux",
          "ArgoCD",
          "Prometheus",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(365),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Cloud Solutions Engineer (AWS)",
        description:
          "Design secure, resilient multi-region AWS cloud architectures focusing on S3 storage partitioning, IAM governance, and ECS infrastructure.",
        location: "Remote (Global)",
        contractType: "Contract - 6 Months",
        experienceMin: 5,
        experienceMax: 8,
        requiredSkills: [
          "AWS S3",
          "AWS IAM",
          "AWS Lambda",
          "Amazon ECS",
          "Terraform",
          "CloudFormation",
          "VPC Networking",
        ],
        postedDate: now,
        actionDate: addDays(10),
        expectedCompletionDate: addDays(180),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Lead QA Automation Engineer",
        description:
          "Champion comprehensive automated testing strategies spanning UI integration, contract API verification, and regression test suites.",
        location: "Remote (US/Eastern)",
        contractType: "Contract - 6 Months",
        experienceMin: 5,
        experienceMax: 8,
        requiredSkills: [
          "Playwright",
          "Cypress",
          "TypeScript",
          "Jest",
          "CI/CD Integration",
          "REST Assured",
          "Postman",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(180),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Application Security Engineer",
        description:
          "Perform threat modeling, audit authentication/authorization mechanisms (OIDC/Keycloak), and automate SAST/DAST security scanning.",
        location: "Gotham City, NJ (Hybrid)",
        contractType: "Contract - 12 Months",
        experienceMin: 6,
        experienceMax: 10,
        requiredSkills: [
          "OWASP Top 10",
          "OAuth2/OIDC",
          "Keycloak",
          "Penetration Testing",
          "SAST/DAST",
          "Vulnerability Management",
        ],
        postedDate: now,
        actionDate: addDays(21),
        expectedCompletionDate: addDays(365),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Site Reliability Engineer (SRE)",
        description:
          "Improve system observability, define SLOs/SLAs, conduct chaos experiments, and manage automated incident response systems.",
        location: "Remote (US/Pacific)",
        contractType: "Contract - 12 Months",
        experienceMin: 5,
        experienceMax: 9,
        requiredSkills: [
          "Prometheus",
          "Grafana",
          "Loki",
          "OpenTelemetry",
          "Go",
          "Python",
          "Kubernetes",
          "Incident Management",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(365),
        status: OpeningStatus.OPEN,
      },
      {
        title: "Senior Mobile Engineer (React Native)",
        description:
          "Deliver cross-platform mobile experiences for iOS and Android with offline-first state synchronization and high-performance native bridges.",
        location: "Remote (US/Eastern)",
        contractType: "Contract - 6 Months",
        experienceMin: 5,
        experienceMax: 8,
        requiredSkills: [
          "React Native",
          "TypeScript",
          "iOS/Swift",
          "Android/Kotlin",
          "Mobile CI/CD",
          "Redux Toolkit",
          "Fastlane",
        ],
        postedDate: now,
        actionDate: addDays(14),
        expectedCompletionDate: addDays(180),
        status: OpeningStatus.OPEN,
      },
    ];

    // 4. Idempotently create or update each opening
    console.log(`📋 Seeding ${openingsData.length} openings for ${companyName}...`);

    for (const openingData of openingsData) {
      const existingOpening = await prisma.opening.findFirst({
        where: {
          tenantId: tenant.tenantId,
          title: openingData.title,
        },
      });

      if (existingOpening) {
        await prisma.opening.update({
          where: { id: existingOpening.id },
          data: {
            description: openingData.description,
            location: openingData.location,
            contractType: openingData.contractType,
            hiringManagerId: hiringManager.id,
            experienceMin: openingData.experienceMin,
            experienceMax: openingData.experienceMax,
            requiredSkills: openingData.requiredSkills,
            status: openingData.status,
            actionDate: openingData.actionDate,
            expectedCompletionDate: openingData.expectedCompletionDate,
          },
        });
        console.log(`  ↻ Updated existing opening: "${openingData.title}"`);
      } else {
        await prisma.opening.create({
          data: {
            tenantId: tenant.tenantId,
            title: openingData.title,
            description: openingData.description,
            location: openingData.location,
            contractType: openingData.contractType,
            hiringManagerId: hiringManager.id,
            experienceMin: openingData.experienceMin,
            experienceMax: openingData.experienceMax,
            requiredSkills: openingData.requiredSkills,
            postedDate: openingData.postedDate,
            expectedCompletionDate: openingData.expectedCompletionDate,
            actionDate: openingData.actionDate,
            status: openingData.status,
          },
        });
        console.log(`  + Created opening: "${openingData.title}"`);
      }
    }

    console.log(`✨ Successfully seeded openings for ${companyName}!`);
  } catch (error) {
    console.error("❌ Error seeding openings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedOpenings();
