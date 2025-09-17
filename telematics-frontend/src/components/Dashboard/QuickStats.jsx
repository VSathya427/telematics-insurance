import React from 'react';
import { TrendingUp, TrendingDown, Minus, Car, AlertTriangle } from 'lucide-react';

function QuickStats({ data }) {
    if (!data) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Driving Statistics</h3>
                <p className="text-gray-500">No statistics available</p>
            </div>
        );
    }

    const getTrendIcon = (current, previous) => {
        if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-500" />;
    };

    const stats = [
        {
            label: 'Total Distance',
            value: data.totalDistance ? `${data.totalDistance.toFixed(1)} mi` : 'N/A',
            change: '+5%',
            trend: 'up',
            icon: Car
        },
        {
            label: 'Average Speed',
            value: data.avgSpeed ? `${data.avgSpeed} mph` : 'N/A',
            change: '-2%',
            trend: 'down',
            icon: TrendingUp
        },
        {
            label: 'Harsh Events',
            value: data.totalHarshEvents || 0,
            change: data.totalHarshEvents > 5 ? '+15%' : '-8%',
            trend: data.totalHarshEvents > 5 ? 'up' : 'down',
            icon: AlertTriangle
        },
        {
            label: 'Night Driving',
            value: data.nightDrivingPercentage ? `${data.nightDrivingPercentage}%` : '0%',
            change: '-3%',
            trend: 'down',
            icon: Car
        }
    ];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Driving Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <IconComponent className="h-5 w-5 text-gray-500" />
                                <span className={`text-xs flex items-center space-x-1 ${stat.trend === 'up' ? 'text-green-600' :
                                        stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                    {getTrendIcon(1, 0)}
                                    <span>{stat.change}</span>
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {data.period && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Data from {data.period}</p>
                </div>
            )}
        </div>
    );
}

export default QuickStats;
