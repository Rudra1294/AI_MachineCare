import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Settings, 
    Activity, 
    Calendar, 
    History, 
    BarChart3, 
    Users 
} from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Machines', path: '/machines', icon: <Settings size={20} /> },
        { name: 'Live Prediction', path: '/predict', icon: <Activity size={20} /> },
        { name: 'Schedule', path: '/schedule', icon: <Calendar size={20} /> },
        { name: 'History', path: '/history', icon: <History size={20} /> },
        { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
        { name: 'Technicians', path: '/technicians', icon: <Users size={20} /> },
    ];

    return (
        <div className="w-64 h-screen bg-gray-900 text-gray-300 flex flex-col fixed left-0 top-0">
            <div className="p-6 flex items-center gap-3 border-b border-gray-800">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                    AI
                </div>
                <span className="text-white text-lg font-semibold tracking-wide">MachineCare</span>
            </div>
            
            <nav className="flex-1 py-4">
                <ul className="space-y-1">
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-6 py-3 transition-colors ${
                                        isActive 
                                        ? 'bg-gray-800 text-blue-400 border-r-4 border-blue-500' 
                                        : 'hover:bg-gray-800 hover:text-white'
                                    }`
                                }
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-800 text-sm text-gray-500 text-center">
                v1.0.0 Enterprise Edition
            </div>
        </div>
    );
};

export default Sidebar;