import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { MapPin, Clock, Gauge, AlertTriangle, Calendar } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

function TripHistory() {
    const { token } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('7');

    useEffect(() => {
        fetchTripHistory();
    }, [selectedPeriod, token]);

    const fetchTripHistory = async () => {
        try {
            setLoading(true);
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (selectedPeriod * 24 * 60 * 60 * 1000));

            const data = await apiService.get(
                `/telematics/data?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=50`,
                token
            );

            // Group data by tripId
            const tripGroups = {};
            data.data.forEach(point => {
                if (!tripGroups[point.tripId]) {
                    tripGroups[point.tripId] = [];
                }
                tripGroups[point.tripId].push(point);
            });

            // Convert to trip summaries
            const tripSummaries = Object.entries(tripGroups).map(([tripId, points]) => {
                const sortedPoints = points.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const startTime = new Date(sortedPoints[0].timestamp);
                const endTime = new Date(sortedPoints[sortedPoints.length - 1].timestamp);
                const duration = (endTime - startTime) / (1000 * 60); // minutes

                const speeds = sortedPoints.map(p => p.speed);
                const maxSpeed = Math.max(...speeds);
                const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

                const harshEvents = sortedPoints.reduce((count, point) => {
                    return count +
                        (point.events.harshBraking ? 1 : 0) +
                        (point.events.harshAcceleration ? 1 : 0) +
                        (point.events.harshTurning ? 1 : 0) +
                        (point.events.phoneUsage ? 1 : 0);
                }, 0);

                // Estimate distance
                let distance = 0;
                for (let i = 1; i < sortedPoints.length; i++) {
                    const timeDiff = (sortedPoints[i].timestamp - sortedPoints[i - 1].timestamp) / (1000 * 60 * 60);
                    const avgSpeedPair = (sortedPoints[i].speed + sortedPoints[i - 1].speed) / 2;
                    distance += avgSpeedPair * timeDiff;
                }

                return {
                    tripId,
                    startTime,
                    endTime,
                    duration: Math.round(duration),
                    distance: Math.round(distance * 10) / 10,
                    maxSpeed: Math.round(maxSpeed),
                    avgSpeed: Math.round(avgSpeed),
                    harshEvents,
                    dataPoints: sortedPoints.length,
                    startLocation: sortedPoints[0].location.coordinates,
                    endLocation: sortedPoints[sortedPoints.length - 1].location.coordinates
                };
            });

            setTrips(tripSummaries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
        } catch (error) {
            setError('Failed to load trip history');
            console.error('Trip history error:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                </select>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {trips.length === 0 ? (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                    <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
                    <p className="text-gray-600">No driving data available for the selected period.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trips.map((trip) => (
                        <div key={trip.tripId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Trip Info */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {trip.startTime.toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {trip.startTime.toLocaleTimeString()} - {trip.endTime.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <div className="flex items-center space-x-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{trip.duration} min</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{trip.distance} mi</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Speed Stats */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Speed</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Average:</span>
                                            <span className="text-sm font-medium">{trip.avgSpeed} mph</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Maximum:</span>
                                            <span className="text-sm font-medium">{trip.maxSpeed} mph</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Events */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Events</h4>
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className={`h-5 w-5 ${trip.harshEvents > 0 ? 'text-red-500' : 'text-green-500'
                                            }`} />
                                        <span className={`text-sm font-medium ${trip.harshEvents > 0 ? 'text-red-700' : 'text-green-700'
                                            }`}>
                                            {trip.harshEvents} harsh events
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {trip.dataPoints} data points recorded
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TripHistory;
