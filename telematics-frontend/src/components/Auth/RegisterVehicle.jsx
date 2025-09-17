import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { Car, Check } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

function RegisterVehicle() {
    const [formData, setFormData] = useState({
        vin: '',
        make: '',
        model: '',
        year: '',
        color: '',
        mileage: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiService.post('/vehicles/register-vehicle', formData, token);
            navigate('/dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to register vehicle');
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Almost Done!</h2>
                        <p className="text-gray-600 mt-2">Register your vehicle to start getting personalized rates</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                VIN (Vehicle Identification Number) *
                            </label>
                            <input
                                name="vin"
                                type="text"
                                required
                                maxLength="17"
                                value={formData.vin}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                                placeholder="1HGBH41JXMN109186"
                            />
                            <p className="text-xs text-gray-500 mt-1">17 characters, found on your dashboard or door jamb</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Make *
                                </label>
                                <input
                                    name="make"
                                    type="text"
                                    required
                                    value={formData.make}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Honda"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Model *
                                </label>
                                <input
                                    name="model"
                                    type="text"
                                    required
                                    value={formData.model}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Civic"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year *
                                </label>
                                <input
                                    name="year"
                                    type="number"
                                    required
                                    min="1990"
                                    max="2024"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="2021"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Color
                                </label>
                                <input
                                    name="color"
                                    type="text"
                                    value={formData.color}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Blue"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Mileage
                            </label>
                            <input
                                name="mileage"
                                type="number"
                                min="0"
                                value={formData.mileage}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="25000"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                            >
                                {loading ? <LoadingSpinner size="sm" /> : 'Register Vehicle'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition duration-200"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <Car className="h-6 w-6 text-blue-600" />
                            <div>
                                <h4 className="font-semibold text-blue-900">Why register your vehicle?</h4>
                                <p className="text-sm text-blue-700">
                                    Vehicle registration allows us to track your actual driving data and provide personalized insurance rates based on your real behavior.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterVehicle;
 