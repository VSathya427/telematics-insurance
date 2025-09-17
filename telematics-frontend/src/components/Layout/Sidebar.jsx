import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Activity,
    MapPin,  // Changed from Route to MapPin
    BarChart3,
    TrendingUp,
    Cpu
} from 'lucide-react';

function Sidebar() {
    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/real-time', icon: Activity, label: 'Real-Time Data' },
        { to: '/trips', icon: MapPin, label: 'Trip History' }, // Fixed icon
        { to: '/risk-analysis', icon: BarChart3, label: 'Risk Analysis' },
        { to: '/driving-patterns', icon: TrendingUp, label: 'Driving Patterns' },
        { to: '/ml-analytics', icon: Cpu, label: 'ML Analytics' }
    ];

    return (
        <aside className="w-64 bg-white shadow-lg">
            <div className="p-6">
                <nav className="space-y-2">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;
