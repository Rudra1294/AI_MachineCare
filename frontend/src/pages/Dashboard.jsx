import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Users, Settings2 } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalMachines: 0,
        healthPercentage: 100,
        activeWarnings: 0,
        activeTechs: 0
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch real data from both Node.js endpoints simultaneously
                const [historyRes, techRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance/history`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/technicians`)
                ]);

                const logs = historyRes.data;
                const activeTechnicians = techRes.data.filter(t => t.is_available).length;

                // 1. Calculate Real KPIs
                const uniqueMachines = new Set(logs.map(log => log.machine_id)).size;
                const warnings = logs.filter(log => log.ai_prediction.status === 'FAILURE_RISK').length;
                const health = logs.length === 0 ? 100 : (((logs.length - warnings) / logs.length) * 100).toFixed(1);

                setStats({
                    totalMachines: uniqueMachines,
                    healthPercentage: health,
                    activeWarnings: warnings,
                    activeTechs: activeTechnicians
                });

                // 2. Map real tool wear data for the chart (take the 15 most recent logs)
                const mappedChartData = logs.slice(0, 15).reverse().map(log => ({
                    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    wear: log.tool_wear,
                    machine: log.machine_id
                }));
                setChartData(mappedChartData);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const KpiCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-start gap-4">
            <div className={`p-3 rounded-md ${color}`}><Icon size={24} /></div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                <p className="text-xs text-gray-400 mt-1">{subtext}</p>
            </div>
        </div>
    );

    if (loading) return <div className="p-8 text-gray-500">Loading real-time data...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Factory Overview</h1>
                <p className="text-gray-500 mt-1">Real-time predictive maintenance monitoring.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Monitored Machines" value={stats.totalMachines} icon={Settings2} color="bg-blue-100 text-blue-700" subtext="Unique hardware tracked" />
                <KpiCard title="System Health" value={`${stats.healthPercentage}%`} icon={Activity} color="bg-green-100 text-green-700" subtext="Historical safe predictions" />
                <KpiCard title="Total Warnings" value={stats.activeWarnings} icon={AlertTriangle} color="bg-orange-100 text-orange-700" subtext="Lifetime failures detected" />
                <KpiCard title="Available Technicians" value={stats.activeTechs} icon={Users} color="bg-purple-100 text-purple-700" subtext="Currently on shift" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Tool Wear Trends</h2>
                    <p className="text-sm text-gray-500">Live accumulation of wear based on submitted telemetry.</p>
                </div>
                <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorWear" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            <Area type="monotone" dataKey="wear" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWear)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;