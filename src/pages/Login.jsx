import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 dark:from-gray-900 dark:to-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 dark:text-gray-100 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Minar Optics POS</h2>
                {error && <div className="bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border dark:border-red-800 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 sm:p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full p-2 sm:p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-3 sm:p-4 rounded hover:bg-blue-700 transition duration-200 font-medium touch-manipulation"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
