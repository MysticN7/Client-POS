import { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Printer, Save, Plus, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import InvoicePrint from './InvoicePrint';

export default function EditInvoiceModal({ invoice, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method || 'Cash');
    const [notes, setNotes] = useState(invoice?.note || '');
    const [discount, setDiscount] = useState(invoice?.discount || 0);
    const [loading, setLoading] = useState(false);

    const printRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    useEffect(() => {
        if (invoice) {
            // Deep copy items to allow editing without mutating original prop immediately
            const invoiceItems = JSON.parse(JSON.stringify(invoice.InvoiceItems || []));

            // Parse prescription_data if it's a JSON string
            const parsedItems = invoiceItems.map(item => {
                if (item.prescription_data && typeof item.prescription_data === 'string') {
                    try {
                        item.prescription_data = JSON.parse(item.prescription_data);
                    } catch (e) {
                        console.error('Failed to parse prescription_data:', e);
                    }
                }
                return item;
            });

            setItems(parsedItems);
            setDiscount(invoice.discount || 0);
        }
    }, [invoice]);

    if (!invoice) return null;

    // Calculate totals dynamically
    const calculateTotals = () => {
        const totalAmount = items.reduce((sum, item) => {
            return sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0));
        }, 0);
        const finalAmount = totalAmount - parseFloat(discount || 0);
        const paid = parseFloat(invoice.paid_amount || 0) + (parseFloat(paymentAmount) || 0);
        const due = finalAmount - paid;
        return { totalAmount, finalAmount, due };
    };

    const { totalAmount, finalAmount, due: dueAmount } = calculateTotals();

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleRxChange = (index, eye, type, field, value) => {
        const newItems = [...items];
        if (!newItems[index].prescription_data) {
            newItems[index].prescription_data = {
                right: { distance: {}, near: {} },
                left: { distance: {}, near: {} },
                lensType: '',
                remarks: ''
            };
        }

        if (eye === 'extra') {
            newItems[index].prescription_data[field] = value;
        } else {
            if (!newItems[index].prescription_data[eye]) newItems[index].prescription_data[eye] = {};
            if (!newItems[index].prescription_data[eye][type]) newItems[index].prescription_data[eye][type] = {};
            newItems[index].prescription_data[eye][type][field] = value;
        }
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = paymentAmount ? parseFloat(paymentAmount) : 0;
        if (paymentAmount && (isNaN(amount) || amount < 0)) {
            alert('Please enter a valid amount');
            return;
        }

        // Allow due to be negative (overpayment/change) or just warn? 
        // For now, standard check, but maybe less strict if editing totals

        setLoading(true);
        try {
            // 1. Update Invoice (Payment, Rx, Items, Discount)
            await api.put(`/sales/${invoice.id}`, {
                paid_amount: amount > 0 ? parseFloat(invoice.paid_amount) + amount : undefined,
                payment_method: paymentMethod,
                note: notes,
                discount: parseFloat(discount),
                items: items // Send updated items with Rx data AND price/qty
            });

            // 2. If payment amount > 0, record in history
            if (amount > 0) {
                await api.post(`/sales/${invoice.id}/payment`, {
                    amount: amount,
                    payment_method: paymentMethod,
                    notes: 'Payment added during edit'
                });
            }

            alert('Invoice updated successfully!');
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to update invoice: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Construct a temporary invoice object for printing that includes the edited items
    const invoiceForPrint = {
        ...invoice,
        InvoiceItems: items,
        total_amount: totalAmount,
        discount: discount,
        final_amount: finalAmount,
        paid_amount: parseFloat(invoice.paid_amount || 0) + (parseFloat(paymentAmount) || 0),
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-full sm:h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-3 sm:p-6 border-b bg-blue-50 rounded-t-lg">
                    <div>
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Edit Invoice & Rx</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Invoice: {invoice.invoice_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Two Column Layout - Stack on mobile */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Column - Edit Form */}
                    <div className="w-full lg:w-1/2 overflow-y-auto p-3 sm:p-6 border-b lg:border-r lg:border-b-0 bg-gray-50">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Items Editing Section */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg border-b pb-2">Items & Prescription</h3>
                                {items.map((item, index) => (
                                    <div key={item.id || index} className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                                        {/* Item Details */}
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-6">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Item Name</label>
                                                <input
                                                    className="w-full border p-2 rounded text-sm font-bold"
                                                    value={item.item_name}
                                                    onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    className="w-full border p-2 rounded text-sm text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Rate</label>
                                                <input
                                                    type="number"
                                                    className="w-full border p-2 rounded text-sm text-center"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Total</label>
                                                <div className="w-full border p-2 rounded text-sm text-center bg-gray-100">
                                                    {(item.quantity * item.unit_price).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rx Section (Conditional) */}
                                        {item.prescription_data && (
                                            <div className="border-t pt-4 mt-2">
                                                <h4 className="font-bold text-sm text-blue-600 mb-3 uppercase tracking-wide">Prescription Details</h4>

                                                {/* Right Eye */}
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-16 font-bold text-right text-sm">Right</span>
                                                        <div className="flex-1 grid grid-cols-3 gap-2 text-center text-xs font-bold text-gray-500">
                                                            <span>SPH</span><span>CYL</span><span>AXIS</span>
                                                        </div>
                                                    </div>
                                                    {/* Dist */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-16 text-right text-xs font-bold text-gray-500 uppercase">Dist</div>
                                                        {['sph', 'cyl', 'axis'].map(field => (
                                                            <input
                                                                key={field}
                                                                className="flex-1 border border-gray-300 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                                placeholder={field.toUpperCase()}
                                                                value={item.prescription_data?.right?.distance?.[field] || ''}
                                                                onChange={(e) => handleRxChange(index, 'right', 'distance', field, e.target.value)}
                                                            />
                                                        ))}
                                                    </div>
                                                    {/* Near */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 text-right text-xs font-bold text-gray-500 uppercase">Near</div>
                                                        {['sph', 'cyl', 'axis'].map(field => (
                                                            <input
                                                                key={field}
                                                                className="flex-1 border border-gray-300 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                                placeholder={field.toUpperCase()}
                                                                value={item.prescription_data?.right?.near?.[field] || ''}
                                                                onChange={(e) => handleRxChange(index, 'right', 'near', field, e.target.value)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Left Eye */}
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-16 font-bold text-right text-sm">Left</span>
                                                        <div className="flex-1 grid grid-cols-3 gap-2 text-center text-xs font-bold text-gray-500">
                                                            <span>SPH</span><span>CYL</span><span>AXIS</span>
                                                        </div>
                                                    </div>
                                                    {/* Dist */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-16 text-right text-xs font-bold text-gray-500 uppercase">Dist</div>
                                                        {['sph', 'cyl', 'axis'].map(field => (
                                                            <input
                                                                key={field}
                                                                className="flex-1 border border-gray-300 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                                placeholder={field.toUpperCase()}
                                                                value={item.prescription_data?.left?.distance?.[field] || ''}
                                                                onChange={(e) => handleRxChange(index, 'left', 'distance', field, e.target.value)}
                                                            />
                                                        ))}
                                                    </div>
                                                    {/* Near */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 text-right text-xs font-bold text-gray-500 uppercase">Near</div>
                                                        {['sph', 'cyl', 'axis'].map(field => (
                                                            <input
                                                                key={field}
                                                                className="flex-1 border border-gray-300 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                                placeholder={field.toUpperCase()}
                                                                value={item.prescription_data?.left?.near?.[field] || ''}
                                                                onChange={(e) => handleRxChange(index, 'left', 'near', field, e.target.value)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Extra Fields */}
                                                <div className="grid grid-cols-2 gap-4 mt-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Lens Type</label>
                                                        <input
                                                            className="w-full border border-gray-300 p-2 text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                            value={item.prescription_data?.lensType || ''}
                                                            onChange={(e) => handleRxChange(index, 'extra', null, 'lensType', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Remarks</label>
                                                        <input
                                                            className="w-full border border-gray-300 p-2 text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                            value={item.prescription_data?.remarks || ''}
                                                            onChange={(e) => handleRxChange(index, 'extra', null, 'remarks', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Payment Section */}
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                                <h3 className="font-bold text-lg mb-4">Payment & Notes</h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Add Payment</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                                        <div className="flex justify-between"><span>Subtotal:</span> <span className="font-bold">{totalAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-red-600"><span>Discount:</span> <span className="font-bold">-{parseFloat(discount || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between border-t border-gray-300 pt-1"><span>Net Total:</span> <span className="font-bold">{finalAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-green-600"><span>Paid (Prev + New):</span> <span className="font-bold">{(parseFloat(invoice.paid_amount || 0) + (parseFloat(paymentAmount) || 0)).toFixed(2)}</span></div>
                                        <div className="flex justify-between border-t border-gray-300 pt-1 text-lg"><span>Due:</span> <span className="font-bold">{dueAmount.toFixed(2)}</span></div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="MFS">Mobile Banking</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Invoice notes..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-gray-50 pb-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium shadow-sm"
                                    disabled={loading}
                                >
                                    <Save size={18} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Live Invoice Preview */}
                    <div className="w-full lg:w-1/2 overflow-y-auto p-3 sm:p-6 bg-gray-100 flex justify-center items-start">
                        <div className="sticky top-2 sm:top-6 w-full">
                            <h3 className="text-center font-bold text-gray-700 mb-2 sm:mb-4 text-sm sm:text-base">Live Preview</h3>
                            <div className="shadow-2xl">
                                <InvoicePrint
                                    ref={printRef}
                                    invoice={invoiceForPrint}
                                    items={items}
                                    customer={invoice.Customer}
                                    user={invoice.User}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
