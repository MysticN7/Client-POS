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
            {/* Statistics Cards - Layout Fixed: 2 Cards fill row */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg animate-pulse h-48">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className={`group relative bg-gradient-to-br ${card.gradient} p-6 sm:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden min-h-[180px] flex flex-col justify-between transform hover:-translate-y-1`}
                        >
                            {/* Glossy Overlay - Enriched */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                            {/* Header with Icon and Toggle */}
                            <div className="relative z-10 flex items-start justify-between mb-4">
                                <div className={`${card.iconBg} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-300 shadow-inner backdrop-blur-md bg-opacity-90`}>
                                    <card.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${card.iconColor}`} />
                                </div>

                                {/* Eye Toggle for Today's Sales - Improved Touch Target */}
                                {card.hasToggle && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSales(!showSales);
                                        }}
                                        className="p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all duration-200 group/eye active:scale-95"
                                        title={showSales ? "Hide Amount" : "Show Amount"}
                                    >
                                        {showSales ? (
                                            <Eye className="w-5 h-5 text-white shadow-sm" />
                                        ) : (
                                            <EyeOff className="w-5 h-5 text-white shadow-sm" />
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Content - Larger & Bolder */}
                            <div className="relative z-10">
                                <p className="text-sm sm:text-base font-medium text-white/90 mb-1 tracking-wide uppercase opacity-90">
                                    {card.title}
                                </p>
                                <p className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight transition-all duration-300 ${card.hasToggle && !showSales ? 'blur-md select-none opacity-80' : 'drop-shadow-md'}`}>
                                    {card.hasToggle && !showSales
                                        ? '৳ • • • •'
                                        : card.isCount
                                            ? card.value
                                            : `৳${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` // QoL: Better formatting
                                    }
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="h-1 w-8 bg-white/40 rounded-full group-hover:w-16 transition-all duration-500"></div>
                                    <p className="text-xs sm:text-sm text-white/90 font-medium">
                                        {card.subtitle}
                                    </p>
                                </div>
                            </div>
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
