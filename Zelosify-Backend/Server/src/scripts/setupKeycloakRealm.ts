import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://localhost:8080/auth";
const REALM_NAME = process.env.KEYCLOAK_REALM || "Zelosify";
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "dynamic-client";
const ADMIN_USERNAME = process.env.KEYCLOAK_ADMIN || "admin";
const ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || "admin";

async function setupRealm() {
  console.log(`🔐 Connecting to Keycloak admin at ${KEYCLOAK_URL}...`);

  // 1. Get Admin Access Token
  const tokenRes = await axios.post(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const adminToken = tokenRes.data.access_token;
  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  // 2. Check if realm exists
  try {
    await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}`, {
      headers: authHeaders,
    });
    console.log(`✅ Realm '${REALM_NAME}' already exists.`);
  } catch (err: any) {
    if (err.response?.status === 404) {
      console.log(`📦 Creating realm '${REALM_NAME}'...`);
      await axios.post(
        `${KEYCLOAK_URL}/admin/realms`,
        {
          realm: REALM_NAME,
          enabled: true,
          registrationAllowed: true,
          rememberMe: true,
          verifyEmail: false,
          resetPasswordAllowed: true,
        },
        { headers: authHeaders }
      );
      console.log(`✅ Realm '${REALM_NAME}' created successfully.`);
    } else {
      throw err;
    }
  }

  // 3. Check if client exists
  const clientsRes = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`,
    {
      headers: authHeaders,
      params: { clientId: CLIENT_ID },
    }
  );

  let client = clientsRes.data?.[0];
  if (!client) {
    console.log(`📦 Creating client '${CLIENT_ID}' in realm '${REALM_NAME}'...`);
    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`,
      {
        clientId: CLIENT_ID,
        name: CLIENT_ID,
        enabled: true,
        protocol: "openid-connect",
        publicClient: false,
        bearerOnly: false,
        standardFlowEnabled: true,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: true,
        serviceAccountsEnabled: true,
        redirectUris: ["http://localhost:5173/*", "http://localhost:5000/*", "*"],
        webOrigins: ["http://localhost:5173", "http://localhost:5000", "+", "*"],
      },
      { headers: authHeaders }
    );

    const refetchClients = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`,
      {
        headers: authHeaders,
        params: { clientId: CLIENT_ID },
      }
    );
    client = refetchClients.data?.[0];
    console.log(`✅ Client '${CLIENT_ID}' created.`);
  } else {
    console.log(`✅ Client '${CLIENT_ID}' already exists.`);
  }

  // 4. Retrieve client secret
  const secretRes = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${client.id}/client-secret`,
    { headers: authHeaders }
  );

  const secret = secretRes.data?.value;
  console.log(`🔑 Client Secret: ${secret}`);

  // 5. Verify openid configuration
  const openidConfig = await axios.get(
    `${KEYCLOAK_URL}/realms/${REALM_NAME}/.well-known/openid-configuration`
  );
  console.log(`🎉 OpenID Configuration verified: ${openidConfig.data.issuer}`);
}

setupRealm().catch((err) => {
  console.error("❌ Realm setup failed:", err.response?.data || err.message);
  process.exit(1);
});
