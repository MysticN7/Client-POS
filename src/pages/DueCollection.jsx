
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
                    <div className="lg:col-span-2 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search Invoice #, Name or Phone..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Searching...</div>
                            ) : invoices.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    {searchTerm ? 'No invoices with due amounts found.' : 'Search or select to view invoices.'}
                                </div>
                            ) : (
                                <div className="divide-y dark:divide-gray-700">
                                    {invoices.map(inv => (
                                        <div
                                            key={inv.id}
                                            className={`p-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors ${selectedInvoice?.id === inv.id ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''}`}
                                            onClick={() => handleSelectInvoice(inv)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                        <FileText size={16} className="text-gray-400" />
                                                        {inv.invoice_number}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                                        <User size={14} />
                                                        {inv.Customer?.name} ({inv.Customer?.phone})
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                        <Calendar size={12} />
                                                        {formatDate(inv.createdAt)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-500">Due Amount</div>
                                                    <div className="font-extrabold text-red-600 text-lg">৳{inv.due_amount.toFixed(2)}</div>
                                                    <div className="text-xs text-gray-400">Total: ৳{inv.final_amount.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Payment Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 sticky top-6">
                            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                                <h2 className="font-bold text-lg dark:text-gray-100">Payment Entry</h2>
                            </div>

                            <div className="p-6">
                                {selectedInvoice ? (
                                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 relative">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedInvoice(null)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                title="Clear Selection"
                                            >
                                                ✕
                                            </button>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-600 dark:text-gray-300">Invoice:</span>
                                                <span className="font-bold dark:text-gray-100">{selectedInvoice.invoice_number}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 dark:text-gray-300">Total Due:</span>
                                                <span className="text-xl font-bold text-red-600">৳{selectedInvoice.due_amount.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Collection Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500 font-bold">৳</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="1"
                                                    max={selectedInvoice.due_amount}
                                                    className="w-full pl-8 pr-4 py-3 text-lg font-bold border rounded-lg focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    placeholder="0.00"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end mt-1">
                                                <button
                                                    type="button"
                                                    className="text-xs text-blue-600 hover:underline"
                                                    onClick={() => setPaymentAmount(selectedInvoice.due_amount.toString())}
                                                >
                                                    Collect Full Amount
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['Cash', 'Card', 'Mobile'].map(method => (
                                                    <button
                                                        key={method}
                                                        type="button"
                                                        className={`py-2 px-3 rounded border text-sm font-medium transition-all ${paymentMethod === method ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50'}`}
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
                                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 dark:shadow-none disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <>Converting...</>
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Invoice #</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Method</th>
                                    <th className="p-4">Note</th>
                                    <th className="p-4">Note</th>
                                    <th className="p-4 text-right">Amount</th>
                                    {(hasPermission('EDIT_DUE') || hasPermission('DELETE_DUE')) && <th className="p-4 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {loading && history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">Loading history...</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">No payment history found.</td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(record.createdAt)}
                                                <div className="text-xs text-gray-400">
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
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${record.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    record.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    }`}>
                                                    {record.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={record.note}>
                                                {record.note || '-'}
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-800 dark:text-gray-100">
                                                ৳{record.amount.toFixed(2)}
                                            </td>
                                            {(hasPermission('EDIT_DUE') || hasPermission('DELETE_DUE')) && (
                                                <td className="p-4 flex justify-center gap-2">
                                                    {hasPermission('EDIT_DUE') && (
                                                        <button
                                                            onClick={() => openEditModal(record)}
                                                            className="text-white hover:bg-orange-600 px-3 py-1 bg-orange-500 rounded shadow-sm transition-colors"
                                                            title="Edit Payment"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission('DELETE_DUE') && (
                                                        <button
                                                            onClick={() => handleDeletePayment(record._id || record.id)}
                                                            className="text-white hover:bg-red-600 px-3 py-1 bg-red-500 rounded shadow-sm transition-colors"
                                                            title="Delete Payment"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
