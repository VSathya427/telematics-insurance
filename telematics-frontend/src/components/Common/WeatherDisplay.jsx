import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, AlertTriangle } from 'lucide-react';

function WeatherDisplay({ location }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;

    useEffect(() => {
        if (location && apiKey) {
            fetchWeather(location.lat, location.lng);
        }
    }, [location, apiKey]);

    const fetchWeather = async (lat, lng) => {
        if (!apiKey) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
            );
            const data = await response.json();
            setWeather(data);
        } catch (error) {
            console.error('Weather fetch error:', error);
        }
        setLoading(false);
    };

    const getWeatherIcon = (condition) => {
        switch (condition?.toLowerCase()) {
            case 'clear':
                return <Sun className="h-5 w-5 text-yellow-500" />;
            case 'rain':
                return <CloudRain className="h-5 w-5 text-blue-500" />;
            case 'clouds':
                return <Cloud className="h-5 w-5 text-gray-500" />;
            default:
                return <Sun className="h-5 w-5 text-yellow-500" />;
        }
    };

    const getRoadRisk = (weather) => {
        if (!weather) return 'Unknown';

        const condition = weather.weather[0].main.toLowerCase();
        const temp = weather.main.temp;

        if (condition.includes('rain') || condition.includes('storm')) {
            return 'High';
        } else if (temp < 35) {
            return 'Medium';
        } else {
            return 'Low';
        }
    };

    if (!apiKey) {
        return (
            <div className="text-xs text-gray-500">
                Weather data unavailable
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-xs text-gray-500">
                Loading weather...
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="text-xs text-gray-500">
                No weather data
            </div>
        );
    }

    const riskLevel = getRoadRisk(weather);
    const riskColor = riskLevel === 'High' ? 'text-red-600' :
        riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600';

    return (
        <div className="flex items-center space-x-2 text-sm">
            {getWeatherIcon(weather.weather[0].main)}
            <span>{Math.round(weather.main.temp)}°F</span>
            <span className="capitalize">{weather.weather[0].description}</span>
            <div className="flex items-center space-x-1">
                <AlertTriangle className={`h-4 w-4 ${riskColor}`} />
                <span className={`text-xs ${riskColor}`}>
                    {riskLevel} Risk
                </span>
            </div>
        </div>
    );
}

export default WeatherDisplay;
