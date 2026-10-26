/**
 * useUsers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared hook — fetches active users once and provides:
 *
 *   users              → array of { id, name, email, role, avatar }
 *   invalidateCache()  → clears cache & refetches
 *
 * Used by: AssignLeadModal, LeadList staff filter, Settings round-robin config
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import api from './api';

let _cache = null;
let _fetching = false;
let _listeners = [];

function notify(data) {
  _cache = data;
  _listeners.forEach(fn => fn(data));
}

function fetchOnce() {
  if (_cache || _fetching) return;
  _fetching = true;
  api.get('/users')
    .then(res => {
      const raw = res.data?.users || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const users = (Array.isArray(raw) ? raw : [])
        .filter(u => (u.status || 'Active') === 'Active')
        .map(u => ({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          role: u.role?.name || u.role || '',
          avatar: u.avatar || u.profile_photo || null,
        }));
      if (users.length > 0) notify(users);
    })
    .catch(() => { /* keep defaults */ })
    .finally(() => { _fetching = false; });
}

export function invalidateUsersCache() {
  _cache = null;
  _fetching = false;
  fetchOnce();
}

export function useUsers() {
  const [users, setUsers] = useState(_cache || []);

  useEffect(() => {
    const listener = (data) => setUsers(data);
    _listeners.push(listener);
    fetchOnce();
    return () => { _listeners = _listeners.filter(fn => fn !== listener); };
  }, []);

  return { users };
}

