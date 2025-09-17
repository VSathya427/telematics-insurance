import React from 'react';
import { Shield, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

function RiskScore({ data }) {
    if (!data) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Risk Score</h3>
                <p className="text-gray-500">No risk data available</p>
            </div>
        );
    }

    const { riskScore, factors } = data;

    const getRiskLevel = (score) => {
        if (score <= 30) return { level: 'Low', color: 'green', icon: CheckCircle };
        if (score <= 50) return { level: 'Moderate', color: 'yellow', icon: Shield };
        if (score <= 70) return { level: 'High', color: 'orange', icon: AlertCircle };
        return { level: 'Very High', color: 'red', icon: AlertCircle };
    };

    const riskInfo = getRiskLevel(riskScore);
    const RiskIcon = riskInfo.icon;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Driving Risk Score</h3>
                <div className={`flex items-center space-x-2 text-${riskInfo.color}-600`}>
                    <RiskIcon className="h-5 w-5" />
                    <span className="font-medium">{riskInfo.level} Risk</span>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Current Score</span>
                    <span className="text-2xl font-bold text-gray-900">{riskScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`bg-${riskInfo.color}-500 h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${riskScore}%` }}
                    ></div>
                </div>
            </div>

            {factors && (
                <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Risk Factors</h4>

                    {factors.speedViolations && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Speed Violations</span>
                            <span className={`text-sm font-medium ${factors.speedViolations.rate > 0.1 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {(factors.speedViolations.rate * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}

                    {factors.harshEvents && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Harsh Events</span>
                            <span className={`text-sm font-medium ${factors.harshEvents.rate > 0.05 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {(factors.harshEvents.rate * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}

                    {factors.phoneUsage && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Phone Usage</span>
                            <span className={`text-sm font-medium ${factors.phoneUsage.rate > 0.02 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {(factors.phoneUsage.rate * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                        Improvement Tip
                    </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                    {riskScore > 50
                        ? "Focus on reducing harsh braking and acceleration events to improve your score."
                        : "Great job! Maintain your safe driving habits to keep your low rates."}
                </p>
            </div>

            {data.method === 'ml_enhanced' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-purple-900">🤖 AI-Enhanced Risk Scoring</span>
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                            {Math.round(data.confidence * 100)}% Confidence
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-purple-600 font-medium">ML Risk Score</p>
                            <p className="text-2xl font-bold text-purple-900">{data.mlScore}</p>
                        </div>
                        <div>
                            <p className="text-purple-600 font-medium">Traditional Score</p>
                            <p className="text-2xl font-bold text-purple-900">{data.traditionalScore.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-purple-700">
                        <p>✨ This score uses machine learning trained on real driving patterns</p>
                        <p>📊 Analyzed {data.telemetrySummary?.totalDataPoints} data points over {data.telemetrySummary?.timeSpan}</p>
                    </div>
                </div>
            )}

            {data.dataQuality && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Data Quality</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <div>Data Points: {data.dataQuality.totalDataPoints}</div>
                        <div>Time Span: {data.dataQuality.timeSpan} days</div>
                        <div>Sufficient Data: {data.dataQuality.sufficientData ? '✅ Yes' : '⚠️ No'}</div>
                        <div>Method: {data.method.replace('_', ' ')}</div>
                    </div>
                </div>
            )}


        </div>
    );
}

export default RiskScore;
