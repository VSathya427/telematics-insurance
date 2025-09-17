import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { Clock, MapPin, Gauge, Calendar } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

function DrivingPatterns() {
    const { token } = useAuth();
    const [patternData, setPatternData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDrivingPatterns();
    }, [token]);

    const fetchDrivingPatterns = async () => {
        try {
            const [statsData, telematicsData] = await Promise.all([
                apiService.get('/telematics/stats?days=30', token),
                apiService.get('/telematics/data?limit=100', token)
            ]);

            // Analyze patterns from the data
            const patterns = analyzeDrivingPatterns(telematicsData.data);

            setPatternData({
                stats: statsData.stats,
                patterns
            });
        } catch (error) {
            setError('Failed to load driving patterns');
            console.error('Driving patterns error:', error);
        }
        setLoading(false);
    };

    const analyzeDrivingPatterns = (data) => {
        const hourlyDistribution = Array(24).fill(0);
        const weeklyDistribution = Array(7).fill(0);
        const speedDistribution = { low: 0, medium: 0, high: 0 };
        const roadTypeDistribution = {};

        data.forEach(point => {
            const date = new Date(point.timestamp);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();

            hourlyDistribution[hour]++;
            weeklyDistribution[dayOfWeek]++;

            // Speed categorization
            if (point.speed < 25) speedDistribution.low++;
            else if (point.speed < 55) speedDistribution.medium++;
            else speedDistribution.high++;

            // Road type distribution
            roadTypeDistribution[point.roadType] = (roadTypeDistribution[point.roadType] || 0) + 1;
        });

        return {
            hourlyDistribution,
            weeklyDistribution,
            speedDistribution,
            roadTypeDistribution,
            totalDataPoints: data.length
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const peakHour = patternData?.patterns.hourlyDistribution.indexOf(
        Math.max(...patternData?.patterns.hourlyDistribution)
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Driving Patterns</h1>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <Clock className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Peak Hour</p>
                            <p className="text-xl font-bold text-gray-900">
                                {peakHour !== undefined ? `${peakHour}:00` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <Gauge className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-600">Avg Speed</p>
                            <p className="text-xl font-bold text-gray-900">
                                {patternData?.stats?.avgSpeed || 'N/A'} mph
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <MapPin className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Trips</p>
                            <p className="text-xl font-bold text-gray-900">
                                {patternData?.stats?.totalTrips || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <Calendar className="h-8 w-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-gray-600">Data Points</p>
                            <p className="text-xl font-bold text-gray-900">
                                {patternData?.patterns?.totalDataPoints || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hourly Pattern */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Driving Hours Distribution</h3>
                <div className="grid grid-cols-12 gap-2">
                    {patternData?.patterns.hourlyDistribution.map((count, hour) => {
                        const maxCount = Math.max(...patternData.patterns.hourlyDistribution);
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                        return (
                            <div key={hour} className="text-center">
                                <div className="h-32 flex items-end justify-center mb-2">
                                    <div
                                        className="bg-blue-500 w-8 rounded-t"
                                        style={{ height: `${height}%` }}
                                        title={`${hour}:00 - ${count} trips`}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-600">{hour}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weekly Pattern */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Weekly Driving Pattern</h3>
                <div className="grid grid-cols-7 gap-4">
                    {patternData?.patterns.weeklyDistribution.map((count, dayIndex) => {
                        const maxCount = Math.max(...patternData.patterns.weeklyDistribution);
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                        return (
                            <div key={dayIndex} className="text-center">
                                <div className="h-24 flex items-end justify-center mb-2">
                                    <div
                                        className="bg-green-500 w-12 rounded-t"
                                        style={{ height: `${percentage}%` }}
                                        title={`${dayNames[dayIndex]} - ${count} trips`}
                                    ></div>
                                </div>
                                <p className="text-sm font-medium text-gray-700">{dayNames[dayIndex]}</p>
                                <p className="text-xs text-gray-500">{count} trips</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Speed Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">Speed Distribution</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Low Speed (&lt;25 mph)</span>
                            <span className="text-sm font-medium">
                                {patternData?.patterns.speedDistribution.low || 0} trips
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Medium Speed (25-55 mph)</span>
                            <span className="text-sm font-medium">
                                {patternData?.patterns.speedDistribution.medium || 0} trips
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">High Speed (&gt;55 mph)</span>
                            <span className="text-sm font-medium">
                                {patternData?.patterns.speedDistribution.high || 0} trips
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">Road Type Usage</h3>
                    <div className="space-y-3">
                        {Object.entries(patternData?.patterns.roadTypeDistribution || {}).map(([roadType, count]) => (
                            <div key={roadType} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 capitalize">{roadType}</span>
                                <span className="text-sm font-medium">{count} data points</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DrivingPatterns;
