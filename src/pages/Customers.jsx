import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search, Users, DollarSign, ShoppingBag, X } from 'lucide-react';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        customer_type: 'regular',
        notes: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, [searchTerm]);

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customers', {
                params: { search: searchTerm }
            });
            setCustomers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer.id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            setShowForm(false);
            setEditingCustomer(null);
            resetForm();
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Error saving customer');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Error deleting customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            address: customer.address || '',
            email: customer.email || '',
            customer_type: customer.customer_type || 'regular',
            notes: customer.notes || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            address: '',
            email: '',
            customer_type: 'regular',
            notes: ''
        });
    };

    // Calculate analytics
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter(c => c.customer_type === 'vip').length;
    const totalPurchases = customers.reduce((sum, c) => sum + parseFloat(c.total_purchases || 0), 0);
    const avgPurchaseValue = totalCustomers > 0 ? totalPurchases / totalCustomers : 0;

    return (
        <div className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Customers</h2>
                <button
                    onClick={() => { setShowForm(true); setEditingCustomer(null); resetForm(); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto touch-manipulation"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add Customer
                </button>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 font-medium">Total Customers</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-200">{totalCustomers}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 font-medium">VIP Customers</p>
                            <p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-200">{vipCustomers}</p>
                        </div>
                        <Users className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-green-600 dark:text-green-300 font-medium">Total Purchases</p>
                            <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-200">${totalPurchases.toFixed(2)}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-300 font-medium">Avg Purchase</p>
                            <p className="text-lg sm:text-2xl font-bold text-orange-700 dark:text-orange-200">${avgPurchaseValue.toFixed(2)}</p>
                        </div>
                        <ShoppingBag className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow mb-4 sm:mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-5 h-5" />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        placeholder="Search customers by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchases</th>
                                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">Loading...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-300">No customers found</td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">{customer.name}</td>
                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{customer.phone}</td>
                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{customer.email || '-'}</td>
                                        <td className="px-3 sm:px-4 py-3">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${customer.customer_type === 'vip' ? 'bg-purple-100 text-purple-800' :
                                                customer.customer_type === 'wholesale' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {customer.customer_type || 'regular'}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium">
                                            ${parseFloat(customer.total_purchases || 0).toFixed(2)}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm">
                                            {customer.total_visits || 0}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="text-blue-600 hover:text-blue-800 p-1 touch-manipulation"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
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

            {/* Customer Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg sm:text-xl font-bold">
                                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                            </h3>
                            <button
                                onClick={() => { setShowForm(false); setEditingCustomer(null); resetForm(); }}
                                className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Type</label>
                                    <select
                                        className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        value={formData.customer_type}
                                        onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                    >
                                        <option value="regular">Regular</option>
                                        <option value="vip">VIP</option>
                                        <option value="wholesale">Wholesale</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                <textarea
                                    className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                    rows="2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                <textarea
                                    className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                    rows="3"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 touch-manipulation"
                                >
                                    {editingCustomer ? 'Update' : 'Add'} Customer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingCustomer(null); resetForm(); }}
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
