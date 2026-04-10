const getPool = require('./_db');
const { days, platform, campaign, W } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req); const p = platform(req); const c = campaign(req);
    const limit = parseInt(req.query.limit || 12);

    // /api/campaigns/list
    if (req.query.list === '1') {
      const [rows] = await pool.query(
        `SELECT DISTINCT campaign_name, platform FROM unified_ads ORDER BY platform, campaign_name`
      );
      return res.json(rows);
    }

    const [rows] = await pool.query(
      `SELECT platform, campaign_name,
        SUM(spend) as spend, SUM(impressions) as impressions,
        SUM(clicks) as clicks, SUM(conversions) as conversions
      FROM unified_ads WHERE ${W(d, p, c)}
      GROUP BY platform, campaign_name
      ORDER BY spend DESC LIMIT ${limit}`
    );
    res.json(rows.map(r => ({
      ...r,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
