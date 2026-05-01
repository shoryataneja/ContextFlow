import { useState, useEffect, useCallback } from 'react';
import { contextApi } from '../services/api';
import toast from 'react-hot-toast';

export function useContexts(includeStale = false) {
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contextApi.list(includeStale);
      setContexts(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [includeStale]);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id) => {
    try {
      await contextApi.delete(id);
      toast.success('Marked as stale');
      fetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return { contexts, loading, error, refetch: fetch, remove };
}

export function useRetrieve() {
  // Single state object to avoid race between setResults + setLoading
  const [state, setState] = useState({ results: [], loading: false, error: null, searched: false });

  const retrieve = useCallback(async (params) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await contextApi.retrieve(params);
      setState({ results: res.data ?? [], loading: false, error: null, searched: true });
    } catch (err) {
      setState({ results: [], loading: false, error: err.message, searched: true });
      toast.error(err.message);
    }
  }, []);

  return {
    results: state.results,
    loading: state.loading,
    error: state.error,
    searched: state.searched,
    retrieve,
  };
}
