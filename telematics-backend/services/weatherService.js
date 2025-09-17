const axios = require('axios');
const config = require('../config/apis');

class WeatherService {
    constructor() {
        this.apiKey = config.openWeather.apiKey;
        this.baseUrl = config.openWeather.baseUrl;
        this.roadRiskUrl = config.openWeather.roadRiskUrl;
    }

    async getWeatherByLocation(lat, lng) {
        try {
            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey,
                    units: 'imperial'
                }
            });

            const weather = response.data;

            return {
                condition: weather.weather[0].main.toLowerCase(),
                description: weather.weather[0].description,
                temperature: weather.main.temp,
                humidity: weather.main.humidity,
                visibility: weather.visibility / 1000, // Convert to km
                windSpeed: weather.wind?.speed || 0,
                roadRisk: this.calculateRoadRisk(weather)
            };

        } catch (error) {
            console.error('Weather API error:', error);
            // Return default weather data if API fails
            return {
                condition: 'clear',
                description: 'clear sky',
                temperature: 70,
                humidity: 50,
                visibility: 10,
                windSpeed: 5,
                roadRisk: 0.1
            };
        }
    }

    async getRoadRiskData(lat, lng) {
        try {
            // Note: This is a premium API endpoint
            const response = await axios.get(this.roadRiskUrl, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey,
                    exclude: 'minutely,alerts'
                }
            });

            const current = response.data.current;

            return {
                roadTemperature: current.temp,
                precipitation: current.rain?.['1h'] || current.snow?.['1h'] || 0,
                blackIceProbability: this.calculateBlackIceRisk(current),
                overallRoadRisk: this.calculateAdvancedRoadRisk(current)
            };

        } catch (error) {
            console.error('Road risk API error:', error);
            return null;
        }
    }

    calculateRoadRisk(weather) {
        let risk = 0.1; // Base risk

        // Weather condition risk
        const condition = weather.weather[0].main.toLowerCase();
        const conditionRisks = {
            'rain': 0.4,
            'snow': 0.7,
            'thunderstorm': 0.8,
            'fog': 0.6,
            'mist': 0.3,
            'clouds': 0.2,
            'clear': 0.1
        };

        risk = conditionRisks[condition] || 0.2;

        // Visibility impact
        if (weather.visibility) {
            const visibilityKm = weather.visibility / 1000;
            if (visibilityKm < 1) risk += 0.3;
            else if (visibilityKm < 5) risk += 0.1;
        }

        // Wind impact
        if (weather.wind?.speed > 15) risk += 0.1; // High winds

        // Temperature impact (ice conditions)
        if (weather.main.temp < 35) risk += 0.2; // Freezing conditions

        return Math.min(risk, 1.0);
    }

    calculateBlackIceRisk(current) {
        const temp = current.temp;
        const humidity = current.humidity;
        const dewPoint = current.dew_point;

        // Black ice forms when temperature is near freezing and humidity is high
        if (temp >= 28 && temp <= 35 && humidity > 80 && dewPoint < 32) {
            return 0.8;
        } else if (temp >= 30 && temp <= 37 && humidity > 70) {
            return 0.4;
        }

        return 0.1;
    }

    calculateAdvancedRoadRisk(current) {
        let risk = this.calculateRoadRisk({
            weather: [{ main: current.weather[0].main }],
            main: { temp: current.temp },
            visibility: current.visibility,
            wind: { speed: current.wind_speed }
        });

        // Add precipitation intensity
        const precipitation = current.rain?.['1h'] || current.snow?.['1h'] || 0;
        if (precipitation > 0.1) risk += 0.2;
        if (precipitation > 0.5) risk += 0.2;

        // Add UV index impact (glare)
        if (current.uvi > 7) risk += 0.1;

        return Math.min(risk, 1.0);
    }

    async getWeatherForecast(lat, lng, hours = 24) {
        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    lat,
                    lon: lng,
                    appid: this.apiKey,
                    units: 'imperial',
                    cnt: Math.ceil(hours / 3) // API returns 3-hour intervals
                }
            });

            return response.data.list.map(item => ({
                timestamp: new Date(item.dt * 1000),
                condition: item.weather[0].main.toLowerCase(),
                temperature: item.main.temp,
                roadRisk: this.calculateRoadRisk(item)
            }));

        } catch (error) {
            console.error('Weather forecast error:', error);
            return [];
        }
    }
}

module.exports = new WeatherService();
