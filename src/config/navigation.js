import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Receipt,
    BarChart2,
    ClipboardList,
    Settings,
    Users,
    Banknote,
    TrendingUp,
    Briefcase
} from 'lucide-react';

// Centralized navigation configuration
// This ensures sidebar and dashboard quick actions stay in sync
export const navigationItems = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        permission: 'DASHBOARD',
        color: 'bg-blue-500',
        showInQuickActions: false // Dashboard shouldn't link to itself
    },
    {
        id: 'pos',
        title: 'POS',
        path: '/pos',
        icon: ShoppingCart,
        permission: 'POS',
        color: 'bg-orange-500',
        showInQuickActions: true
    },
    {
        id: 'inventory',
        title: 'Inventory',
        path: '/inventory',
        icon: Package,
        permission: 'INVENTORY',
        color: 'bg-purple-500',
        showInQuickActions: true
    },
    {
        id: 'expenses',
        title: 'Expenses',
        path: '/expenses',
        icon: Receipt,
        permission: 'EXPENSES',
        color: 'bg-red-500',
        showInQuickActions: true
    },
    {
        id: 'sales-invoices',
        title: 'Daily Sales',
        path: '/sales-invoices',
        icon: ClipboardList,
        permission: 'POS',
        color: 'bg-blue-500',
        showInQuickActions: true
    },
    {
        id: 'customers',
        title: 'Customers',
        path: '/customers',
        icon: Users,
        permission: 'POS',
        color: 'bg-teal-500',
        showInQuickActions: true
    },
    {
        id: 'bank-book',
        title: 'Bank Book',
        path: '/bank-book',
        icon: Banknote,
        permission: 'REPORTS',
        color: 'bg-green-500',
        showInQuickActions: true
    },
    {
        id: 'cash-book',
        title: 'Cash Book',
        path: '/cash-book',
        icon: Banknote,
        permission: 'REPORTS',
        color: 'bg-emerald-500',
        showInQuickActions: true
    },
    {
        id: 'profit-loss',
        title: 'Profit & Loss',
        path: '/profit-loss',
        icon: TrendingUp,
        permission: 'REPORTS',
        color: 'bg-indigo-500',
        showInQuickActions: true
    },
    {
        id: 'reports',
        title: 'Reports',
        path: '/reports',
        icon: BarChart2,
        permission: 'REPORTS',
        color: 'bg-cyan-500',
        showInQuickActions: true
    },
    {
        id: 'job-cards',
        title: 'Job Cards',
        path: '/job-cards',
        icon: Briefcase,
        permission: 'JOBCARDS',
        color: 'bg-amber-500',
        showInQuickActions: true
    },
    {
        id: 'invoice-settings',
        title: 'Invoice Settings',
        path: '/invoice-settings',
        icon: Settings,
        permission: 'SETTINGS',
        color: 'bg-gray-500',
        showInQuickActions: true
    },
    {
        id: 'users',
        title: 'Users',
        path: '/users',
        icon: Users,
        permission: 'USERS',
        color: 'bg-pink-500',
        showInQuickActions: true
    }
];
