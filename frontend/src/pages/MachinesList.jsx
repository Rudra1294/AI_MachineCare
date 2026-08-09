import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Search, ShieldCheck, Plus, X, Trash2, AlertCircle, Info } from 'lucide-react';

const MachinesList = () => {
    const [machines, setMachines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    
    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState(null); // For Details Modal
    
    // Form State
    const [newMachine, setNewMachine] = useState({ machine_id: '', type: '1' });
    const [addError, setAddError] = useState('');

    const fetchMachines = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/machines`);
            setMachines(res.data);
        } catch (error) {
            console.error("Error fetching machines:", error);
        }
    };

    useEffect(() => {
        fetchMachines();
    }, []);

    // Add Machine with Validation
    const handleAddMachine = async (e) => {
        e.preventDefault();
        setAddError(''); // Clear previous errors
        
        // Basic frontend format validation
        if (!newMachine.machine_id.trim()) {
            return setAddError("Machine ID cannot be empty.");
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/machines`, newMachine);
            setShowAddModal(false);
            setNewMachine({ machine_id: '', type: '1' });
            fetchMachines(); // Refresh list
        } catch (error) {
            // Display the specific duplicate error from our backend
            setAddError(error.response?.data?.error || "An unexpected error occurred.");
        }
    };

    // Delete Machine with Confirmation
    const handleDelete = async (id, machineId) => {
        const isConfirmed = window.confirm(`WARNING: Are you sure you want to remove ${machineId} from the inventory? This action cannot be undone.`);
        
        if (isConfirmed) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/machines/${id}`);
                fetchMachines(); // Refresh list after deletion
            } catch (error) {
                alert("Failed to delete the machine. Check console for details.");
            }
        }
    };

    const getTypeLabel = (typeNum) => {
        if (typeNum === 0) return 'L (Low Quality)';
        if (typeNum === 1) return 'M (Medium Quality)';
        return 'H (High Quality)';
    };

    const filteredMachines = machines.filter(m => {
        const matchesSearch = m.machine_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || m.type.toString() === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Machine Inventory</h1>
                    <p className="text-gray-500 mt-1">Manage, register, and monitor manufacturing equipment.</p>
                </div>
                <button 
                    onClick={() => { setShowAddModal(true); setAddError(''); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Register Machine
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 w-80 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input type="text" placeholder="Search equipment ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm text-gray-700" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Quality Types</option>
                    <option value="0">Low Quality (L)</option>
                    <option value="1">Medium Quality (M)</option>
                    <option value="2">High Quality (H)</option>
                </select>
            </div>

            {/* Machine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMachines.map((machine) => (
                    <div key={machine._id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                                        <Settings size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{machine.machine_id}</h3>
                                        <span className="text-xs font-medium text-gray-500">Type: {getTypeLabel(machine.type)}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${machine.status === 'OPTIMAL' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {machine.status}
                                </span>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm mt-2">
                            <button 
                                onClick={() => setSelectedMachine(machine)}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                            >
                                <Info size={16} /> Details
                            </button>
                            <button 
                                onClick={() => handleDelete(machine._id, machine.machine_id)}
                                className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                title="Delete Machine"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {filteredMachines.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                        No machines found matching your search.
                    </div>
                )}
            </div>

            {/* 1. Add Machine Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="font-bold text-gray-900">Register New Machine</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddMachine} className="p-6 space-y-4">
                            
                            {/* Display Validation Errors Here */}
                            {addError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md flex items-center gap-2">
                                    <AlertCircle size={16} /> {addError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID / Serial Number</label>
                                <input type="text" required value={newMachine.machine_id} onChange={(e) => setNewMachine({...newMachine, machine_id: e.target.value.toUpperCase()})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. MCH-550" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Variant Type</label>
                                <select value={newMachine.type} onChange={(e) => setNewMachine({...newMachine, type: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="0">Low Quality (L)</option>
                                    <option value="1">Medium Quality (M)</option>
                                    <option value="2">High Quality (H)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md mt-4 transition-colors">
                                Save Machine
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Machine Details Modal */}
            {/* 2. Machine Details Modal */}
            {selectedMachine && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-blue-600" size={20} />
                                <h2 className="font-bold text-gray-900">Equipment Specifications</h2>
                            </div>
                            <button onClick={() => setSelectedMachine(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Basic Info */}
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-sm font-medium text-gray-500">Identifier</span>
                                <span className="font-bold text-gray-900">{selectedMachine.machine_id}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-sm font-medium text-gray-500">Variant Class</span>
                                <span className="text-gray-800 font-medium">{getTypeLabel(selectedMachine.type)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-sm font-medium text-gray-500">Commission Date</span>
                                <span className="text-gray-800">{new Date(selectedMachine.install_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-500">Current AI Status</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${selectedMachine.status === 'OPTIMAL' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {selectedMachine.status}
                                </span>
                            </div>

                            {/* Latest Telemetry Display */}
                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Latest Telemetry</h3>
                                
                                {!selectedMachine.latest_telemetry || !selectedMachine.latest_telemetry.air_temperature ? (
                                    <div className="bg-gray-50 text-gray-500 text-sm p-4 rounded text-center border border-dashed border-gray-300">
                                        No telemetry recorded yet. Run an AI prediction to capture baseline data.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Air Temperature</span>
                                            <span className="font-semibold">{selectedMachine.latest_telemetry.air_temperature} K</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Process Temp</span>
                                            <span className="font-semibold">{selectedMachine.latest_telemetry.process_temperature} K</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Rotational Speed</span>
                                            <span className="font-semibold">{selectedMachine.latest_telemetry.rotational_speed} rpm</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Torque</span>
                                            <span className="font-semibold">{selectedMachine.latest_telemetry.torque} Nm</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Tool Wear</span>
                                            <span className="font-semibold">{selectedMachine.latest_telemetry.tool_wear} min</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 text-right mt-2">
                                            Last Updated: {new Date(selectedMachine.latest_telemetry.last_updated).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <button onClick={() => setSelectedMachine(null)} className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-md transition-colors">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachinesList;