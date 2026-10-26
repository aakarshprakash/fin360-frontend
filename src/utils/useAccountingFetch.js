import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for fetching data with automatic deduplication and cleanup.
 * Prevents duplicate API calls in React 18 StrictMode and on re-renders.
 *
 * @param {Function} fetchFn  - Async function that returns the API response
 * @param {*} fallback        - Fallback/demo data if API fails
 * @param {Object} opts       - Options
 * @param {Function} opts.transform - Transform response.data before setting state
 * @param {Array} opts.deps   - Extra dependencies (default: [])
 * @returns {{ data, loading, error, refetch, meta }} meta is the backend's
 *   `{ current_page, last_page, per_page, total }` pagination block when the
 *   endpoint returns one, otherwise null.
 */
export function useAccountingFetch(fetchFn, fallback, opts = {}) {
  const { transform, deps = [] } = opts;
  const [data, setData] = useState(fallback);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Stabilize references that may be inline literals
  const fallbackRef = useRef(fallback);
  const transformRef = useRef(transform);
  const fetchFnRef = useRef(fetchFn);
  fallbackRef.current = fallback;
  transformRef.current = transform;
  fetchFnRef.current = fetchFn;

  const defaultTransform = useCallback((resData) => {
    const fb = fallbackRef.current;
    const tx = transformRef.current;
    if (tx) return tx(resData);
    // If fallback is an array, ensure we always return an array
    if (Array.isArray(fb)) {
      if (Array.isArray(resData)) return resData;
      // Try common Laravel wrapper keys
      const unwrapped = resData?.data || resData?.results ||
        resData?.invoices || resData?.bills || resData?.entries ||
        resData?.accounts || resData?.customers || resData?.vendors ||
        resData?.incomes || resData?.expenses || resData?.currencies ||
        resData?.taxes || resData?.methods || resData?.items ||
        resData?.quotations || resData;
      return Array.isArray(unwrapped) ? unwrapped : fb;
    }
    // If fallback is an object, unwrap Laravel Resource { data: {...} }
    if (typeof fb === 'object' && fb !== null) {
      const unwrapped = (resData?.data && typeof resData.data === 'object' && !Array.isArray(resData.data))
        ? resData.data : resData;
      return { ...fb, ...unwrapped };
    }
    return resData ?? fb;
  }, []);

  const doFetch = useCallback(async (cancelledRef) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFnRef.current();
      if (cancelledRef?.current) return;
      const transformed = defaultTransform(response.data);
      setData(transformed);
      setMeta(response.data?.meta ?? null);
    } catch (err) {
      if (cancelledRef?.current) return;
      setError(err);
      setData(fallbackRef.current);
      setMeta(null);
    } finally {
      if (!cancelledRef?.current) setLoading(false);
    }
  }, [defaultTransform]);

  useEffect(() => {
    // Use a cancelled ref to ignore stale results without aborting the request.
    // This is StrictMode-safe: mount→fetch→unmount(cancelled=true)→remount→new fetch
    const cancelledRef = { current: false };
    doFetch(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    const cancelledRef = { current: false };
    doFetch(cancelledRef);
    return () => { cancelledRef.current = true; };
  }, [doFetch]);

  return { data, setData, loading, error, refetch, meta };
}

