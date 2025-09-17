import React, { useState } from 'react';
import MLRiskTrendChart from './MLRiskTrendChart';
import { Cpu, TrendingUp, Shield, BarChart3 } from 'lucide-react';

function MLAnalytics() {
    const [selectedPeriod, setSelectedPeriod] = useState(180);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Cpu className="h-8 w-8 text-purple-600" />
                    <h1 className="text-2xl font-bold text-gray-900">ML Analytics Dashboard</h1>
                </div>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={180}>Last 180 days</option>
                    <option value={365}>Last year</option>
                </select>
            </div>

            {/* ML Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">ML Accuracy</p>
                            <p className="text-3xl font-bold text-purple-600">94.2%</p>
                        </div>
                        <Shield className="h-12 w-12 text-purple-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
                            <p className="text-3xl font-bold text-blue-600">87%</p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">ML Usage</p>
                            <p className="text-3xl font-bold text-green-600">73%</p>
                        </div>
                        <BarChart3 className="h-12 w-12 text-green-500 opacity-20" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Data Points</p>
                            <p className="text-3xl font-bold text-orange-600">12.5K</p>
                        </div>
                        <Cpu className="h-12 w-12 text-orange-500 opacity-20" />
                    </div>
                </div>
            </div>

            {/* ML Risk Trend Chart */}
            <MLRiskTrendChart days={selectedPeriod} />
        </div>
    );
}

export default MLAnalytics;
