import { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Printer, Save, Plus, Trash2, ChevronDown, ChevronUp, Glasses } from 'lucide-react';
// import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import api from '../api/axios';
import InvoicePrint from './InvoicePrint';
import SmartRxInput from './SmartRxInput';

export default function EditInvoiceModal({ invoice, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method || 'Cash');
    const [notes, setNotes] = useState(invoice?.note || '');
    const [discount, setDiscount] = useState(invoice?.discount || 0);
    const [loading, setLoading] = useState(false);
    const [expandedRx, setExpandedRx] = useState({});

    const toggleRx = (index) => {
        setExpandedRx(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const printRef = useRef();
    const [printSettings, setPrintSettings] = useState({ paper_width_mm: 80, paper_margin_mm: 4 });
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/invoice-settings');
                setPrintSettings({
                    paper_width_mm: Number(res.data.paper_width_mm) || 80,
                    paper_margin_mm: Number(res.data.paper_margin_mm) || 4,
                });
            } catch { }
        };
        fetchSettings();
    }, []);

    // Image-based print for consistent cross-device output
    // Uses 203 DPI (thermal printer standard) for proper sizing
    const handlePrint = async () => {
        if (!printRef.current) return;

        try {
            // Thermal printers use 203 DPI
            // 80mm at 203 DPI = 80 * (203 / 25.4) = ~640 pixels
            const thermalDPI = 203;
            const paperWidthMM = printSettings.paper_width_mm || 80;
            const fixedWidth = Math.round(paperWidthMM * (thermalDPI / 25.4));
            const element = printRef.current;

            // Render to canvas at thermal printer resolution
            const canvas = await html2canvas(element, {
                scale: 3, // High resolution for crisp thermal print
                width: fixedWidth,
                windowWidth: fixedWidth,
                backgroundColor: '#ffffff',
                useCORS: true,
            });

            // Create a new window with just the image
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Invoice ${invoice.invoice_number}</title>
                        <style>
                            @media print {
                                @page { margin: 0; size: ${paperWidthMM}mm auto; }
                                body { margin: 0; }
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                display: flex;
                                justify-content: center;
                            }
                            img {
                                width: ${paperWidthMM}mm;
                                height: auto;
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${canvas.toDataURL('image/png')}" />
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() { window.close(); };
                            };
                        <\/script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            console.error('Print error:', error);
            // Fallback to regular print
            window.print();
        }
    };

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:absolute print:z-[9999]">
            <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-7xl h-full sm:h-[95vh] flex flex-col print:shadow-none print:max-w-none print:w-full print:h-full print:max-h-full">
                {/* Header */}
                <div className="flex justify-between items-center p-3 sm:p-6 border-b bg-blue-50 dark:bg-gray-800 dark:border-gray-700 rounded-t-lg print:hidden">
                    <div>
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Invoice & Rx</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Invoice: {invoice.invoice_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Two Column Layout - Stack on mobile */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Column - Edit Form */}
                    <div className="w-full lg:w-1/2 overflow-y-auto p-3 sm:p-6 border-b lg:border-r lg:border-b-0 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 print:hidden">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Items Editing Section */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg border-b dark:border-gray-700 pb-2">Items & Prescription</h3>
                                {items.map((item, index) => (
                                    <div key={item.id || index} className="bg-white dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-700 shadow-sm space-y-4">
                                        {/* Item Details */}
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-12 sm:col-span-5">
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">Item Name</label>
                                                <input
                                                    className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2.5 rounded text-sm font-bold shadow-sm"
                                                    value={item.item_name}
                                                    onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">Qty</label>
                                                <input
                                                    type="number"
                                                    className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2.5 rounded text-sm text-center shadow-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">Rate</label>
                                                <input
                                                    type="number"
                                                    className="w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2.5 rounded text-sm text-center shadow-sm"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-4 sm:col-span-3">
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">Total</label>
                                                <div className="w-full border dark:border-gray-700 p-2.5 rounded text-sm text-center bg-gray-100 dark:bg-gray-700 dark:text-gray-100 font-bold">
                                                    ৳{(item.quantity * item.unit_price).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {item.prescription_data && (
                                            <div className="border-top dark:border-gray-700 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRx(index)}
                                                    className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-800 rounded-lg text-blue-700 dark:text-blue-300 font-bold text-sm hover:bg-blue-100 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Glasses size={18} />
                                                        Prescription Details
                                                    </span>
                                                    {expandedRx[index] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>

                                                {expandedRx[index] && (
                                                    <div className="p-3 border rounded-lg mt-2 bg-gray-50 dark:bg-gray-800/50">

                                                        {/* Right Eye */}
                                                        <div className="mb-4">
                                                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Right Eye</div>
                                                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-gray-500 dark:text-gray-300 mb-1">
                                                                <span>SPH</span><span>CYL</span><span>AXIS</span>
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-300 mb-1">DIST</div>
                                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                                {['sph', 'cyl', 'axis'].map(field => (
                                                                    <SmartRxInput
                                                                        key={field}
                                                                        className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                                                                        placeholder={field.toUpperCase()}
                                                                        value={item.prescription_data?.right?.distance?.[field] || ''}
                                                                        onChange={(e) => handleRxChange(index, 'right', 'distance', field, e.target.value)}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-300 mb-1">NEAR</div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['sph', 'cyl', 'axis'].map(field => (
                                                                    <SmartRxInput
                                                                        key={field}
                                                                        className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                                                                        placeholder={field.toUpperCase()}
                                                                        value={item.prescription_data?.right?.near?.[field] || ''}
                                                                        onChange={(e) => handleRxChange(index, 'right', 'near', field, e.target.value)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Left Eye */}
                                                        <div className="mb-4">
                                                            <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">Left Eye</div>
                                                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-gray-500 dark:text-gray-300 mb-1">
                                                                <span>SPH</span><span>CYL</span><span>AXIS</span>
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-300 mb-1">DIST</div>
                                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                                {['sph', 'cyl', 'axis'].map(field => (
                                                                    <SmartRxInput
                                                                        key={field}
                                                                        className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                                                                        placeholder={field.toUpperCase()}
                                                                        value={item.prescription_data?.left?.distance?.[field] || ''}
                                                                        onChange={(e) => handleRxChange(index, 'left', 'distance', field, e.target.value)}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-300 mb-1">NEAR</div>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['sph', 'cyl', 'axis'].map(field => (
                                                                    <SmartRxInput
                                                                        key={field}
                                                                        className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2 text-center text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
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
                                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">Lens Type</label>
                                                                <input
                                                                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2 text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                                    value={item.prescription_data?.lensType || ''}
                                                                    onChange={(e) => handleRxChange(index, 'extra', null, 'lensType', e.target.value)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-300 mb-1">Remarks</label>
                                                                <input
                                                                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 p-2 text-sm rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                                    value={item.prescription_data?.remarks || ''}
                                                                    onChange={(e) => handleRxChange(index, 'extra', null, 'remarks', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Payment Section */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Payment & Notes</h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Payment</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 dark:text-gray-100 p-3 rounded text-sm space-y-1">
                                        <div className="flex justify-between"><span>Subtotal:</span> <span className="font-bold">৳{totalAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-red-600"><span>Discount:</span> <span className="font-bold">-৳{parseFloat(discount || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between border-t border-gray-300 dark:border-gray-700 pt-1"><span>Net Total:</span> <span className="font-bold">৳{finalAmount.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-green-600"><span>Paid (Prev + New):</span> <span className="font-bold">৳{(parseFloat(invoice.paid_amount || 0) + (parseFloat(paymentAmount) || 0)).toFixed(2)}</span></div>
                                        <div className="flex justify-between border-t border-gray-300 dark:border-gray-700 pt-1 text-lg"><span>Due:</span> <span className="font-bold">৳{dueAmount.toFixed(2)}</span></div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="MFS">Mobile Banking</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg h-24 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Invoice notes..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 sticky bottom-0 bg-gray-50 dark:bg-gray-800 pb-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium dark:text-gray-100"
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
                    <div className="w-full lg:w-1/2 overflow-y-auto p-3 sm:p-6 bg-gray-100 dark:bg-gray-900 flex justify-center items-start print:w-full print:bg-white">
                        <div className="sticky top-2 sm:top-6 w-full">
                            <h3 className="text-center font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-4 text-sm sm:text-base print:hidden">Live Preview</h3>
                            <div className="shadow-2xl print:shadow-none print-only">
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
            </div >
        </div >
    );
}
