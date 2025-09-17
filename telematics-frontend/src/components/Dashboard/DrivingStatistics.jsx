import React from 'react';
import { Car, Clock, AlertTriangle, Moon } from 'lucide-react';

function DrivingStatistics({ stats }) {
    if (!stats) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Driving Statistics</h3>
                <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📊</div>
                    <p className="text-gray-500">Loading statistics...</p>
                </div>
            </div>
        );
    }

    // Calculate percentage changes (mock data for demo)
    const changes = {
        totalDistance: Math.round((Math.random() - 0.5) * 20), // -10 to +10%
        averageSpeed: Math.round((Math.random() - 0.5) * 10), // -5 to +5%
        harshEvents: Math.round((Math.random() - 0.3) * 20), // Usually negative (improvement)
        nightDriving: Math.round((Math.random() - 0.5) * 8) // -4 to +4%
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Driving Statistics</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Distance */}
                <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                        <Car className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Total Distance</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.totalDistance.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">miles</div>
                    <div className={`text-xs mt-1 ${changes.totalDistance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes.totalDistance >= 0 ? '+' : ''}{changes.totalDistance}%
                    </div>
                </div>

                {/* Average Speed */}
                <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                        <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Average Speed</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.averageSpeed}
                    </div>
                    <div className="text-xs text-gray-400">mph</div>
                    <div className={`text-xs mt-1 ${changes.averageSpeed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes.averageSpeed >= 0 ? '+' : ''}{changes.averageSpeed}%
                    </div>
                </div>

                {/* Harsh Events */}
                <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Harsh Events</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.harshEvents}
                    </div>
                    <div className="text-xs text-gray-400">events</div>
                    <div className={`text-xs mt-1 ${changes.harshEvents <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes.harshEvents >= 0 ? '+' : ''}{changes.harshEvents}%
                    </div>
                </div>

                {/* Night Driving */}
                <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                        <Moon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Night Driving</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.nightDrivingPercentage}%
                    </div>
                    <div className="text-xs text-gray-400">of trips</div>
                    <div className={`text-xs mt-1 ${changes.nightDriving <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes.nightDriving >= 0 ? '+' : ''}{changes.nightDriving}%
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DrivingStatistics;
