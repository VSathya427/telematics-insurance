import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function MLRiskTrendChart({ days = 180 }) {
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const chartRef = useRef(null);

    useEffect(() => {
        fetchMLRiskTrend();
    }, [days, token]);

    // Cleanup chart on unmount
    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, []);

    const fetchMLRiskTrend = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError('');

            // Call the /risk-trend-ml endpoint with timeout handling
            const response = await apiService.getMLRiskTrend(token, days);
            setTrendData(response.trend);
        } catch (error) {
            console.error('Error fetching ML risk trend:', error);

            // Better error handling
            if (error.code === 'ECONNABORTED') {
                setError('Request timed out. The server is taking longer than expected. Please try again.');
            } else if (error.response?.status === 500) {
                setError('Server error. Please check if the backend is running and try again.');
            } else if (error.response?.status === 404) {
                setError('ML risk trend endpoint not found. Please check your API configuration.');
            } else {
                setError(`Failed to load ML risk trend: ${error.message || 'Unknown error'}`);
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-2 text-sm text-gray-600">Loading ML risk data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading ML data</h3>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                        <button
                            onClick={fetchMLRiskTrend}
                            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!trendData || trendData.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-500 mb-4">No ML trend data available</p>
                <button
                    onClick={fetchMLRiskTrend}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Refresh Data
                </button>
            </div>
        );
    }

    const chartData = {
        labels: trendData.map(point => `Week ${point.week}`),
        datasets: [
            {
                label: 'ML Risk Score',
                data: trendData.map(point => point.mlScore || 0),
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.1,
            },
            {
                label: 'Traditional Score',
                data: trendData.map(point => point.traditionalScore || 0),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1,
            },
            {
                label: 'Final Score',
                data: trendData.map(point => point.riskScore || 0),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.1,
                borderWidth: 3,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `ML-Enhanced Risk Score Trend (${days} days)`,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Risk Score'
                }
            }
        },
    };

    // Calculate statistics safely
    const mlScores = trendData.filter(d => d.mlScore && !isNaN(d.mlScore)).map(d => d.mlScore);
    const mlAverage = mlScores.length > 0 ? Math.round(mlScores.reduce((sum, score) => sum + score, 0) / mlScores.length) : 0;
    const mlUsagePercentage = Math.round((trendData.filter(d => d.method === 'ml_enhanced').length / trendData.length) * 100);

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">ML-Enhanced Risk Trend</h3>
                <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>ML Enhanced: {mlUsagePercentage}%</span>
                    </div>
                    <div className="text-gray-600">
                        Avg ML Score: {mlAverage}
                    </div>
                </div>
            </div>

            <div className="h-64 mb-4">
                <Line
                    ref={chartRef}
                    data={chartData}
                    options={options}
                    key={`ml-chart-${days}-${trendData.length}`}
                />
            </div>

            {/* ML Usage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-purple-600 font-medium">ML Predictions</p>
                    <p className="text-xl font-bold text-purple-900">
                        {trendData.filter(d => d.method === 'ml_enhanced').length}
                    </p>
                    <p className="text-xs text-purple-600">out of {trendData.length} weeks</p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-blue-600 font-medium">Avg Confidence</p>
                    <p className="text-xl font-bold text-blue-900">
                        {Math.round(trendData.reduce((sum, d) => sum + (d.confidence || 0), 0) / trendData.length * 100)}%
                    </p>
                    <p className="text-xs text-blue-600">ML confidence level</p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-600 font-medium">Risk Improvement</p>
                    <p className="text-xl font-bold text-green-900">
                        {trendData.length >= 2 ?
                            Math.round((trendData[0]?.riskScore || 0) - (trendData[trendData.length - 1]?.riskScore || 0)) : 0
                        } pts
                    </p>
                    <p className="text-xs text-green-600">since start of period</p>
                </div>
            </div>
        </div>
    );
}

export default MLRiskTrendChart;
