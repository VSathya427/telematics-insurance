import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import RegisterVehicle from './components/Auth/RegisterVehicle';
import Dashboard from './components/Dashboard/Dashboard';
import RealTimeData from './components/Telematics/RealTimeData';
import TripHistory from './components/Telematics/TripHistory';
import RiskAnalysis from './components/Analytics/RiskAnalysis';
import DrivingPatterns from './components/Analytics/DrivingPatterns';
import MLAnalytics from './components/Analytics/MLAnalytics';



function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/register-vehicle" element={<RegisterVehicle />} />
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="real-time" element={<RealTimeData />} />
                            <Route path="trips" element={<TripHistory />} />
                            <Route path="risk-analysis" element={<RiskAnalysis />} />
                            <Route path="driving-patterns" element={<DrivingPatterns />} />
                            <Route path="ml-analytics" element={<MLAnalytics />} />
                        </Route>
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
