import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function testModel(modelName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Respond with OK" }] }],
      }),
    });
    const data: any = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function check() {
  const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];
  const results: any = {};
  for (const m of models) {
    results[m] = await testModel(m);
  }
  fs.writeFileSync("gemini_test_results.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("Wrote test results to gemini_test_results.json");
}

check();
