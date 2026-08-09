import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Loader2, X, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

const MaintenanceSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechs, setSelectedTechs] = useState({}); // Stores selected tech for dispatch
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    // Modal State
    const [verificationTask, setVerificationTask] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [formData, setFormData] = useState({
        air_temperature: 300.0,
        process_temperature: 310.0,
        rotational_speed: 1500.0,
        torque: 40.0,
        tool_wear: 0.0
    });

    const fetchScheduleData = async () => {
        try {
            const [histRes, techRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance/history`),
                axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance/technicians/available`)
            ]);
            
            // Filter for ALL active tasks (Action Required, Pending, In Progress)
            const activeTasks = histRes.data
                .filter(log => ['Action Required', 'Pending', 'In Progress'].includes(log.ai_prediction.maintenance_status))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            setSchedule(activeTasks);
            setTechnicians(techRes.data);
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScheduleData();
    }, []);

    // Handle Manual Technician Dispatch
    const handleDispatch = async (task) => {
        const techId = selectedTechs[task.machine_id];
        if (!techId) return alert("Please select a technician first.");

        setUpdatingId(task._id);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/maintenance/dispatch`, {
                machine_id: task.machine_id,
                technician_id: techId // This now safely sends the guaranteed MongoDB _id
            });
            
            // Clear the dropdown selection and refresh the table
            setSelectedTechs(prev => {
                const newState = { ...prev };
                delete newState[task.machine_id];
                return newState;
            });
            fetchScheduleData();
        } catch (error) {
            console.error("Dispatch Error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                // Shows the real system error instead of hardcoded fallback
                alert(`Failed to dispatch: ${error.message}`); 
            }
        } finally {
            setUpdatingId(null);
        }
    };

    // Handle Status Updates (Pending -> In Progress -> Resolved)
    const handleStatusChange = async (task, newStatus) => {
        if (newStatus === 'Resolved') {
            setVerificationTask(task);
            setVerificationResult(null);
            setFormData({
                air_temperature: task.air_temperature,
                process_temperature: task.process_temperature,
                rotational_speed: task.rotational_speed,
                torque: task.torque,
                tool_wear: 0.0 
            });
            return;
        }

        setUpdatingId(task._id);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/maintenance/${task._id}`, { status: newStatus });
            setSchedule(prev => prev.map(t => 
                t._id === task._id ? { ...t, ai_prediction: { ...t.ai_prediction, maintenance_status: newStatus } } : t
            ));
        } catch (error) {
            alert("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const runAIVerification = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        try {
            const payload = {
                machines: [{
                    machine_id: verificationTask.machine_id,
                    type: verificationTask.type,
                    ...formData
                }]
            };
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/maintenance/process`, payload);
            const prediction = response.data.predictions[0];
            setVerificationResult(prediction.status);
        } catch (error) {
            console.error(error);
            alert("Verification failed. Check API connection.");
        } finally {
            setIsVerifying(false);
        }
    };

    const finalizeResolution = async () => {
        setIsVerifying(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/maintenance/${verificationTask._id}`, { status: 'Resolved' });
            // Free up the technician in the database
            await axios.put(`${process.env.REACT_APP_API_URL}/api/technicians/free/${verificationTask.machine_id}`).catch(() => {});
            
            closeModal();
            fetchScheduleData();
        } catch (error) {
            alert("Failed to close task.");
        } finally {
            setIsVerifying(false);
        }
    };

    const closeModal = () => {
        setVerificationTask(null);
        setVerificationResult(null);
    };

    const getStatusStyle = (status) => {
        if (status === 'Action Required') return "bg-orange-100 text-orange-800 border-orange-300";
        if (status === 'In Progress') return "bg-blue-50 text-blue-700 border-blue-200";
        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">MILP Dispatch Schedule</h1>
                <p className="text-gray-500 mt-1">Manage live technician dispatch states and verify post-maintenance health.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                            <th className="py-3 px-4 font-medium">Machine ID</th>
                            <th className="py-3 px-4 font-medium">Logged At</th>
                            <th className="py-3 px-4 font-medium">Diagnostic Cause</th>
                            <th className="py-3 px-4 font-medium text-right">Task Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading schedule...</td></tr>
                        ) : schedule.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-12 text-gray-500 flex flex-col items-center justify-center">
                                    <CheckCircle2 size={48} className="text-green-500 mb-4 opacity-50" />
                                    <p className="text-lg font-bold">Queue is clear.</p>
                                    <p className="text-sm">No pending maintenance scheduled.</p>
                                </td>
                            </tr>
                        ) : (
                            schedule.map((task) => {
                                const currentStatus = task.ai_prediction.maintenance_status || 'Pending';
                                const isActionRequired = currentStatus === 'Action Required';

                                return (
                                    <tr key={task._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <Wrench size={16} className={isActionRequired ? "text-orange-500" : "text-blue-500"} /> 
                                                {task.machine_id}
                                            </div>
                                            {/* NEW: Displays the technician name badge once dispatched */}
                                            {!isActionRequired && task.ai_prediction?.assigned_technician_name && (
                                                <div className="text-xs text-blue-700 mt-1.5 font-bold bg-blue-50 border border-blue-200 inline-block px-2 py-0.5 rounded">
                                                    Assigned: {task.ai_prediction.assigned_technician_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {new Date(task.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-gray-700">
                                            {task.ai_prediction.failure_cause || `Risk Detected (Wear: ${task.tool_wear})`}
                                        </td>
                                        <td className="py-3 px-4 flex justify-end">
                                            {updatingId === task._id ? (
                                                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium h-9">
                                                    <Loader2 size={16} className="animate-spin" /> Updating...
                                                </div>
                                            ) : isActionRequired ? (
                                                // VIEW 1: Dispatch Controls for New Failures
                                                <div className="flex gap-2">
                                                    <select 
                                                        className="border border-gray-300 text-sm rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                                                        value={selectedTechs[task.machine_id] || ""}
                                                        onChange={(e) => setSelectedTechs(prev => ({ ...prev, [task.machine_id]: e.target.value }))}
                                                    >
                                                        <option value="">Assign Tech...</option>
                                                        {technicians.map(tech => (
                                                            <option key={tech._id} value={tech._id}>
                                                                {tech.name || tech.employee_id || tech.technician_id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        onClick={() => handleDispatch(task)}
                                                        disabled={!selectedTechs[task.machine_id]}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                                                    >
                                                        Dispatch
                                                    </button>
                                                </div>
                                            ) : (
                                                // VIEW 2: Status Controls for Dispatched Tasks
                                                <select 
                                                    value={currentStatus}
                                                    onChange={(e) => handleStatusChange(task, e.target.value)}
                                                    className={`border outline-none text-sm font-medium rounded-md px-3 py-1.5 cursor-pointer transition-colors min-w-[150px] ${getStatusStyle(currentStatus)}`}
                                                >
                                                    <option value="Pending">🕒 Pending</option>
                                                    <option value="In Progress">⚙️ In Progress</option>
                                                    <option value="Resolved">✅ Mark Resolved</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Post-Maintenance Verification Modal */}
            {verificationTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden transition-all">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Cpu className="text-blue-600" size={24} />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Post-Maintenance AI Audit</h2>
                                    <p className="text-xs text-gray-500">{verificationTask.machine_id} requires clearance.</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {!verificationResult ? (
                            <form onSubmit={runAIVerification} className="p-6 space-y-4">
                                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-3 rounded mb-4">
                                    Please input the new sensor readings to verify machine health and clear the queue.
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Air Temp [K]</label>
                                        <input type="number" step="0.1" name="air_temperature" value={formData.air_temperature} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Process Temp [K]</label>
                                        <input type="number" step="0.1" name="process_temperature" value={formData.process_temperature} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Rotational Speed [rpm]</label>
                                        <input type="number" step="0.1" name="rotational_speed" value={formData.rotational_speed} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Torque [Nm]</label>
                                        <input type="number" step="0.1" name="torque" value={formData.torque} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tool Wear [min] (Post-Maintenance)</label>
                                    <input type="number" step="0.1" name="tool_wear" value={formData.tool_wear} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-green-50" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={closeModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-md transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isVerifying} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors flex justify-center items-center gap-2">
                                        {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <Cpu size={18} />}
                                        {isVerifying ? 'Analyzing...' : 'Run Diagnostics'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-6">
                                {verificationResult === 'HEALTHY' ? (
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-green-700 mb-2">System Cleared</h3>
                                        <p className="text-gray-600 mb-6">The AI model confirms the new parameters are within optimal operating bounds.</p>
                                        <button onClick={finalizeResolution} disabled={isVerifying} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors flex justify-center items-center gap-2">
                                            {isVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Finalize & Close Ticket'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-red-700 mb-2">Failure Risk Remains</h3>
                                        <p className="text-gray-600 mb-6">The AI model detects that the system is still at risk of failure. Maintenance was likely insufficient.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setVerificationResult(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-md transition-colors">
                                                Re-Enter Data
                                            </button>
                                            <button onClick={closeModal} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-md transition-colors">
                                                Keep Ticket Open
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceSchedule;