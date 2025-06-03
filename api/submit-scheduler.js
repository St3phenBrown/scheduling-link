/**
 * api/submit-scheduler.js
 *
 * CORS-enabled proxy that accepts POST from index.html
 * and forwards the payload to your Zapier catch hook.
 */

const https = require("https");

module.exports = async (req, res) => {
  // 1) CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2) Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // 3) Read JSON body
  let bodyData = "";
  req.on("data", (chunk) => (bodyData += chunk));
  req.on("end", () => {
    try {
      const payload = JSON.parse(bodyData);

      // 4) Forward to Zapier
      const zapPath = "/hooks/catch/6263073/2vtpd0d/";
      const zapOptions = {
        hostname: "hooks.zapier.com",
        path: zapPath,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };

      const zapReq = https.request(zapOptions, (zapRes) => {
        let zapData = "";
        zapRes.on("data", (chunk) => (zapData += chunk));
        zapRes.on("end", () => {
          return res.status(200).end("OK");
        });
      });

      zapReq.on("error", (err) => {
        return res.status(500).end("Failed to forward to Zapier");
      });

      zapReq.write(JSON.stringify(payload));
      zapReq.end();
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
  });
};
