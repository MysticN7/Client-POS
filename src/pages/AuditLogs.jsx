import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, RefreshCw, Clock, User, Activity, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        userId: '',
        startDate: '',
        endDate: ''
    });
    const [users, setUsers] = useState([]);

    // Check if current user is ADMINISTRATIVE (can delete logs)
    const { user: currentUser } = useAuth();
    const isAdministrative = currentUser?.role === 'ADMINISTRATIVE';

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, [page, filters]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: 20,
                ...filters
            });
            const res = await api.get(`/audit-logs?${queryParams}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            userId: '',
            startDate: '',
            endDate: ''
        });
        setPage(1);
    };

    const deleteLog = async (id) => {
        if (!window.confirm('Delete this audit log?')) return;
        try {
            await api.delete(`/audit-logs/${id}`);
            fetchLogs();
        } catch (error) {
            alert('Error deleting log: ' + (error.response?.data?.message || error.message));
        }
    };

    const deleteAllLogs = async () => {
        if (!window.confirm('DELETE ALL AUDIT LOGS? This cannot be undone!')) return;
        if (!window.confirm('Are you ABSOLUTELY SURE?')) return;
        try {
            await api.delete('/audit-logs');
            fetchLogs();
        } catch (error) {
            alert('Error deleting logs: ' + (error.response?.data?.message || error.message));
        }
    };

    // State for delete my logs modal
    const [showDeleteMyLogsModal, setShowDeleteMyLogsModal] = useState(false);
    const [deleteMyLogsDateRange, setDeleteMyLogsDateRange] = useState({ startDate: '', endDate: '' });

    const deleteMyLogs = async () => {
        const { startDate, endDate } = deleteMyLogsDateRange;
        const dateInfo = startDate || endDate ? ` from ${startDate || 'beginning'} to ${endDate || 'now'}` : '';
        if (!window.confirm(`Delete all YOUR audit logs${dateInfo}? This cannot be undone!`)) return;

        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const res = await api.delete(`/audit-logs/my-logs?${queryParams}`);
            alert(res.data.message);
            setShowDeleteMyLogsModal(false);
            setDeleteMyLogsDateRange({ startDate: '', endDate: '' });
            fetchLogs();
        } catch (error) {
            alert('Error deleting logs: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen dark:text-gray-100">
            {/* Delete My Logs Modal */}
            {showDeleteMyLogsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Delete My Audit Logs</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            This will permanently delete your audit logs. Optionally filter by date range.
                        </p>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
                                    value={deleteMyLogsDateRange.startDate}
                                    onChange={(e) => setDeleteMyLogsDateRange({ ...deleteMyLogsDateRange, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
                                    value={deleteMyLogsDateRange.endDate}
                                    onChange={(e) => setDeleteMyLogsDateRange({ ...deleteMyLogsDateRange, endDate: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Leave both empty to delete ALL your logs.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDeleteMyLogsModal(false); setDeleteMyLogsDateRange({ startDate: '', endDate: '' }); }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteMyLogs}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold"
                            >
                                Delete My Logs
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Activity className="text-blue-600" /> Audit Logs
                </h1>
                <div className="flex items-center gap-2">
                    {isAdministrative && (
                        <>
                            <button
                                onClick={() => setShowDeleteMyLogsModal(true)}
                                className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition text-orange-600 dark:text-orange-400 text-sm font-medium flex items-center gap-1"
                                title="Delete My Logs (with optional date filter)"
                            >
                                <Trash2 size={16} /> Delete My Logs
                            </button>
                            <button
                                onClick={deleteAllLogs}
                                className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-red-600 dark:text-red-400"
                                title="Delete All Logs (ADMINISTRATIVE only)"
                            >
                                <Trash2 size={20} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={fetchLogs}
                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <RefreshCw size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
                        <input
                            type="text"
                            name="action"
                            placeholder="e.g. LOGIN, CREATE_SALE"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            value={filters.action}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
                        <select
                            name="userId"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            value={filters.userId}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Users</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Timestamp</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Details</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">IP Address</th>
                                {isAdministrative && <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-300">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-300">No logs found</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('DELETE') || log.action.includes('CANCEL') ? 'bg-red-100 text-red-700' :
                                                log.action.includes('UPDATE') ? 'bg-orange-100 text-orange-700' :
                                                    log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-100 font-medium">
                                            {log.performedBy?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {log.ipAddress || 'N/A'}
                                        </td>
                                        {isAdministrative && (
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => deleteLog(log._id)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Delete this log"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
