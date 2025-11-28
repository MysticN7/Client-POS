import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Banknote, AlertCircle, TrendingUp, Briefcase, Lock } from 'lucide-react';
import { navigationItems } from '../config/navigation';

export default function Dashboard() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/dashboard-stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter navigation items to show only in quick actions
    const quickActionItems = navigationItems.filter(item => item.showInQuickActions);

    // Add refresh action
    const allQuickActions = [
        ...quickActionItems,
        {
            id: 'refresh',
            title: 'Refresh',
            icon: RefreshCw,
            action: () => fetchDashboardData(),
            color: 'bg-orange-400',
            permission: null // Always allowed
        }
    ];

    return (
        <div className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-xs sm:text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Statistics Cards */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading statistics...</div>
            ) : stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Today's Sales</h3>
                            <Banknote className="w-8 h-8 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">৳{(stats.todaySales || 0).toFixed(2)}</p>
                        <p className="text-xs opacity-75 mt-1">{stats.todayTransactions || 0} transactions</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Collected Today</h3>
                            <TrendingUp className="w-8 h-8 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">৳{(stats.todayCollected || 0).toFixed(2)}</p>
                        <p className="text-xs opacity-75 mt-1">Cash flow</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Pending Payments</h3>
                            <AlertCircle className="w-8 h-8 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">৳{(stats.pendingPayments || 0).toFixed(2)}</p>
                        <p className="text-xs opacity-75 mt-1">{stats.pendingPaymentsCount || 0} invoices</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Pending Job Cards</h3>
                            <Briefcase className="w-8 h-8 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{stats.pendingJobCards || 0}</p>
                        <p className="text-xs opacity-75 mt-1">Active orders</p>
                    </div>
                </div>
            )}

            {/* Quick Actions Grid */}
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allQuickActions.map((item) => {
                    const isAllowed = !item.permission || hasPermission(item.permission);

                    return (
                        <button
                            key={item.id}
                            onClick={() => isAllowed ? (item.path ? navigate(item.path) : item.action?.()) : null}
                            disabled={!isAllowed}
                            className={`${item.color} relative overflow-hidden text-white p-6 rounded-2xl shadow-lg ring-1 ring-white/20 transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[120px] active:scale-[.98] touch-manipulation ${isAllowed ? 'hover:opacity-95' : 'cursor-not-allowed'}`}
                        >
                            <item.icon size={32} className={!isAllowed ? 'opacity-50' : ''} />
                            <span className={`text-lg font-semibold ${!isAllowed ? 'opacity-50' : ''}`}>{item.title}</span>

                            {!isAllowed && (
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                        <Lock size={24} className="text-white" />
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
