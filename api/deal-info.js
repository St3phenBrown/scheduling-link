/**
 * api/deal-info.js
 * 
 * Fetches date_offered_1/2/3 from HubSpot (via private app token),
 * and always returns CORS headers so any origin can read it.
 */

const https = require("https");

module.exports = async (req, res) => {
  // ─── 1) Always send CORS headers ─────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");                  // allow any origin
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");      // allow GET and OPTIONS
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");      // allow Content-Type header

  // ─── 2) Handle preflight OPTIONS ───────────────────────────────────────
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ─── 3) Grab dealId from query ─────────────────────────────────────────
  const dealId = req.query.dealid;
  if (!dealId) {
    return res
      .status(400)
      .json({ error: "Missing dealId in query string." });
  }

  // ─── 4) Call HubSpot API for those date properties ─────────────────────
  const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN; 
  if (!HUBSPOT_TOKEN) {
    return res
      .status(500)
      .json({ error: "Missing HUBSPOT_TOKEN environment variable." });
  }

  // Build the request options
  const options = {
    hostname: "api.hubapi.com",
    path: `/crm/v3/objects/deals/${dealId}?properties=date_offered_1,date_offered_2,date_offered_3`,
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    method: "GET"
  };

  // Perform the HTTPS GET
  https
    .get(options, (hubRes) => {
      let body = "";
      hubRes.on("data", (chunk) => (body += chunk));
      hubRes.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          const props = parsed.properties || {};
          return res.status(200).json({
            date_offered_1: props.date_offered_1 || null,
            date_offered_2: props.date_offered_2 || null,
            date_offered_3: props.date_offered_3 || null
          });
        } catch (err) {
          return res
            .status(500)
            .json({ error: "Failed to parse HubSpot response.", details: err.message });
        }
      });
    })
    .on("error", (err) => {
      return res
        .status(500)
        .json({ error: "HubSpot API request failed.", details: err.message });
    });
};
