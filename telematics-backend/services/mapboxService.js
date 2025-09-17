const axios = require('axios');
const config = require('../config/apis');

class MapboxService {
    constructor() {
        this.accessToken = config.mapbox.accessToken;
        this.baseUrl = config.mapbox.baseUrl;
    }

    async geocodeAddress(address) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
                {
                    params: {
                        access_token: this.accessToken,
                        limit: 1
                    }
                }
            );

            if (response.data.features.length > 0) {
                const feature = response.data.features[0];
                return {
                    address: feature.place_name,
                    coordinates: feature.center, // [longitude, latitude]
                    bbox: feature.bbox
                };
            }

            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    }

    async reverseGeocode(longitude, latitude) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
                {
                    params: {
                        access_token: this.accessToken,
                        types: 'address'
                    }
                }
            );

            if (response.data.features.length > 0) {
                return {
                    address: response.data.features[0].place_name,
                    context: response.data.features[0].context
                };
            }

            return null;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw error;
        }
    }

    async getRouteDistance(startCoords, endCoords) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}`,
                {
                    params: {
                        access_token: this.accessToken,
                        geometries: 'geojson',
                        overview: 'simplified'
                    }
                }
            );

            if (response.data.routes.length > 0) {
                const route = response.data.routes[0];
                return {
                    distance: route.distance, // in meters
                    duration: route.duration, // in seconds
                    geometry: route.geometry
                };
            }

            return null;
        } catch (error) {
            console.error('Route calculation error:', error);
            throw error;
        }
    }

    async isInHighRiskArea(longitude, latitude) {
        // Simple implementation - could be enhanced with actual crime/accident data
        try {
            const location = await this.reverseGeocode(longitude, latitude);

            if (location && location.context) {
                // Check for high-traffic areas, downtown areas, etc.
                const context = location.context.map(c => c.text.toLowerCase());
                const highRiskKeywords = ['downtown', 'interstate', 'highway', 'freeway'];

                return highRiskKeywords.some(keyword =>
                    context.some(ctx => ctx.includes(keyword))
                );
            }

            return false;
        } catch (error) {
            console.error('Risk area check error:', error);
            return false;
        }
    }
}

module.exports = new MapboxService();
