import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, CheckCircle2, Cpu } from 'lucide-react';

const LivePrediction = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [inventory, setInventory] = useState([]); 
    const [selectedTech, setSelectedTech] = useState(""); 
    const [dispatchSuccess, setDispatchSuccess] = useState(false); 
    
    const [formData, setFormData] = useState({
        type: '1', 
        machine_id: '',
        air_temperature: 300.0,
        process_temperature: 310.0,
        rotational_speed: 1500.0,
        torque: 40.0,
        tool_wear: 10.0
    });

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/machines');
                setInventory(res.data);
                
                const initialFiltered = res.data.filter(m => m.type.toString() === '1');
                if (initialFiltered.length > 0) {
                    setFormData(prev => ({ ...prev, machine_id: initialFiltered[0].machine_id }));
                }
            } catch (error) {
                console.error("Error fetching machines:", error);
            }
        };
        fetchMachines();
    }, []);

    const availableMachines = inventory.filter(m => m.type.toString() === formData.type);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'type') {
            const newFiltered = inventory.filter(m => m.type.toString() === value);
            setFormData({ 
                ...formData, 
                type: value, 
                machine_id: newFiltered.length > 0 ? newFiltered[0].machine_id : '' 
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const runPrediction = async (e) => {
        e.preventDefault();
        if (!formData.machine_id) return alert("Please register a machine of this type in the Inventory first.");
        
        setLoading(true);
        setResult(null);
        
        try {
            const payload = {
                machines: [{
                    ...formData,
                    type: parseInt(formData.type),
                    air_temperature: parseFloat(formData.air_temperature),
                    process_temperature: parseFloat(formData.process_temperature),
                    rotational_speed: parseFloat(formData.rotational_speed),
                    torque: parseFloat(formData.torque),
                    tool_wear: parseFloat(formData.tool_wear)
                }]
            };

            const response = await axios.post('http://localhost:5000/api/maintenance/process', payload);
            const predictionData = response.data.predictions[0];

            setResult({
                status: predictionData.status,
                predictions: response.data.predictions, 
                available_technicians: response.data.available_technicians,
                // NEW: Capture Metadata
                compute_engine: response.data.compute_engine,
                prediction_model: response.data.prediction_model
            });
            setDispatchSuccess(false);

        } catch (error) {
            console.error("Prediction Error:", error);
            alert("Failed to reach the AI Engine.");
        } finally {
            setLoading(false);
        }
    };

    // Helper component for the metadata badges
    const EngineBadges = () => {
        if (!result.compute_engine && !result.prediction_model) return null;
        
        const isQuantum = result.compute_engine?.includes("QAOA") || result.prediction_model?.includes("QSVM");
        
        return (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {result.prediction_model && (
                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded border border-purple-200">
                        {isQuantum ? '⚛️' : '⚙️'} Predictor: {result.prediction_model}
                    </span>
                )}
                {result.compute_engine && (
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded border border-indigo-200">
                        {isQuantum ? '⚛️' : '⚙️'} Optimizer: {result.compute_engine}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Live Telemetry Prediction</h1>
                <p className="text-gray-500 mt-1">Select a registered machine to evaluate its current sensor readings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Cpu className="text-blue-600" size={24} />
                        <h2 className="text-lg font-semibold text-gray-800">Sensor Parameters</h2>
                    </div>

                    <form onSubmit={runPrediction} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">1. Select Quality Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="0">Low (L)</option>
                                    <option value="1">Medium (M)</option>
                                    <option value="2">High (H)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">2. Select Target Machine</label>
                                <select name="machine_id" value={formData.machine_id} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    {availableMachines.length === 0 ? (
                                        <option value="">No machines of this type registered</option>
                                    ) : (
                                        availableMachines.map(m => (
                                            <option key={m._id} value={m.machine_id}>{m.machine_id}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Air Temp [K]</label>
                                <input type="number" step="0.1" name="air_temperature" value={formData.air_temperature} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Process Temp [K]</label>
                                <input type="number" step="0.1" name="process_temperature" value={formData.process_temperature} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rotational Speed [rpm]</label>
                                <input type="number" step="0.1" name="rotational_speed" value={formData.rotational_speed} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Torque [Nm]</label>
                                <input type="number" step="0.1" name="torque" value={formData.torque} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tool Wear [min]</label>
                            <input type="number" step="0.1" name="tool_wear" value={formData.tool_wear} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <button type="submit" disabled={loading || !formData.machine_id} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400">
                            {loading ? <Activity className="animate-spin" size={18} /> : <Activity size={18} />}
                            {loading ? 'Analyzing...' : 'Execute AI Prediction'}
                        </button>
                    </form>
                </div>

                {/* Results Panel */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-center">
                    {!result ? (
                        <div className="text-gray-400 flex flex-col items-center">
                            <Activity size={48} className="mb-4 opacity-50" />
                            <p>Awaiting telemetry data...</p>
                        </div>
                    ) : result.status === 'HEALTHY' ? (
                        // NEW: Healthy State UI
                        <div className="bg-white border-2 border-green-500 rounded-xl p-6 shadow-sm w-full text-left">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-700">System Healthy</h3>
                                    <p className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded inline-block mt-1">
                                        All parameters optimal
                                    </p>
                                </div>
                            </div>
                            <EngineBadges />
                        </div>
                    ) : (
                        // Existing Failure State UI
                        <div className="bg-white border-2 border-red-500 rounded-xl p-6 shadow-sm w-full text-left">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-red-700">Failure Risk Detected</h3>
                                    <p className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded inline-block mt-1">
                                        Diagnostic: {result.predictions?.[0]?.failure_cause || "System Anomaly"}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-4">
                                <h4 className="font-bold text-gray-800 mb-2">Admin Action Required</h4>
                                <p className="text-sm text-gray-600 mb-3">Scheduler recommends immediate inspection. Select an available technician to dispatch.</p>
                                
                                {result.available_technicians && result.available_technicians.length > 0 ? (
                                    <div className="flex gap-2">
                                        <select 
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedTech}
                                            onChange={(e) => setSelectedTech(e.target.value)}
                                        >
                                            <option value="">-- Select Technician --</option>
                                            {result.available_technicians.map(tech => (
                                                <option key={tech._id || tech.technician_id} value={tech._id || tech.technician_id}>
                                                    {tech.name || tech.technician_id} ({tech.specialty})
                                                </option>
                                            ))}
                                        </select>
                                        
                                        <button 
                                            disabled={!selectedTech || dispatchSuccess}
                                            onClick={async () => {
                                                try {
                                                    await axios.post('http://localhost:5000/api/maintenance/dispatch', {
                                                        machine_id: formData.machine_id,
                                                        technician_id: selectedTech
                                                    });
                                                    setDispatchSuccess(true);
                                                } catch (error) {
                                                    alert("Failed to dispatch.");
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${dispatchSuccess ? 'bg-green-500' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                                        >
                                            {dispatchSuccess ? 'Dispatched ✓' : 'Dispatch'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 p-2 rounded">
                                        Warning: No technicians are currently available on shift.
                                    </div>
                                )}
                            </div>
                            <EngineBadges />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivePrediction;