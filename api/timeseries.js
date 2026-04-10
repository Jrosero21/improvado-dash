const getPool = require('./_db');
const { days, platform, campaign, W } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const [rows] = await pool.query(
      `SELECT ad_date as date, platform,
        SUM(spend) as spend, SUM(conversions) as conversions,
        SUM(clicks) as clicks, SUM(impressions) as impressions
      FROM unified_ads WHERE ${W(d, p, c)}
      GROUP BY ad_date, platform ORDER BY ad_date ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
