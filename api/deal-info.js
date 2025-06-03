/**
 * api/deal-info.js
 *
 * Serverless function that pulls date_offered_1, date_offered_2, date_offered_3
 * from HubSpot for the given dealId, then returns them as JSON.
 */

const https = require("https");

module.exports = async (req, res) => {
  // 1) CORS headers (still safe even though same-origin)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2) Handle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // 3) Get dealId
  const dealId = req.query.dealid;
  if (!dealId) {
    return res.status(400).json({ error: "Missing dealId in query string." });
  }

  // 4) HubSpot API call
  const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
  if (!HUBSPOT_TOKEN) {
    return res.status(500).json({ error: "Missing HUBSPOT_TOKEN env var." });
  }

  const options = {
    hostname: "api.hubapi.com",
    path: `/crm/v3/objects/deals/${dealId}?properties=date_offered_1,date_offered_2,date_offered_3`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  https
    .get(options, (hubRes) => {
      let data = "";
      hubRes.on("data", (chunk) => (data += chunk));
      hubRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const props = parsed.properties || {};
          return res.status(200).json({
            date_offered_1: props.date_offered_1 || null,
            date_offered_2: props.date_offered_2 || null,
            date_offered_3: props.date_offered_3 || null,
          });
        } catch (err) {
          return res
            .status(500)
            .json({ error: "Failed to parse HubSpot response", details: err.message });
        }
      });
    })
    .on("error", (err) => {
      return res.status(500).json({ error: "HubSpot API request failed", details: err.message });
    });
};
