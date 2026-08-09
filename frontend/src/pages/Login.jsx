import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Activity, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Real Database Authentication
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                email,
                password
            });

            // Save JWT token and user info securely
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userEmail', response.data.admin.email);
            localStorage.setItem('userName', response.data.admin.name);
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Database connection failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-4">
                        <Activity size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">MachineCare</h2>
                    <p className="text-sm text-gray-500 mt-1">Enterprise AI & MILP Optimizer</p>
                </div>

                <div className="p-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Secure Administrator Login</h3>
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-gray-400" /></div>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="admin@factory.com" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors mt-2">
                            {loading ? 'Authenticating with DB...' : 'Secure Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;