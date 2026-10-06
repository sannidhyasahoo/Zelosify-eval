import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:5000";
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080/auth";
const REALM = process.env.KEYCLOAK_REALM || "Zelosify";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "dynamic-client";
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

async function getToken(username: string, password = "password123"): Promise<string> {
  const tokenUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
  const res = await axios.post(
    tokenUrl,
    new URLSearchParams({
      grant_type: "password",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET!,
      username,
      password,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data.access_token;
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("            STARTING END-TO-END BACKEND FUNCTIONALITY TESTS                    ");
  console.log("================================================================================\n");

  let vendorToken: string;
  let managerToken: string;

  // 1. Authenticate IT_VENDOR
  try {
    process.stdout.write("[TEST 1] Keycloak Auth for IT_VENDOR (zen)... ");
    vendorToken = await getToken("zen");
    console.log("PASS (Token length: %d)", vendorToken.length);
  } catch (err: any) {
    console.log("FAIL:", err.response?.data || err.message);
    return;
  }

  // 2. Authenticate HIRING_MANAGER
  try {
    process.stdout.write("[TEST 2] Keycloak Auth for HIRING_MANAGER (user1)... ");
    managerToken = await getToken("user1");
    console.log("PASS (Token length: %d)", managerToken.length);
  } catch (err: any) {
    console.log("FAIL:", err.response?.data || err.message);
    return;
  }

  const vendorApi = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${vendorToken}` },
  });

  const managerApi = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${managerToken}` },
  });

  // 3. IT_VENDOR: List Openings
  let firstOpeningId = "";
  try {
    process.stdout.write("[TEST 3] GET /api/v1/vendor/openings... ");
    const res = await vendorApi.get("/api/v1/vendor/openings");
    const openings = res.data?.data || res.data;
    if (Array.isArray(openings) && openings.length > 0) {
      firstOpeningId = openings[0].id;
      console.log("PASS (Found %d openings, selected ID: %s)", openings.length, firstOpeningId);
    } else {
      console.log("PASS (Response received, count: 0)");
    }
  } catch (err: any) {
    console.log("FAIL:", err.response?.data || err.message);
  }

  // 4. IT_VENDOR: Get Opening Details
  if (firstOpeningId) {
    try {
      process.stdout.write(`[TEST 4] GET /api/v1/vendor/openings/${firstOpeningId}... `);
      const res = await vendorApi.get(`/api/v1/vendor/openings/${firstOpeningId}`);
      console.log("PASS (Title: '%s')", res.data?.data?.title || res.data?.title);
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 5. IT_VENDOR: Request S3 Presigned URL
  let presignedData: any = null;
  if (firstOpeningId) {
    try {
      process.stdout.write(`[TEST 5] POST /api/v1/vendor/openings/${firstOpeningId}/profiles/presign... `);
      const res = await vendorApi.post(`/api/v1/vendor/openings/${firstOpeningId}/profiles/presign`, {
        files: [
          {
            filename: "john_doe_resume.pdf",
            contentType: "application/pdf",
            sizeBytes: 10240,
          },
        ],
      });
      const data = res.data?.data || res.data;
      presignedData = Array.isArray(data) ? data[0] : data?.files?.[0] || data;
      console.log("PASS (S3 Key generated: %s)", presignedData?.s3Key);
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 6. Direct S3 Upload Simulation
  if (presignedData?.uploadUrl) {
    try {
      process.stdout.write("[TEST 6] Direct S3 PUT (binary upload)... ");
      const samplePdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n/Title (John Doe Resume)\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF");
      await axios.put(presignedData.uploadUrl, samplePdfBuffer, {
        headers: { "Content-Type": "application/pdf" },
      });
      console.log("PASS (HTTP 200 returned from AWS S3)");
    } catch (err: any) {
      console.log("FAIL (S3 Put):", err.message);
    }
  }

  // 7. IT_VENDOR: Complete Profile Submission
  let profileId = "";
  if (firstOpeningId && presignedData?.s3Key) {
    try {
      process.stdout.write(`[TEST 7] POST /api/v1/vendor/openings/${firstOpeningId}/profiles/upload... `);
      const res = await vendorApi.post(`/api/v1/vendor/openings/${firstOpeningId}/profiles/upload`, {
        profiles: [
          {
            originalFilename: "john_doe_resume.pdf",
            s3Key: presignedData.s3Key,
            contentType: "application/pdf",
            sizeBytes: 10240,
          },
        ],
      });
      const profiles = res.data?.data || res.data;
      const created = Array.isArray(profiles) ? profiles[0] : profiles;
      profileId = created?.id;
      console.log("PASS (Profile created in DB, Profile ID: %s, Status: %s)", profileId, created?.status);
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 8. IT_VENDOR: Preview Profile
  if (profileId) {
    try {
      process.stdout.write(`[TEST 8] GET /api/v1/vendor/profiles/${profileId}/preview... `);
      const res = await vendorApi.get(`/api/v1/vendor/profiles/${profileId}/preview`);
      const previewUrl = res.data?.data?.previewUrl || res.data?.previewUrl;
      console.log("PASS (Presigned preview URL generated: %s...)", String(previewUrl).substring(0, 45));
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 9. HIRING_MANAGER: List Openings
  try {
    process.stdout.write("[TEST 9] GET /api/v1/hiring-manager/openings... ");
    const res = await managerApi.get("/api/v1/hiring-manager/openings");
    const openings = res.data?.data || res.data;
    console.log("PASS (Found %d assigned openings for user1)", Array.isArray(openings) ? openings.length : 0);
  } catch (err: any) {
    console.log("FAIL:", err.response?.data || err.message);
  }

  // 10. HIRING_MANAGER: Review Candidates & AI Recommendation
  if (firstOpeningId) {
    try {
      process.stdout.write(`[TEST 10] GET /api/v1/hiring-manager/openings/${firstOpeningId}/profiles... `);
      const res = await managerApi.get(`/api/v1/hiring-manager/openings/${firstOpeningId}/profiles`);
      const payload = res.data?.data || res.data;
      const profiles = payload?.profiles || payload;
      console.log("PASS (Candidates found: %d)", Array.isArray(profiles) ? profiles.length : 0);
      if (Array.isArray(profiles) && profiles.length > 0) {
        const p = profiles.find((item: any) => item.id === profileId) || profiles[0];
        console.log("   -> Candidate: %s | Status: %s | AI Recommendation: %s", p.originalFilename, p.status, p.recommendationStatus);
      }
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 11. HIRING_MANAGER: Shortlist Candidate
  if (profileId) {
    try {
      process.stdout.write(`[TEST 11] POST /api/v1/hiring-manager/profiles/${profileId}/shortlist... `);
      const res = await managerApi.post(`/api/v1/hiring-manager/profiles/${profileId}/shortlist`);
      const updated = res.data?.data || res.data;
      console.log("PASS (Profile status updated to: %s)", updated?.status);
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 12. HIRING_MANAGER: Reject Candidate
  if (profileId) {
    try {
      process.stdout.write(`[TEST 12] POST /api/v1/hiring-manager/profiles/${profileId}/reject... `);
      const res = await managerApi.post(`/api/v1/hiring-manager/profiles/${profileId}/reject`);
      const updated = res.data?.data || res.data;
      console.log("PASS (Profile status updated to: %s)", updated?.status);
    } catch (err: any) {
      console.log("FAIL:", err.response?.data || err.message);
    }
  }

  // 13. Security / RBAC: IT_VENDOR trying to access HIRING_MANAGER endpoint
  try {
    process.stdout.write("[TEST 13] RBAC Isolation (Vendor calling Manager API)... ");
    await vendorApi.get("/api/v1/hiring-manager/openings");
    console.log("FAIL (Should have returned 403 Forbidden)");
  } catch (err: any) {
    if (err.response?.status === 403) {
      console.log("PASS (Correctly rejected with 403 Forbidden)");
    } else {
      console.log("FAIL:", err.response?.status, err.response?.data);
    }
  }

  // 14. Security / RBAC: HIRING_MANAGER trying to upload profiles
  if (firstOpeningId) {
    try {
      process.stdout.write("[TEST 14] RBAC Isolation (Manager calling Vendor Presign API)... ");
      await managerApi.post(`/api/v1/vendor/openings/${firstOpeningId}/profiles/presign`, { files: [] });
      console.log("FAIL (Should have returned 403 Forbidden)");
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log("PASS (Correctly rejected with 403 Forbidden)");
      } else {
        console.log("FAIL:", err.response?.status, err.response?.data);
      }
    }
  }

  console.log("\n================================================================================");
  console.log("                    ALL 14 E2E TESTS COMPLETED                                  ");
  console.log("================================================================================");
}

runTestSuite().catch(console.error);
