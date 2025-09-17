import React, { useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function TripMap({ telematicsData }) {
    const mapRef = useRef();
    const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;



    // Get the most recent location or default to NYC
    const currentLocation = telematicsData && telematicsData.length > 0
        ? telematicsData[0].location.coordinates
        : [-74.0060, 40.7128]; // [longitude, latitude]

    const viewState = {
        longitude: currentLocation[0],
        latitude: currentLocation[1],
        zoom: 12
    };

    // Create a line from telematics data
    const routeData = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: telematicsData ? telematicsData.slice(-20).map(point =>
                point.location.coordinates
            ) : []
        }
    };

    if (!mapboxToken) {
        return (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🗺️</div>
                    <p className="text-gray-600 mb-2">Map Loading...</p>
                    <p className="text-sm text-gray-500">Configure Mapbox token to see live map</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <Map
                ref={mapRef}
                {...viewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={mapboxToken}
                attributionControl={false}
            >
                {/* Current location marker */}
                {telematicsData && telematicsData.length > 0 && (
                    <Marker
                        longitude={currentLocation[0]}
                        latitude={currentLocation[1]}
                        anchor="center"
                    >
                        <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
                        </div>
                    </Marker>
                )}

                {/* Route line */}
                {telematicsData && telematicsData.length > 1 && (
                    <Source type="geojson" data={routeData}>
                        <Layer
                            type="line"
                            paint={{
                                'line-color': '#3b82f6',
                                'line-width': 3,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Speed indicators */}
                {telematicsData && telematicsData.slice(-10).map((point, index) => (
                    <Marker
                        key={index}
                        longitude={point.location.coordinates[0]}
                        latitude={point.location.coordinates[1]}
                        anchor="center"
                    >
                        <div
                            className={`w-2 h-2 rounded-full ${point.speed > 60 ? 'bg-red-500' :
                                    point.speed > 35 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                            title={`Speed: ${point.speed} mph`}
                        >
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
}

export default TripMap;
