import { apiService } from './api';

class AuthService {
    async login(email, password) {
        return apiService.post('/auth/login', { email, password });
    }

    async register(userData) {
        return apiService.post('/auth/register', userData);
    }

    async getProfile(token) {
        return apiService.get('/auth/profile', token);
    }
}

export const authService = new AuthService();
