import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Car, Bell, User, LogOut } from 'lucide-react';

function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <Car className="h-8 w-8 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">TelematicsInsure</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 block h-2 w-2 bg-red-400 rounded-full"></span>
                        </button>

                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.firstName} {user?.lastName}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
