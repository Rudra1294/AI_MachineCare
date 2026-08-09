import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Power, Wrench } from 'lucide-react';

const TechnicianManager = () => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTech, setNewTech] = useState({ name: '', employee_id: '', specialty: 'General' });

    const API_URL = `${process.env.REACT_APP_API_URL}/api/technicians`;

    const fetchTechnicians = async () => {
        try {
            const response = await axios.get(API_URL);
            setTechnicians(response.data);
        } catch (error) {
            console.error("Error fetching technicians:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post(API_URL, { ...newTech, is_available: true, current_task: null });
            setNewTech({ name: '', employee_id: '', specialty: 'General' });
            fetchTechnicians();
        } catch (error) {
            alert("Error adding technician. Ensure the Employee ID is unique.");
        }
    };

    const handleToggle = async (id, currentStatus, isBusy ) => {
        try {
            const payload = isBusy 
                ? { is_available: true, current_task: null } 
                : { is_available: !currentStatus };
                
            await axios.put(`${API_URL}/${id}`, payload);
            fetchTechnicians();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this technician?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchTechnicians();
        } catch (error) {
            console.error("Error deleting technician:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Technician Management</h1>
                    <p className="text-gray-500 mt-1">Manage workforce availability for the MILP maintenance scheduler.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md flex items-center gap-2 border border-blue-100">
                    <UserPlus size={18} />
                    <span className="font-semibold">
                        {technicians.filter(t => t.is_available).length} Available Now
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Technician Form */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Technician</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={newTech.name}
                                onChange={(e) => setNewTech({...newTech, name: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input 
                                type="text" 
                                required
                                value={newTech.employee_id}
                                onChange={(e) => setNewTech({...newTech, employee_id: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. TECH-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                            <select 
                                value={newTech.specialty}
                                onChange={(e) => setNewTech({...newTech, specialty: e.target.value})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>General</option>
                                <option>Electrical</option>
                                <option>Mechanical</option>
                                <option>Software / PLC</option>
                            </select>
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
                        >
                            Register Technician
                        </button>
                    </form>
                </div>

                {/* Technician Roster Table */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                                <th className="py-3 px-4 font-medium">Technician</th>
                                <th className="py-3 px-4 font-medium">Specialty</th>
                                <th className="py-3 px-4 font-medium">Status</th>
                                <th className="py-3 px-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading roster...</td></tr>
                            ) : technicians.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No technicians found. Add one to begin.</td></tr>
                            ) : (
                                technicians.map((tech) => {
                                    const isBusy = !tech.is_available && tech.current_task;
                                    
                                    return (
                                        <tr key={tech._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-800">{tech.name}</div>
                                                <div className="text-xs text-gray-500">{tech.employee_id}</div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{tech.specialty}</td>
                                            <td className="py-3 px-4">
                                                {/* NEW: Dynamic 3-State Badge */}
                                                {tech.is_available ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                        🟢 Available
                                                    </span>
                                                ) : isBusy ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                        <Wrench size={12} /> Busy ({tech.current_task})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                        ⚪ Off-Shift
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 flex items-center justify-end gap-2">
                                                {/* Action Buttons: Disabled if technician is currently assigned to a task */}
                                                <button 
                                                    onClick={() => handleToggle(tech._id, tech.is_available, isBusy)}
                                                    
                                                    className={`p-1.5 rounded-md transition-colors ${
                                                        isBusy ? 'text-blue-500 hover:bg-blue-50' : 
                                                        tech.is_available ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={isBusy ? "Emergency Reset / Force Clock-Out" : tech.is_available ? "Mark as Off-Shift" : "Mark as Available"}
                                                >
                                                    <Power size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(tech._id)}
                                                    disabled={isBusy}
                                                    className={`p-1.5 rounded-md transition-colors ${
                                                        isBusy ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'
                                                    }`}
                                                    title={isBusy ? "Cannot remove while on a task" : "Remove Technician"}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TechnicianManager;