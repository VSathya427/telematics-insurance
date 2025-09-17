import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './useAuth';

export function useApi(endpoint, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (!endpoint || !token) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await apiService.get(endpoint, token);
                setData(result);
                setError(null);
            } catch (err) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint, token]);

    return { data, loading, error };
}
