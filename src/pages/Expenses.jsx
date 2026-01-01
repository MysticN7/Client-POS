import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', formData);
            setShowForm(false);
            fetchExpenses();
            setFormData({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
        } catch (err) {
            alert('Error adding expense');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
            } catch (err) {
                alert('Error deleting expense');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-gray-100">Expense Vouchers</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-red-600 text-white px-4 py-2 rounded flex items-center hover:bg-red-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Expense
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6">
                    <h3 className="text-lg font-bold mb-4 dark:text-gray-100">New Expense Voucher</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <input type="date" className="border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                        <input placeholder="Category (e.g. Rent, Salary)" className="border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
                        <input type="number" placeholder="Amount" className="border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                        <input placeholder="Description" className="border p-2 rounded dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        <div className="col-span-2">
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Voucher</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-700">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="p-4">{formatDate(expense.date)}</td>
                                <td className="p-4">{expense.category}</td>
                                <td className="p-4">{expense.description}</td>
                                <td className="p-4 font-bold text-red-600">৳{expense.amount}</td>
                                <td className="p-4">
                                    <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
