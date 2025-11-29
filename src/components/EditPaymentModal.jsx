import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import api from '../api/axios';

export default function EditPaymentModal({ invoice, onClose, onSuccess }) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method || 'Cash');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!invoice) return null;

    const dueAmount = parseFloat(invoice.final_amount) - parseFloat(invoice.paid_amount);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (amount > dueAmount) {
            if (!window.confirm(`Payment amount ($${amount.toFixed(2)}) exceeds due amount ($${dueAmount.toFixed(2)}). Continue?`)) {
                return;
            }
        }

        setLoading(true);
        try {
            await api.post(`/sales/${invoice.id}/payment`, {
                amount: amount,
                payment_method: paymentMethod,
                notes: notes
            });

            alert('Payment recorded successfully!');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to record payment: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const setQuickAmount = (amount) => {
        setPaymentAmount(amount.toString());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-green-50 dark:bg-green-900/20 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Collect Payment</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Invoice: {invoice.invoice_number}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Current Status */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Final Amount:</span>
                            <span className="font-bold">${parseFloat(invoice.final_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Already Paid:</span>
                            <span className="font-bold">${parseFloat(invoice.paid_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 text-lg font-bold border-t pt-2 dark:border-gray-700">
                            <span>Amount Due:</span>
                            <span>${dueAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Current Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                    invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Amount</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setQuickAmount(dueAmount / 2)}
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                            >
                                Half ({(dueAmount / 2).toFixed(2)})
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickAmount(dueAmount)}
                                className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                            >
                                Full Due
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickAmount(parseFloat(invoice.final_amount))}
                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                            >
                                Full Amount
                            </button>
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full pl-10 p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg"
                            required
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="MFS">Mobile Banking (Bkash/Nagad)</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg"
                            rows="3"
                            placeholder="Add any notes about this payment..."
                        />
                    </div>

                    {/* Status Preview */}
                    {paymentAmount && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                            <strong>After this payment:</strong>
                            <div className="mt-1">
                                <span>Paid: ${(parseFloat(invoice.paid_amount) + parseFloat(paymentAmount)).toFixed(2)}</span>
                                <span className="mx-2">•</span>
                                <span>Due: ${Math.max(0, dueAmount - parseFloat(paymentAmount)).toFixed(2)}</span>
                                <span className="mx-2">•</span>
                                <span className="font-medium">
                                    Status: {(parseFloat(invoice.paid_amount) + parseFloat(paymentAmount)) >= parseFloat(invoice.final_amount) ?
                                        <span className="text-green-600">Paid</span> :
                                        <span className="text-yellow-600">Partial</span>
                                    }
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
