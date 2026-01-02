
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, DollarSign, FileText, User, Calendar, CreditCard, Clock, Trash2, Edit } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function DueCollection() {
    const { hasPermission } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('collect'); // 'collect' | 'history'
    const [history, setHistory] = useState([]);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                // Fetch invoices that match search and have due amount
                fetchDueInvoices();
            } else {
                setInvoices([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/sales/payments/history');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDueInvoices = async () => {
        setLoading(true);
        try {
            // We'll reuse the sales/date-range endpoint but we might need a specific 'due-only' filter
            // For now, let's search generally and filter on client side or assume search brings relevant ones
            // A better approach is to have a specific endpoint or param. 
            // Let's use the existing search and filter for due > 0
            const res = await api.get(`/sales/date-range?search=${searchTerm}`);
            // Filter only those with due amount
            const dueInvoices = res.data.sales.filter(inv => inv.due_amount > 0);
            setInvoices(dueInvoices);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentAmount(''); // Reset amount when selecting new
        setNote('');
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedInvoice || !paymentAmount) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (amount > selectedInvoice.due_amount) {
            alert(`Amount cannot exceed due amount (৳${selectedInvoice.due_amount})`);
            return;
        }

        setProcessing(true);
        try {
            await api.post(`/sales/${selectedInvoice.id}/payment`, {
                amount,
                payment_method: paymentMethod,
                note
            });
            alert('Payment collected successfully!');
            setSelectedInvoice(null);
            setPaymentAmount('');
            setNote('');
            fetchDueInvoices(); // Refresh list
            if (activeTab === 'history') fetchHistory(); // Refresh history if current tab 
            // Logic update: Ensure history is fresh even if we switch tabs later. 
            // Actually, since useEffect handles tab switch, we only need this if we are somehow viewing history or it's needed immediately.
            // But let's just add it to be safe or rely on tab switch.
            // Better yet: invalidating the list so next tab switch fetches? 
            // The useEffect runs on every 'history' activation.
        } catch (err) {
            console.error(err);
            alert('Failed to collect payment: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleLegacySubmit = async (e) => {
        e.preventDefault();
        const invoiceNum = e.target.invoice_number.value;
        const customerName = e.target.customer_name.value;
        const amount = e.target.amount.value;

        if (!invoiceNum || !amount) {
            alert('Invoice Number and Amount are required');
            return;
        }

        setProcessing(true);
        try {
            const res = await api.post('/sales/legacy', {
                invoice_number: invoiceNum,
                customer_name: customerName,
                total_due: parseFloat(amount),
                note: 'Manual Entry from Due Collection'
            });
            alert('Legacy invoice created! You can now collect payment.');

            // The controller returns { message, invoice: payload }
            setSelectedInvoice(res.data.invoice);
            setSearchTerm(invoiceNum); // search for it to show in list
            fetchDueInvoices(); // refresh list
        } catch (err) {
            console.error(err);
            alert('Failed to create legacy invoice: ' + (err.response?.data?.message || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleDeletePayment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment? This will increase the due amount.')) return;

        try {
            await api.delete(`/sales/payments/${id}`);
            alert('Payment deleted successfully');
            fetchHistory();
        } catch (err) {
            console.error(err);
            alert('Failed to delete payment');
        }
    };

    const openEditModal = (payment) => {
        setEditingPayment(payment);
        setEditAmount(payment.amount);
        setEditNote(payment.note || '');
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingPayment) return;

        try {
            await api.put(`/sales/payments/${editingPayment._id || editingPayment.id}`, {
                amount: parseFloat(editAmount),
                note: editNote
            });
            alert('Payment updated successfully');
            setShowEditModal(false);
            setEditingPayment(null);
            fetchHistory();
        } catch (err) {
            console.error(err);
            alert('Failed to update payment: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-900 min-h-screen dark:text-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span className="text-4xl font-extrabold text-green-600">৳</span>
                    Due Collection
                </h1>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('collect')}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'collect'
                            ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Collect Due
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'history'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        <Clock size={16} />
                        Recent Collects
                    </button>
                </div>
            </div>

            {activeTab === 'collect' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Search & List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="text-gray-400 group-focus-within:text-green-500 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Invoice #, Customer Name, or Phone..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder-gray-400 group-hover:shadow-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                    <p>Searching invoices...</p>
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full">
                                        <FileText size={32} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-medium">No due invoices found</p>
                                        <p className="text-sm text-gray-400 mt-1">{searchTerm ? 'Try a different search term' : 'Search to start collecting'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {invoices.map(inv => (
                                        <div
                                            key={inv.id}
                                            className={`relative p-5 rounded-xl border transition-all cursor-pointer group ${selectedInvoice?.id === inv.id
                                                    ? 'bg-green-50/80 dark:bg-green-900/20 border-green-500 ring-1 ring-green-500 shadow-md transform scale-[1.01]'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700/50 hover:shadow-md'
                                                }`}
                                            onClick={() => handleSelectInvoice(inv)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                            #{inv.invoice_number}
                                                        </span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {formatDate(inv.createdAt)}
                                                        </span>
                                                    </div>

                                                    <div className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                        <User size={16} className={`dark:text-gray-400 ${selectedInvoice?.id === inv.id ? 'text-green-600' : 'text-gray-400'}`} />
                                                        {inv.Customer?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 pl-6">
                                                        {inv.Customer?.phone}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-0.5">Due Amount</div>
                                                    <div className="font-bold text-xl text-red-500 dark:text-red-400">
                                                        ৳{inv.due_amount.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded inline-block">
                                                        Total: ৳{inv.final_amount.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selection Indicator */}
                                            {selectedInvoice?.id === inv.id && (
                                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 sticky top-6 overflow-hidden">
                            <div className="p-5 border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
                                <h2 className="font-bold text-lg dark:text-gray-100 flex items-center gap-2">
                                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                        <DollarSign size={18} />
                                    </div>
                                    Payment Entry
                                </h2>
                            </div>

                            <div className="p-6">
                                {selectedInvoice ? (
                                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 relative group">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedInvoice(null)}
                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1 hover:bg-white rounded-full transition-all"
                                                title="Clear Selection"
                                            >
                                                ✕
                                            </button>
                                            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-3">Selected Invoice</div>

                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">#{selectedInvoice.invoice_number}</span>
                                                <span className="text-xl font-bold text-red-600">৳{selectedInvoice.due_amount.toFixed(2)}</span>
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Due Amount
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collection Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">৳</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="1"
                                                    max={selectedInvoice.due_amount}
                                                    className="w-full pl-10 pr-4 py-4 text-2xl font-bold border rounded-xl focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow shadow-sm"
                                                    placeholder="0.00"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    type="button"
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                    onClick={() => setPaymentAmount(selectedInvoice.due_amount.toString())}
                                                >
                                                    collect full amount
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Cash', 'Card', 'Mobile'].map(method => (
                                                    <button
                                                        key={method}
                                                        type="button"
                                                        className={`py-3 px-2 rounded-xl border text-sm font-semibold transition-all relative overflow-hidden ${paymentMethod === method
                                                                ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-[1.02]'
                                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                            }`}
                                                        onClick={() => setPaymentMethod(method)}
                                                    >
                                                        {method}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note (Optional)</label>
                                            <textarea
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                rows="2"
                                                placeholder="Reference # or details..."
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform active:scale-[0.98]"
                                        >
                                            {processing ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            ) : (
                                                <>
                                                    <CreditCard size={20} />
                                                    Confirm Collection
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Create Legacy/Paper Invoice Entry</h3>
                                            <p className="text-xs text-gray-500">
                                                Manually add an old offline invoice to the system to collect its due.
                                            </p>
                                        </div>

                                        <form onSubmit={handleLegacySubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Paper Invoice ID (NOT SYSTEM ID)</label>
                                                <input
                                                    name="invoice_number"
                                                    type="text"
                                                    placeholder="e.g. 1005"
                                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Customer Name (Optional)</label>
                                                <input
                                                    name="customer_name"
                                                    type="text"
                                                    placeholder="Walk-in Customer"
                                                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Total Due Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-gray-500 font-bold">৳</span>
                                                    <input
                                                        name="amount"
                                                        type="number"
                                                        min="1"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        className="w-full pl-8 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors"
                                            >
                                                {processing ? 'Creating...' : '+ Create & Load for Payment'}
                                            </button>
                                        </form>

                                        <div className="relative flex items-center py-2">
                                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR SEARCH EXISTING</span>
                                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Find System Invoice</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search ID..."
                                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setSearchTerm(e.currentTarget.value);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-blue-700"
                                                    onClick={(e) => setSearchTerm(e.currentTarget.previousElementSibling.value)}
                                                >
                                                    Load
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Enter number and click Load to fetch invoice.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collected</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                                    ৳{history.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</p>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                                    {history.length}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                <CreditCard size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <th className="p-4 pl-6">Date</th>
                                        <th className="p-4">Invoice #</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Note</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {loading && history.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center text-gray-500">Loading history...</td>
                                        </tr>
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center text-gray-500">No payment history found.</td>
                                        </tr>
                                    ) : (
                                        history.map((record) => (
                                            <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="font-medium text-gray-700 dark:text-gray-200">{formatDate(record.createdAt)}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                                    {record.invoice?.invoiceNumber || 'N/A'}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <div className="font-medium text-gray-800 dark:text-gray-200">{record.invoice?.customer?.name || record.invoice?.customerName || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">{record.invoice?.customer?.phone || ''}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${record.paymentMethod === 'Cash'
                                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                        : record.paymentMethod === 'Card'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                            : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                                                        }`}>
                                                        {record.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate block" title={record.note}>
                                                        {record.note || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-gray-800 dark:text-gray-100">
                                                        ৳{record.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {(hasPermission('EDIT_DUE') || hasPermission('DELETE_DUE')) && (
                                                        <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            {hasPermission('EDIT_DUE') && (
                                                                <button
                                                                    onClick={() => openEditModal(record)}
                                                                    className="text-white hover:bg-orange-600 px-3 py-1.5 bg-orange-500 rounded-lg shadow-sm transition-all hover:scale-105"
                                                                    title="Edit Payment"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                            )}
                                                            {hasPermission('DELETE_DUE') && (
                                                                <button
                                                                    onClick={() => handleDeletePayment(record._id || record.id)}
                                                                    className="text-white hover:bg-red-600 px-3 py-1.5 bg-red-500 rounded-lg shadow-sm transition-all hover:scale-105"
                                                                    title="Delete Payment"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
