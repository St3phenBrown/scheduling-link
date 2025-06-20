/**
 * api/deal-info.js
 *
 * - CORS + no-cache
 * - Logs the full HubSpot response for debugging
 * - Returns only date_offered_1, date_offered_2, date_offered_3
 */

const https = require("https");

module.exports = async (req, res) => {
  // ── 1) CORS + No-Cache ──────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store"); // disable caching

  // Handle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ── 2) Validate dealId ────────────────────────────────────────────
  const dealId = req.query.dealid;
  if (!dealId) {
    return res.status(400).json({ error: "Missing dealId query parameter" });
  }

  // ── 3) HubSpot token ────────────────────────────────────────────────
  const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
  if (!HUBSPOT_TOKEN) {
    return res.status(500).json({ error: "Missing HUBSPOT_TOKEN environment var" });
  }

  // ── 4) Build HubSpot API request ────────────────────────────────────
  const options = {
    hostname: "api.hubapi.com",
    path:
      `/crm/v3/objects/deals/${dealId}` +
      `?properties=date_offered_1,date_offered_2,date_offered_3,expiration_date`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  // ── 5) Fetch from HubSpot ────────────────────────────────────────────
  https
    .get(options, (hubRes) => {
      let rawData = "";
      hubRes.on("data", (chunk) => (rawData += chunk));
      hubRes.on("end", () => {
        try {
          const parsed = JSON.parse(rawData);

          // Log entire response for debugging
          console.log(">>> HubSpot full API response:", JSON.stringify(parsed, null, 2));

          const props = parsed.properties || {};
          return res.status(200).json({
  date_offered_1: props.date_offered_1 || null,
  date_offered_2: props.date_offered_2 || null,
  date_offered_3: props.date_offered_3 || null,
  expiration_date: props.expiration_date || null,
});
        } catch (err) {
          console.error("Error parsing HubSpot JSON:", err);
          return res
            .status(500)
            .json({ error: "Failed to parse HubSpot response", details: err.message });
        }
      });
    })
    .on("error", (err) => {
      console.error("HubSpot API request failed:", err);
      return res.status(500).json({ error: "HubSpot API request failed", details: err.message });
    });
};
