import { useState, useEffect, useCallback } from 'react';

const BASE = '/api/metrics';

function buildQuery(filters) {
  const params = new URLSearchParams();
  if (filters.platform && filters.platform !== 'All') params.set('platform', filters.platform);
  if (filters.campaign && filters.campaign !== 'All') params.set('campaign', filters.campaign);
  if (filters.week && filters.week !== 'All') params.set('week', filters.week);
  return params.toString() ? '?' + params.toString() : '';
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useAdData(filters) {
  const [data, setData] = useState({
    summary: null,
    platforms: [],
    campaigns: [],
    daily: [],
    weekly: [],
    dayofweek: [],
    campaignList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery(filters);
      const [summary, platforms, campaigns, daily, weekly, dayofweek, campaignList] =
        await Promise.all([
          fetchJSON(`${BASE}/summary${q}`),
          fetchJSON(`${BASE}/platforms${q}`),
          fetchJSON(`${BASE}/campaigns${q}`),
          fetchJSON(`${BASE}/daily${q}`),
          fetchJSON(`${BASE}/weekly${q}`),
          fetchJSON(`${BASE}/dayofweek${q}`),
          fetchJSON(`${BASE}/campaigns/list`),
        ]);
      setData({ summary, platforms, campaigns, daily, weekly, dayofweek, campaignList });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.platform, filters.campaign, filters.week]);

  useEffect(() => { load(); }, [load]);

  return { ...data, loading, error, reload: load };
}
