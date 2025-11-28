import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Banknote } from 'lucide-react';

export default function BankBook() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        type: '',
        category: ''
    });
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'deposit',
        amount: '',
        bank_name: '',
        account_number: '',
        reference_number: '',
        description: '',
        category: 'General'
    });

    useEffect(() => {
        fetchTransactions();
        fetchSummary();
    }, [filters]);

    const fetchTransactions = async () => {
        try {
            const { data } = await api.get('/bank/transactions', {
                params: filters
            });
            setTransactions(data.transactions);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const { data } = await api.get('/bank/summary', {
                params: { startDate: filters.startDate, endDate: filters.endDate }
            });
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTransaction) {
                await api.put(`/bank/transactions/${editingTransaction.id}`, formData);
            } else {
                await api.post('/bank/transactions', formData);
            }
            setShowForm(false);
            setEditingTransaction(null);
            resetForm();
            fetchTransactions();
            fetchSummary();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Error saving transaction');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await api.delete(`/bank/transactions/${id}`);
            fetchTransactions();
            fetchSummary();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error deleting transaction');
        }
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            transaction_date: transaction.transaction_date.split('T')[0],
            transaction_type: transaction.transaction_type,
            amount: transaction.amount,
            bank_name: transaction.bank_name,
            account_number: transaction.account_number || '',
            reference_number: transaction.reference_number || '',
            description: transaction.description || '',
            category: transaction.category || 'General'
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_type: 'deposit',
            amount: '',
            bank_name: '',
            account_number: '',
            reference_number: '',
            description: '',
            category: 'General'
        });
    };

    return (
        <div className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Bank Book</h2>
                <button
                    onClick={() => { setShowForm(true); setEditingTransaction(null); resetForm(); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto touch-manipulation"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-green-600 font-medium">Total Deposits</p>
                                <p className="text-lg sm:text-2xl font-bold text-green-700">${summary.totalDeposits.toFixed(2)}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-red-600 font-medium">Total Withdrawals</p>
                                <p className="text-lg sm:text-2xl font-bold text-red-700">${summary.totalWithdrawals.toFixed(2)}</p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-blue-600 font-medium">Current Balance</p>
                                <p className="text-lg sm:text-2xl font-bold text-blue-700">৳{(summary.currentBalance || 0).toFixed(2)}</p>
                            </div>
                            <Banknote className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <div className={`p-4 rounded-lg border ${summary.netChange >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-xs sm:text-sm font-medium ${summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net Change</p>
                                <p className={`text-lg sm:text-2xl font-bold ${summary.netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    ${Math.abs(summary.netChange).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2 text-sm"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2 text-sm"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            className="w-full border rounded p-2 text-sm"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">All</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Filter by category"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No transactions found</td>
                                </tr>
                            ) : (
                                transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                                            {new Date(transaction.transaction_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${transaction.transaction_type === 'deposit' ? 'bg-green-100 text-green-800' :
                                                transaction.transaction_type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {transaction.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{transaction.bank_name}</td>
                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{transaction.category}</td>
                                        <td className={`px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium ${transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.transaction_type === 'deposit' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-bold">
                                            ${parseFloat(transaction.balance_after).toFixed(2)}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(transaction)}
                                                    className="text-blue-600 hover:text-blue-800 p-1 touch-manipulation"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(transaction.id)}
                                                    className="text-red-600 hover:text-red-800 p-1 touch-manipulation"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b">
                            <h3 className="text-lg sm:text-xl font-bold">
                                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.transaction_date}
                                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.transaction_type}
                                        onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                                        required
                                    >
                                        <option value="deposit">Deposit</option>
                                        <option value="withdrawal">Withdrawal</option>
                                        <option value="transfer">Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.reference_number}
                                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-sm"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border rounded p-2 text-sm"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 touch-manipulation"
                                >
                                    {editingTransaction ? 'Update' : 'Add'} Transaction
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingTransaction(null); resetForm(); }}
                                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 touch-manipulation"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
