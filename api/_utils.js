const days = (req) => parseInt(req.query.days || 30);
const platform = (req) => req.query.platform || null;
const campaign = (req) => req.query.campaign || null;

const W = (d, p, c) => {
  let w = `ad_date >= (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d} DAY) FROM unified_ads)`;
  if (p) w += ` AND platform = '${p.replace(/'/g, "''")}'`;
  if (c) w += ` AND campaign_name = '${c.replace(/'/g, "''")}'`;
  return w;
};
const Wprev = (d) =>
  `ad_date >= (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d * 2} DAY) FROM unified_ads)
   AND ad_date < (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d} DAY) FROM unified_ads)`;
const Wp = (d) => `date >= (SELECT DATE_SUB(MAX(ad_date), INTERVAL ${d} DAY) FROM unified_ads)`;

module.exports = { days, platform, campaign, W, Wprev, Wp };
