import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings as SettingsIcon, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';

const Header = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [adminName, setAdminName] = useState('');
    const [alerts, setAlerts] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showAlertMenu, setShowAlertMenu] = useState(false);
    
    // Toast Popup State
    const [popupToast, setPopupToast] = useState(null);

    const navigate = useNavigate();
    const menuRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        setAdminName(localStorage.getItem('userName') || 'Admin');
        
        return () => clearInterval(timer);
    }, []);

    // Real-Time Polling for Alerts
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/maintenance/history');
                const dismissedIds = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');
                
                const activeAlerts = res.data
                    .filter(log => log.ai_prediction.status === 'FAILURE_RISK')
                    .filter(log => !dismissedIds.includes(log._id))
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first

                // Check for NEW alerts to trigger the popup
                if (alerts.length > 0 && activeAlerts.length > 0) {
                    const latestAlert = activeAlerts[0];
                    const isNew = !alerts.some(a => a._id === latestAlert._id);
                    if (isNew) {
                        setPopupToast(latestAlert);
                        // Auto-hide popup after 5 seconds
                        setTimeout(() => setPopupToast(null), 5000);
                    }
                }
                
                setAlerts(activeAlerts);
            } catch (err) {
                console.error("Failed to poll alerts");
            }
        };

        fetchAlerts(); // Initial fetch
        const pollInterval = setInterval(fetchAlerts, 5000); // Poll every 5 seconds
        
        return () => clearInterval(pollInterval);
    }, [alerts]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
                setShowAlertMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear(); // Clears auth tokens and dismissed alerts
        navigate('/login');
    };

    const handleDismissAlert = (alertId, e) => {
        e.stopPropagation(); // Prevent closing the menu
        const dismissed = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');
        dismissed.push(alertId);
        localStorage.setItem('dismissedAlerts', JSON.stringify(dismissed));
        
        // Remove from current UI state instantly
        setAlerts(alerts.filter(a => a._id !== alertId));
    };

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-96 focus-within:ring-2 focus-within:ring-blue-500">
                    <Search size={18} className="text-gray-500 mr-2" />
                    <input type="text" placeholder="Search machines, predictions..." className="bg-transparent border-none outline-none w-full text-sm text-gray-700" />
                </div>

                <div className="flex items-center gap-6" ref={menuRef}>
                    <div className="text-sm font-medium text-gray-600">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} | {currentTime.toLocaleTimeString()}
                    </div>
                    
                    {/* Notifications Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => { setShowAlertMenu(!showAlertMenu); setShowProfileMenu(false); }}
                            className="text-gray-500 hover:text-blue-600 transition-colors relative"
                        >
                            <Bell size={20} />
                            {alerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                    {alerts.length > 9 ? '9+' : alerts.length}
                                </span>
                            )}
                        </button>

                        {showAlertMenu && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-md shadow-xl border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
                                    Action Required
                                    <span className="text-xs font-normal text-gray-500">{alerts.length} active</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {alerts.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-gray-500">No active warnings.</div>
                                    ) : (
                                        alerts.map((alert) => (
                                            <div key={alert._id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-3 relative group">
                                                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                                <div className="flex-1 pr-6">
                                                    <p className="text-sm font-medium text-gray-800">{alert.machine_id} Warning</p>
                                                    <p className="text-xs text-gray-500">Tool Wear: {alert.tool_wear}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleDismissAlert(alert._id, e)}
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Dismiss"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Profile */}
                    <div className="relative">
                        <div 
                            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowAlertMenu(false); }}
                            className="flex items-center gap-2 border-l pl-6 border-gray-200 cursor-pointer hover:opacity-80"
                        >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 uppercase font-bold">
                                {adminName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700 capitalize">{adminName}</span>
                        </div>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-xs text-gray-500">Signed in as</p>
                                    <p className="text-sm font-bold text-gray-800 truncate">{localStorage.getItem('userEmail')}</p>
                                </div>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <LogOut size={16} /> Secure Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Real-time Floating Popup Notification */}
            {popupToast && (
                <div className="fixed bottom-6 right-6 bg-white border-l-4 border-red-500 rounded-lg shadow-2xl p-4 w-80 z-50 animate-bounce">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
                            <AlertTriangle size={18} /> New Failure Detected!
                        </div>
                        <button onClick={() => setPopupToast(null)} className="text-gray-400 hover:text-gray-700"><X size={16}/></button>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{popupToast.machine_id} requires immediate attention.</p>
                    <p className="text-xs text-gray-500 mt-1">AI Prediction: RISK > 50%</p>
                </div>
            )}
        </>
    );
};

export default Header;