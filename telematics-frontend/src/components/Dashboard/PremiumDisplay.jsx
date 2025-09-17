import React from 'react';
import { DollarSign, TrendingDown, Calculator, AlertCircle } from 'lucide-react';

function PremiumDisplay({ data }) {
    if (!data) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Premium Breakdown</h3>
                <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No premium data available</p>
                    </div>
                </div>
            </div>
        );
    }

    const {
        basePremium,
        finalPremium,
        potentialSavings,
        riskMultiplier,
        demographicMultiplier,
        usageMultiplier,
        riskScore
    } = data;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Your Premium</h3>
                <div className="flex items-center space-x-2 text-green-600">
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-medium">${potentialSavings || 0} Saved</span>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Monthly Premium</span>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-green-600">${finalPremium || 0}</span>
                        <span className="text-sm text-gray-500 ml-2">/month</span>
                    </div>
                </div>

                {potentialSavings && potentialSavings > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">
                                You're saving ${potentialSavings}/month with telematics!
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center space-x-2">
                    <Calculator className="h-4 w-4" />
                    <span>Premium Breakdown</span>
                </h4>

                <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Base Premium</span>
                        <span className="text-sm font-medium">${basePremium || 0}</span>
                    </div>

                    {riskMultiplier && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Risk Adjustment</span>
                            <span className={`text-sm font-medium ${riskMultiplier < 1 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {riskMultiplier < 1 ? '↓' : '↑'} {Math.abs((riskMultiplier * 100 - 100)).toFixed(0)}%
                            </span>
                        </div>
                    )}

                    {demographicMultiplier && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Demographic Factor</span>
                            <span className={`text-sm font-medium ${demographicMultiplier < 1 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {demographicMultiplier < 1 ? '↓' : '↑'} {Math.abs((demographicMultiplier * 100 - 100)).toFixed(0)}%
                            </span>
                        </div>
                    )}

                    {usageMultiplier && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Usage Factor</span>
                            <span className={`text-sm font-medium ${usageMultiplier < 1 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {usageMultiplier < 1 ? '↓' : '↑'} {Math.abs((usageMultiplier * 100 - 100)).toFixed(0)}%
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center py-2 pt-4 border-t-2 border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Final Premium</span>
                        <span className="text-lg font-bold text-green-600">${finalPremium || 0}</span>
                    </div>
                </div>
            </div>

            {riskScore && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Current Risk Score</span>
                        <span className="text-lg font-bold text-blue-600">{riskScore}/100</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${riskScore}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                    Your premium is calculated based on your actual driving behavior.
                    Continue safe driving to maintain or improve your rates!
                </p>
            </div>
        </div>
    );
}

export default PremiumDisplay;
