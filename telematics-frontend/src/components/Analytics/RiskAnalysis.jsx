import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { AlertTriangle, TrendingDown, Shield, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import MLRiskTrendChart from './MLRiskTrendChart';

function RiskAnalysis() {
    const { token } = useAuth();
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRiskAnalysis();
    }, [token]);

    const fetchRiskAnalysis = async () => {
        try {
            const data = await apiService.get('/scoring/risk-analysis', token);
            setAnalysisData(data);
        } catch (error) {
            setError('Failed to load risk analysis');
            console.error('Risk analysis error:', error);
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

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    const getRiskLevel = (score) => {
        if (score <= 30) return { level: 'Low', color: 'green', icon: CheckCircle };
        if (score <= 50) return { level: 'Moderate', color: 'yellow', icon: Shield };
        if (score <= 70) return { level: 'High', color: 'orange', icon: AlertTriangle };
        return { level: 'Very High', color: 'red', icon: AlertTriangle };
    };

    const riskInfo = getRiskLevel(analysisData?.riskScore || 50);
    const RiskIcon = riskInfo.icon;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Risk Analysis</h1>

            {/* Overall Risk Score */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Overall Risk Assessment</h3>
                    <div className={`flex items-center space-x-2 text-${riskInfo.color}-600`}>
                        <RiskIcon className="h-6 w-6" />
                        <span className="font-semibold">{riskInfo.level} Risk</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Risk Score</span>
                                <span className="text-3xl font-bold text-gray-900">
                                    {analysisData?.riskScore || 'N/A'}/100
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className={`bg-${riskInfo.color}-500 h-4 rounded-full transition-all duration-500`}
                                    style={{ width: `${analysisData?.riskScore || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-700 mb-3">Risk Factors Breakdown</h4>
                        {analysisData?.factors && (
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Speed Violations:</span>
                                    <span className="text-sm font-medium">
                                        {(analysisData.factors.speedViolations?.rate * 100 || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Harsh Events:</span>
                                    <span className="text-sm font-medium">
                                        {(analysisData.factors.harshEvents?.rate * 100 || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Phone Usage:</span>
                                    <span className="text-sm font-medium">
                                        {(analysisData.factors.phoneUsage?.rate * 100 || 0).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {analysisData?.recommendations && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
                    <div className="space-y-4">
                        {analysisData.recommendations.map((rec, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-gray-900">{rec.category}</h4>
                                    <span className={`text-xs px-2 py-1 rounded-full ${rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {rec.priority} Priority
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{rec.message}</p>
                                <p className="text-xs text-green-600 font-medium">{rec.impact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Historical Trend */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Risk Score Trend</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Risk trend chart would appear here</p>
                        <p className="text-sm text-gray-500">Historical data visualization</p>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <MLRiskTrendChart days={180} />
            </div>
        </div>
    );
}

export default RiskAnalysis;
