import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

function WeeklyPatternChart({ stats }) {
    if (!stats || !stats.weeklyPattern) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Weekly Driving Pattern</h3>
                <div className="text-center py-8 text-gray-500">
                    Loading weekly pattern...
                </div>
            </div>
        );
    }

    // Convert weeklyPattern object to array for chart
    const chartData = [
        { day: 'Sun', trips: stats.weeklyPattern.Sunday, fullDay: 'Sunday' },
        { day: 'Mon', trips: stats.weeklyPattern.Monday, fullDay: 'Monday' },
        { day: 'Tue', trips: stats.weeklyPattern.Tuesday, fullDay: 'Tuesday' },
        { day: 'Wed', trips: stats.weeklyPattern.Wednesday, fullDay: 'Wednesday' },
        { day: 'Thu', trips: stats.weeklyPattern.Thursday, fullDay: 'Thursday' },
        { day: 'Fri', trips: stats.weeklyPattern.Friday, fullDay: 'Friday' },
        { day: 'Sat', trips: stats.weeklyPattern.Saturday, fullDay: 'Saturday' }
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-medium">{data.fullDay}</p>
                    <p className="text-blue-600">
                        <span className="font-medium">{data.trips}</span> trips
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Weekly Driving Pattern</h3>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="trips"
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                            minPointSize={2}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary below chart */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-xs">
                {chartData.map((item, index) => (
                    <div key={index} className="text-center">
                        <div className="font-medium text-gray-700">{item.day}</div>
                        <div className="text-gray-500">{item.trips} trips</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WeeklyPatternChart;
