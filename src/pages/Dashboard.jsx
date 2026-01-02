import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Banknote, AlertCircle, TrendingUp, Briefcase, Lock, Sparkles, Activity, Eye, EyeOff } from 'lucide-react';
import { navigationItems } from '../config/navigation';
import { formatDate } from '../utils/dateUtils';

export default function Dashboard() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSales, setShowSales] = useState(false);

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
            color: 'bg-gradient-to-br from-orange-500 to-orange-600',
            permission: null // Always allowed
        }
    ];

    const statCards = [
        {
            title: "Today's Sales",
            value: stats?.todaySales || 0,
            subtitle: `${stats?.todayTransactions || 0} transactions`,
            icon: Banknote,
            gradient: 'from-blue-500 via-blue-600 to-indigo-600',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
            hasToggle: true
        },
        {
            title: 'Collected Today',
            value: stats?.todayCollected || 0,
            subtitle: 'Cash flow',
            icon: TrendingUp,
            gradient: 'from-emerald-500 via-green-600 to-teal-600',
            iconBg: 'bg-green-100 dark:bg-green-900/40',
            iconColor: 'text-green-600 dark:text-green-400'
        },
        {
            title: 'Pending Payments',
            value: stats?.pendingPayments || 0,
            subtitle: `${stats?.pendingPaymentsCount || 0} invoices`,
            icon: AlertCircle,
            gradient: 'from-red-500 via-rose-600 to-pink-600',
            iconBg: 'bg-red-100 dark:bg-red-900/40',
            iconColor: 'text-red-600 dark:text-red-400'
        },
        {
            title: 'Pending Job Cards',
            value: stats?.pendingJobCards || 0,
            subtitle: 'Active orders',
            icon: Briefcase,
            gradient: 'from-purple-500 via-purple-600 to-violet-600',
            iconBg: 'bg-purple-100 dark:bg-purple-900/40',
            iconColor: 'text-purple-600 dark:text-purple-400',
            isCount: true
        }
    ];

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Dashboard
                        </h2>
                        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500 animate-pulse" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {formatDate(new Date())}
                    </p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {/* Statistics Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className={`group relative bg-gradient-to-br ${card.gradient} p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}
                        >
                            {/* Glossy Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300"></div>

                            {/* Header with Icon and Toggle */}
                            <div className="relative z-10 flex items-start justify-between mb-3 sm:mb-4">
                                <div className={`${card.iconBg} w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <card.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${card.iconColor}`} />
                                </div>

                                {/* Eye Toggle for Today's Sales */}
                                {card.hasToggle && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSales(!showSales);
                                        }}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 group/eye"
                                    >
                                        {showSales ? (
                                            <Eye className="w-5 h-5 text-white group-hover/eye:scale-110 transition-transform" />
                                        ) : (
                                            <EyeOff className="w-5 h-5 text-white group-hover/eye:scale-110 transition-transform" />
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 sm:mb-2">
                                    {card.title}
                                </h3>
                                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white transition-all duration-300 ${card.hasToggle && !showSales ? 'blur-sm select-none' : ''}`}>
                                    {card.hasToggle && !showSales
                                        ? '৳ • • • •'
                                        : card.isCount
                                            ? card.value
                                            : `৳${card.value.toFixed(2)}`
                                    }
                                </p>
                                <p className="text-xs text-white/80 mt-1 sm:mt-2">
                                    {card.subtitle}
                                </p>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allQuickActions.map((item) => {
                        const isAllowed = !item.permission || hasPermission(item.permission);

                        // Map flat colors to rich gradients
                        const getGradient = (flatColor) => {
                            if (!flatColor) return 'from-gray-700 to-gray-900';
                            if (flatColor.includes('orange')) return 'from-orange-400 to-red-500 shadow-orange-500/30';
                            if (flatColor.includes('purple')) return 'from-purple-500 to-indigo-600 shadow-purple-500/30';
                            if (flatColor.includes('red')) return 'from-red-500 to-rose-600 shadow-red-500/30';
                            if (flatColor.includes('blue')) return 'from-blue-400 to-blue-600 shadow-blue-500/30';
                            if (flatColor.includes('green-600')) return 'from-green-600 to-emerald-700 shadow-green-500/30'; // Due Collection
                            if (flatColor.includes('teal')) return 'from-teal-400 to-emerald-600 shadow-teal-500/30';
                            if (flatColor.includes('green-500')) return 'from-green-400 to-emerald-600 shadow-green-500/30';
                            if (flatColor.includes('emerald')) return 'from-emerald-400 to-teal-600 shadow-emerald-500/30';
                            if (flatColor.includes('indigo')) return 'from-indigo-400 to-violet-600 shadow-indigo-500/30';
                            if (flatColor.includes('cyan')) return 'from-cyan-400 to-blue-500 shadow-cyan-500/30';
                            if (flatColor.includes('pink')) return 'from-pink-400 to-rose-500 shadow-pink-500/30';
                            if (flatColor.includes('gray') || flatColor.includes('slate')) return 'from-slate-600 to-slate-800 shadow-slate-500/30';
                            // Fallback for custom gradients passed directly
                            return flatColor.replace('bg-gradient-to-br ', '');
                        };

                        const gradientClass = item.gradient || getGradient(item.color);

                        return (
                            <button
                                key={item.id}
                                onClick={() => isAllowed ? (item.path ? navigate(item.path) : item.action?.()) : null}
                                disabled={!isAllowed}
                                className={`
                                    group relative overflow-hidden rounded-2xl p-6 
                                    bg-gradient-to-br ${gradientClass}
                                    shadow-lg hover:shadow-2xl transition-all duration-300 transform 
                                    flex flex-col items-center justify-center gap-4 min-h-[140px] border border-white/10
                                    ${isAllowed ? 'hover:-translate-y-1 hover:scale-[1.02]' : 'cursor-not-allowed opacity-60 grayscale'}
                                `}
                            >
                                {/* Animated Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                                {/* Icon Circle */}
                                <div className={`
                                    relative z-10 p-3 rounded-xl bg-white/10 backdrop-blur-sm 
                                    shadow-inner border border-white/20
                                    group-hover:scale-110 transition-transform duration-300
                                `}>
                                    <item.icon size={28} className="text-white drop-shadow-md" />
                                </div>

                                {/* Title */}
                                <span className="relative z-10 text-sm font-bold text-white tracking-wide text-center drop-shadow-sm">
                                    {item.title}
                                </span>

                                {/* Lock Overlay */}
                                {!isAllowed && (
                                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                                        <Lock size={24} className="text-white/70" />
                                    </div>
                                )}

                                {/* Decorative Background Pattern */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full blur-xl translate-y-8 -translate-x-8"></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
