import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar as CalIcon } from 'lucide-react';

const PredictionHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    // Helper to decode machine type
    const getTypeLabel = (typeNum) => {
        if (typeNum === 0) return 'L';
        if (typeNum === 1) return 'M';
        if (typeNum === 2) return 'H';
        return 'N/A';
    };

    // Date Filtering State
    const [dateRange, setDateRange] = useState('ALL');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance/history`);
                const sortedLogs = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setHistory(sortedLogs);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Filter Logic
    const filteredHistory = history.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        
        // 1. Search Filter
        const matchesSearch = log.machine_id.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Status Filter
        const matchesStatus = statusFilter === 'ALL' || log.ai_prediction.status === statusFilter;
        
        // 3. Date Filter
        let matchesDate = true;
        if (dateRange === 'LAST_WEEK') {
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= lastWeek;
        } else if (dateRange === 'LAST_MONTH') {
            const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
            matchesDate = logDate >= lastMonth;
        } else if (dateRange === 'CUSTOM') {
            const start = customStartDate ? new Date(customStartDate) : new Date('2000-01-01');
            const end = customEndDate ? new Date(customEndDate) : new Date('2100-01-01');
            end.setHours(23, 59, 59, 999);
            matchesDate = logDate >= start && logDate <= end;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const displayHistory = filteredHistory.slice(0, 15);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Prediction Log History</h1>
                <p className="text-gray-500 mt-1">Complete archive of all AI telemetry evaluations.</p>
            </div>

            {/* Filtering Controls */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 flex-1 min-w-[200px] focus-within:ring-2 focus-within:ring-blue-500">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input type="text" placeholder="Search Machine ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm text-gray-700" />
                    </div>
                    
                    <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                        <Filter size={18} className="text-gray-400 mr-2" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer">
                            <option value="ALL">All Predictions</option>
                            <option value="HEALTHY">Healthy Only</option>
                            <option value="FAILURE_RISK">Failure Risk Only</option>
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                        <CalIcon size={18} className="text-gray-400 mr-2" />
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent border-none outline-none text-sm text-gray-700 cursor-pointer">
                            <option value="ALL">Latest</option>
                            <option value="LAST_WEEK">Last 7 Days</option>
                            <option value="LAST_MONTH">Last 30 Days</option>
                            <option value="CUSTOM">Custom Range...</option>
                        </select>
                    </div>
                </div>

                {dateRange === 'CUSTOM' && (
                    <div className="flex gap-4 items-center pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Select Range:</span>
                        <input 
                            type="date" 
                            value={customStartDate} 
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-400">to</span>
                        <input 
                            type="date" 
                            value={customEndDate} 
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                            <th className="py-3 px-4 font-medium">Timestamp</th>
                            <th className="py-3 px-4 font-medium">Machine ID</th>
                            <th className="py-3 px-4 font-medium">Type</th>
                            <th className="py-3 px-4 font-medium">Temp (Proc/Air)</th>
                            <th className="py-3 px-4 font-medium">Wear / RPM</th>
                            <th className="py-3 px-4 font-medium">AI Status</th>
                            <th className="py-3 px-4 font-medium">Diagnostic Cause</th>
                            <th className="py-3 px-4 font-medium text-right">Maintenance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" className="text-center py-8 text-gray-500">Extracting logs...</td></tr>
                        ) : displayHistory.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-8 text-gray-500">No records found matching filters.</td></tr>
                        ) : (
                            displayHistory.map((log) => (
                                <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="py-3 px-4 font-bold text-gray-900">{log.machine_id}</td>
                                    
                                    {/* NEW: Type */}
                                    <td className="py-3 px-4 text-sm font-medium text-gray-700">{getTypeLabel(log.type)}</td>
                                    
                                    <td className="py-3 px-4 text-sm text-gray-600">{log.process_temperature}K / {log.air_temperature}K</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{log.tool_wear} / {log.rotational_speed}</td>
                                    
                                    {/* AI Prediction */}
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                            log.ai_prediction.status === 'HEALTHY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {log.ai_prediction.status}
                                        </span>
                                    </td>

                                    {/* NEW: Exact Cause */}
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                        {log.ai_prediction.failure_cause || "System Normal"}
                                    </td>

                                    {/* NEW: Maintenance Action (Waiting Room) */}
                                    <td className="py-3 px-4 text-right">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${
                                            log.ai_prediction.maintenance_status === 'Action Required' ? 'bg-orange-100 text-orange-800 border border-orange-300' : 
                                            log.ai_prediction.maintenance_status === 'Pending' ? 'bg-blue-100 text-blue-800' : 
                                            'text-gray-400 bg-gray-50'
                                        }`}>
                                            {log.ai_prediction.maintenance_status || "Normal"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!loading && filteredHistory.length > 15 && (
                    <div className="bg-gray-50 p-3 text-center border-t border-gray-200 text-sm text-gray-500">
                        Showing most recent 15 records of {filteredHistory.length} total matches.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PredictionHistory;