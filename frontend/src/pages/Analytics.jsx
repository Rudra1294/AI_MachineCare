import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertOctagon, UserCheck } from 'lucide-react';

const Analytics = () => {
    const [failureData, setFailureData] = useState([]);
    const [techData, setTechData] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6'];

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [histRes, techRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/maintenance/history'),
                    axios.get('http://localhost:5000/api/technicians')
                ]);

                // 1. Group real failures by machine type (0: L, 1: M, 2: H)
                const typeMap = { 0: 'Type L', 1: 'Type M', 2: 'Type H' };
                const failureCounts = { 0: 0, 1: 0, 2: 0 };
                
                histRes.data.forEach(log => {
                    if (log.ai_prediction.status === 'FAILURE_RISK') {
                        failureCounts[log.type] = (failureCounts[log.type] || 0) + 1;
                    }
                });

                const formattedFailures = Object.keys(failureCounts).map(key => ({
                    type: typeMap[key] || `Type ${key}`,
                    failures: failureCounts[key]
                }));
                setFailureData(formattedFailures);

                // 2. Group real technicians by specialty
                const specCounts = {};
                techRes.data.forEach(tech => {
                    specCounts[tech.specialty] = (specCounts[tech.specialty] || 0) + 1;
                });
                
                const formattedTechs = Object.keys(specCounts).map(key => ({
                    name: key,
                    value: specCounts[key]
                }));
                setTechData(formattedTechs.length ? formattedTechs : [{ name: 'No Techs', value: 1 }]);

            } catch (error) {
                console.error("Error loading analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 text-gray-500">Compiling Analytics...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Business Intelligence Analytics</h1>
                <p className="text-gray-500 mt-1">Real database insights and structural performance metrics.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Failures by Machine Type */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Failure Frequency by Variant</h2>
                            <p className="text-sm text-gray-500">Distribution across L, M, and H types</p>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-md">
                            <AlertOctagon size={20} />
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={failureData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="type" type="category" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="failures" name="Total Recorded Failures" fill="#f97316" radius={[0, 4, 4, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Technician Specialty Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Workforce Specialties</h2>
                            <p className="text-sm text-gray-500">Database distribution of technicians</p>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                            <UserCheck size={20} />
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={techData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                                    {techData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;