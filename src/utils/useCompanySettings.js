// Hook to fetch and cache company settings (name, address, phone, email, website, tagline, logo)
import { useState, useEffect } from 'react';
import api from './api';

let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const defaultSettings = {
  companyName: 'Fin360',
  companyShortName: 'F3',
  tagline: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  logoUrl: '',
};

/**
 * Fetch company settings (can be used outside of React components)
 */
export async function fetchCompanySettings() {
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedSettings;
  }
  try {
    const res = await api.get('/settings/company');
    const raw = res.data?.data || res.data || {};
    const settings = {
      companyName: raw.companyName || raw.company_name || defaultSettings.companyName,
      companyShortName: raw.companyShortName || raw.company_short_name || (raw.companyName || raw.company_name || defaultSettings.companyName).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      tagline: raw.tagline || defaultSettings.tagline,
      email: raw.email || raw.companyEmail || raw.company_email || defaultSettings.email,
      phone: raw.phone || raw.companyPhone || raw.company_phone || defaultSettings.phone,
      address: raw.address || raw.companyAddress || raw.company_address || defaultSettings.address,
      website: raw.website || raw.companyWebsite || raw.company_website || defaultSettings.website,
      logoUrl: raw.logoUrl || raw.logo_url || defaultSettings.logoUrl,
    };
    cachedSettings = settings;
    cacheTimestamp = Date.now();
    return settings;
  } catch {
    return cachedSettings || defaultSettings;
  }
}

/**
 * Invalidate the cached company settings (call after saving)
 */
export function invalidateCompanySettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}

/**
 * React hook — returns { settings, loading, refetch }
 */
export function useCompanySettings() {
  const [settings, setSettings] = useState(cachedSettings || defaultSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  const load = async () => {
    setLoading(true);
    const s = await fetchCompanySettings();
    setSettings(s);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { settings, loading, refetch: load };
}

export default useCompanySettings;

