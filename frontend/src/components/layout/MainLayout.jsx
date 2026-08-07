import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            
            {/* Main Content Area - margin-left offsets the fixed 64-width sidebar (256px) */}
            <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
                <Header />
                
                {/* Scrollable Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* The <Outlet /> renders whatever page is currently active in the router */}
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
};

export default MainLayout;