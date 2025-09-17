import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async get(endpoint, token) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await this.client.get(endpoint, config);
        return response.data;
    }

    async post(endpoint, data, token) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await this.client.post(endpoint, data, config);
        return response.data;
    }

    async put(endpoint, data, token) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await this.client.put(endpoint, data, config);
        return response.data;
    }

    async delete(endpoint, token) {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await this.client.delete(endpoint, config);
        return response.data;
    }

    async getMLRiskTrend(token, days = 180) {
        return this.get(`/scoring/risk-trend-ml?days=${days}`, token);
    }
}

export const apiService = new ApiService();
