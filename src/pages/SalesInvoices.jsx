import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search } from 'lucide-react';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import EditInvoiceModal from '../components/EditInvoiceModal';
import { useAuth } from '../context/AuthContext';

export default function SalesInvoices() {
    const { hasPermission } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState(null);

    // Use local date for default to avoid timezone issues
    const getLocalDate = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getLocalDate());
    const [endDate, setEndDate] = useState(getLocalDate());
    const [search, setSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        if (!hasPermission('VIEW_DAILY_SALES')) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const res = await api.get(`/sales/date-range?startDate=${start.toISOString()}&endDate=${end.toISOString()}&search=${search}`);
            setInvoices(res.data.sales);
            setSummary(res.data.summary);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (invoiceId) => {
        try {
            const res = await api.get(`/sales/${invoiceId}`);
            setSelectedInvoice(res.data);
            setShowDetailModal(true);
        } catch (err) {
            console.error(err);
            alert('Failed to load invoice details');
        }
    };

    const handleEditInvoice = async (invoiceId) => {
        try {
            const res = await api.get(`/sales/${invoiceId}`);
            setSelectedInvoice(res.data);
            setShowEditModal(true);
        } catch (err) {
            console.error(err);
            alert('Failed to load invoice');
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

        try {
            await api.delete(`/sales/${invoiceId}`);
            alert('Invoice deleted successfully');
            fetchInvoices();
        } catch (err) {
            console.error(err);
            alert('Failed to delete invoice');
        }
    };

    // Calculate Totals
    const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount), 0);
    const totalDue = invoices.reduce((sum, inv) => sum + (parseFloat(inv.final_amount) - parseFloat(inv.paid_amount)), 0);

    return (
        <div className="p-6 bg-white dark:bg-gray-900 min-h-screen dark:text-gray-100">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Daily Sales</h2>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-blue-100 p-4 rounded-lg text-center">
                        <h3 className="text-blue-800 font-bold">Total Sales</h3>
                        <p className="text-2xl font-bold text-blue-900">৳{summary.totalSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                        <h3 className="text-green-800 font-bold">Collected</h3>
                        <p className="text-2xl font-bold text-green-900">৳{summary.totalCollected.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg text-center">
                        <h3 className="text-red-800 font-bold">Due</h3>
                        <p className="text-2xl font-bold text-red-900">৳{summary.totalDue.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <h3 className="text-gray-800 font-bold">Invoices</h3>
                        <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
                    </div>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="flex flex-col space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Search :</label>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-1 focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Customer Name or Phone"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Date :</label>
                    <input
                        type="date"
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="font-bold text-gray-700">To</span>
                    <input
                        type="date"
                        className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <button
                    onClick={fetchInvoices}
                    className="bg-blue-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded font-bold hover:bg-blue-600 transition duration-200 w-full sm:w-auto touch-manipulation"
                >
                    Search
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-200 px-4 py-2 text-center font-bold text-gray-700 text-sm">SL</th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-bold text-gray-700 text-sm w-1/4">Customer</th>
                            <th className="border border-gray-200 px-4 py-2 text-center font-bold text-gray-700 text-sm">Vat</th>
                            <th className="border border-gray-200 px-4 py-2 text-right font-bold text-gray-700 text-sm">Amount</th>
                            <th className="border border-gray-200 px-4 py-2 text-right font-bold text-gray-700 text-sm">Payment</th>
                            <th className="border border-gray-200 px-4 py-2 text-right font-bold text-gray-700 text-sm">Due</th>
                            <th className="border border-gray-200 px-4 py-2 text-center font-bold text-gray-700 text-sm">View</th>
                            <th className="border border-gray-200 px-4 py-2 text-center font-bold text-gray-700 text-sm">Edit</th>
                            <th className="border border-gray-200 px-4 py-2 text-center font-bold text-gray-700 text-sm">Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="text-center py-8 text-gray-500 dark:text-gray-300">Loading...</td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center py-8 text-gray-500 dark:text-gray-300">No invoices found</td>
                            </tr>
                        ) : (
                            invoices.map((invoice, index) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="border border-gray-200 px-4 py-2 text-center text-sm">{index + 1}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-sm">
                                        <div className="font-bold">{invoice.Customer?.name || 'Walk-in Customer'}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-300">{new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString()}</div>
                                        <div className="text-xs text-gray-500">Bill: {invoice.invoice_number}</div>
                                    </td>
                                    <td className="border border-gray-200 px-4 py-2 text-center text-sm">0</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right text-sm">৳{(parseFloat(invoice.final_amount) || 0).toFixed(2)}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right text-sm">৳{(parseFloat(invoice.paid_amount) || 0).toFixed(2)}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right text-sm">৳{((parseFloat(invoice.final_amount) || 0) - (parseFloat(invoice.paid_amount) || 0)).toFixed(2)}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-center">
                                        <button
                                            onClick={() => handleViewDetails(invoice.id)}
                                            className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-600"
                                        >
                                            View
                                        </button>
                                    </td>
                                    <td className="border border-gray-200 px-4 py-2 text-center">
                                        <button
                                            onClick={() => handleEditInvoice(invoice.id)}
                                            className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-600"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                    <td className="border border-gray-200 px-4 py-2 text-center">
                                        <button
                                            onClick={() => handleDeleteInvoice(invoice.id)}
                                            className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {/* Totals Row */}
                        {!loading && invoices.length > 0 && (
                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                <td colSpan="3" className="border border-gray-200 px-4 py-2 text-center">Total</td>
                                <td className="border border-gray-200 px-4 py-2 text-right">৳{totalAmount.toFixed(2)}</td>
                                <td className="border border-gray-200 px-4 py-2 text-right">৳{totalPaid.toFixed(2)}</td>
                                <td className="border border-gray-200 px-4 py-2 text-right">৳{totalDue.toFixed(2)}</td>
                                <td colSpan="3" className="border border-gray-200"></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {
                showDetailModal && selectedInvoice && (
                    <InvoiceDetailModal
                        invoice={selectedInvoice}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedInvoice(null);
                        }}
                    />
                )
            }

            {
                showEditModal && selectedInvoice && (
                    <EditInvoiceModal
                        invoice={selectedInvoice}
                        onClose={() => {
                            setShowEditModal(false);
                            setSelectedInvoice(null);
                        }}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setSelectedInvoice(null);
                            fetchInvoices();
                        }}
                    />
                )
            }
        </div >
    );
}
