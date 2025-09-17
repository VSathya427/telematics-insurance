import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import TripMap from './TripMap';
import { Activity, MapPin, Gauge, Clock, Phone, AlertTriangle } from 'lucide-react';
// Add this import to src/components/Telematics/RealTimeData.jsx
import WeatherDisplay from '../Common/WeatherDisplay';

function RealTimeData() {
    const { user } = useAuth();
    const [telematicsData, setTelematicsData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socket = useSocket();

    useEffect(() => {
        if (socket) {
            socket.emit('join-user', user?.id);

            socket.on('connect', () => {
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                setIsConnected(false);
            });

            socket.on('telematicsUpdate', (data) => {
                setTelematicsData(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 entries
            });

            return () => {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('telematicsUpdate');
            };
        }
    }, [socket, user?.id]);

    const currentData = telematicsData[0];
    const hasHarshEvents = currentData?.events && (
        currentData.events.harshBraking ||
        currentData.events.harshAcceleration ||
        currentData.events.harshTurning ||
        currentData.events.phoneUsage
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Real-Time Driving Data</h1>
                <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Current Status */}
            {currentData && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Current Trip Status</h3>
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-green-700">Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Gauge className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-900">{currentData.speed}</p>
                            <p className="text-sm text-blue-600">mph</p>
                        </div>

                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-green-900">
                                {currentData.location.coordinates[1].toFixed(4)}°
                            </p>
                            <p className="text-xs text-green-600">Latitude</p>
                        </div>

                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-purple-900">
                                {new Date(currentData.timestamp).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-purple-600">Updated</p>
                        </div>

                        <div className={`text-center p-4 rounded-lg ${hasHarshEvents ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${hasHarshEvents ? 'text-red-600' : 'text-gray-400'}`} />
                            <p className={`text-sm font-semibold ${hasHarshEvents ? 'text-red-900' : 'text-gray-500'}`}>
                                {hasHarshEvents ? 'Alert' : 'Normal'}
                            </p>
                            <p className={`text-xs ${hasHarshEvents ? 'text-red-600' : 'text-gray-400'}`}>Status</p>
                        </div>
                    </div>

                    {/* Event Alerts */}
                    {hasHarshEvents && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-red-900 mb-2">Driving Events Detected</h4>
                            <div className="space-y-1">
                                {currentData.events.harshBraking && (
                                    <p className="text-sm text-red-700">⚠️ Harsh braking detected</p>
                                )}
                                {currentData.events.harshAcceleration && (
                                    <p className="text-sm text-red-700">⚠️ Harsh acceleration detected</p>
                                )}
                                {currentData.events.harshTurning && (
                                    <p className="text-sm text-red-700">⚠️ Harsh turning detected</p>
                                )}
                                {currentData.events.phoneUsage && (
                                    <p className="text-sm text-red-700">📱 Phone usage detected</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Weather Info */}
                    {currentData.weather && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Current Conditions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-blue-600 font-medium">Condition</p>
                                    <p className="text-blue-900 capitalize">{currentData.weather.condition}</p>
                                </div>
                                <div>
                                    <p className="text-blue-600 font-medium">Temperature</p>
                                    <p className="text-blue-900">{currentData.weather.temperature}°F</p>
                                </div>
                                <div>
                                    <p className="text-blue-600 font-medium">Visibility</p>
                                    <p className="text-blue-900">{currentData.weather.visibility} km</p>
                                </div>
                                <div>
                                    <p className="text-blue-600 font-medium">Road Risk</p>
                                    <p className={`font-semibold ${currentData.weather.roadRisk > 0.5 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {(currentData.weather.roadRisk * 100).toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}


                    // Add this after your current data display
                    {
                        currentData && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold mb-4">Current Conditions</h3>
                                <WeatherDisplay
                                    location={{
                                        lat: currentData.location.coordinates[1],
                                        lng: currentData.location.coordinates[0]
                                    }}
                                />
                            </div>
                        )
                    }

                </div>
            )}

            {/* Map */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold">Live Location Tracking</h3>
                </div>
                <div className="h-96">
                    <TripMap telematicsData={telematicsData} />
                </div>
            </div>

            {/* Recent Data Stream */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Recent Data Points</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {telematicsData.slice(0, 10).map((data, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="flex items-center space-x-4">
                                <span className="font-mono text-gray-500">
                                    {new Date(data.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="font-semibold">{data.speed} mph</span>
                                <span className="text-gray-600 capitalize">{data.roadType}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {data.events.harshBraking && <span className="text-red-500 text-xs">🛑</span>}
                                {data.events.harshAcceleration && <span className="text-orange-500 text-xs">🚀</span>}
                                {data.events.harshTurning && <span className="text-yellow-500 text-xs">↩️</span>}
                                {data.events.phoneUsage && <span className="text-purple-500 text-xs">📱</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RealTimeData;
