import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import QuickStats from './QuickStats';
import RiskScore from './RiskScore';
import PremiumDisplay from './PremiumDisplay';
import { Car, TrendingUp, Shield, DollarSign } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import TripMap from '../Telematics/TripMap';
import MLRiskTrendChart from '../Analytics/MLRiskTrendChart';


function Dashboard() {
    const { user, token } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [riskData, premiumData, statsData] = await Promise.all([
                    apiService.get('/scoring/risk-score', token),
                    apiService.get('/pricing/premium-hybrid', token),
                    apiService.get('/telematics/stats?days=30', token)
                ]);

                setDashboardData({
                    risk: riskData,
                    premium: premiumData,
                    stats: statsData
                });
            } catch (error) {
                setError('Failed to load dashboard data');
                console.error('Dashboard error:', error);
            }
            setLoading(false);
        };

        if (token) {
            fetchDashboardData();
        }
    }, [token]);

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

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Welcome back, {user?.firstName}!
                        </h1>
                        <p className="text-blue-100 mt-2">
                            Here's how your driving is impacting your insurance rates
                        </p>
                    </div>
                    <Car className="h-16 w-16 text-blue-200" />
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Risk Score</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {dashboardData?.risk?.riskScore || 'N/A'}
                            </p>
                        </div>
                        <Shield className="h-12 w-12 text-blue-500 opacity-20" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {dashboardData?.risk?.riskScore <= 30 ? 'Excellent' :
                            dashboardData?.risk?.riskScore <= 50 ? 'Good' :
                                dashboardData?.risk?.riskScore <= 70 ? 'Fair' : 'Needs Improvement'}
                    </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Monthly Premium</p>
                            <p className="text-3xl font-bold text-green-600">
                                ${dashboardData?.premium?.finalPremium || 'N/A'}
                            </p>
                        </div>
                        <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                        ↓ ${dashboardData?.premium?.potentialSavings || 0} vs traditional
                    </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Trips</p>
                            <p className="text-3xl font-bold text-purple-600">
                                {dashboardData?.stats?.totalTrips || 0}
                            </p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Speed</p>
                            <p className="text-3xl font-bold text-orange-600">
                                {dashboardData?.stats?.avgSpeed || 0} mph
                            </p>
                        </div>
                        <Car className="h-12 w-12 text-orange-500 opacity-20" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Overall average</p>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <div className="h-64">
                    <TripMap telematicsData={dashboardData?.recentTrips || []} />
                </div>
            </div>


            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskScore data={dashboardData?.risk} />
                <PremiumDisplay data={dashboardData?.premium} />
            </div>

            <div className="mt-6">
                <MLRiskTrendChart days={90} />
            </div>


            <QuickStats data={dashboardData?.stats} />
        </div>
    );
}

export default Dashboard;
