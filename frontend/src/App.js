import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout Imports
import MainLayout from './components/layout/MainLayout';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LivePrediction from './pages/LivePrediction';
import TechnicianManager from './pages/TechnicianManager';
import MaintenanceSchedule from './pages/MaintenanceSchedule';
import PredictionHistory from './pages/PredictionHistory';
import MachinesList from './pages/MachinesList';
import Analytics from './pages/Analytics';

// Secure Route Wrapper
const ProtectedRoute = ({ children }) => {
    // Check if the user has authenticated successfully
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    // If not authenticated, redirect to the login page immediately
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // If authenticated, render the requested component
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Unprotected Route */}
                <Route path="/login" element={<Login />} />
                
                {/* Default Route Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Protected Routes (Wrapped in MainLayout for Sidebar/Header) */}
                <Route 
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/machines" element={<MachinesList />} />
                    <Route path="/predict" element={<LivePrediction />} />
                    <Route path="/schedule" element={<MaintenanceSchedule />} />
                    <Route path="/history" element={<PredictionHistory />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/technicians" element={<TechnicianManager />} />
                </Route>

                {/* Catch-all route for 404s */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;