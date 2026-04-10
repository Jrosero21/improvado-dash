const getPool = require('./_db');
const { days, Wp } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pool = getPool();
  try {
    const d = days(req);
    const [rows] = await pool.query(
      `SELECT AVG(quality_score) as avg_quality_score,
        AVG(search_impression_share) as avg_impression_share,
        AVG(avg_cpc) as avg_cpc,
        SUM(conversion_value) as total_conversion_value,
        SUM(cost) as total_cost, SUM(conversions) as total_conversions
      FROM google_ads WHERE ${Wp(d)}`
    );
    const row = rows[0];
    row.roas = row.total_cost > 0 ? row.total_conversion_value / row.total_cost : 0;
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
