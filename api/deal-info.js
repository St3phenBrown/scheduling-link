
const https = require('https');

module.exports = async (req, res) => {
  const dealId = req.query.dealid;
  if (!dealId) {
    res.status(400).json({ error: "Missing deal ID" });
    return;
  }

  const options = {
    hostname: 'api.hubapi.com',
    path: `/crm/v3/objects/deals/${dealId}?properties=date_offered_1,date_offered_2,date_offered_3`,
    headers: {
      Authorization: `Bearer YOUR_HUBSPOT_PRIVATE_APP_TOKEN`,
      'Content-Type': 'application/json'
    }
  };

  https.get(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      const json = JSON.parse(data);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(json.properties);
    });
  }).on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
};
