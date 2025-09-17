module.exports = {
    mapbox: {
        accessToken: process.env.MAPBOX_ACCESS_TOKEN,
        baseUrl: 'https://api.mapbox.com'
    },
    openWeather: {
        apiKey: process.env.OPENWEATHER_API_KEY,
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        roadRiskUrl: 'https://api.openweathermap.org/data/2.5/onecall'
    }
};
