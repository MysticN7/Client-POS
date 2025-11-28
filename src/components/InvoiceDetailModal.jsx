import { X } from 'lucide-react';

export default function InvoiceDetailModal({ invoice, onClose }) {
    if (!invoice) return null;

    const dueAmount = parseFloat(invoice.final_amount) - parseFloat(invoice.paid_amount);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gray-50">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Invoice Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 touch-manipulation">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Invoice Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">Invoice Number</h3>
                            <p className="text-base sm:text-lg font-bold text-blue-600">{invoice.invoice_number}</p>
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">Date</h3>
                            <p className="text-sm sm:text-lg">{new Date(invoice.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">Status</h3>
                            <span className={`inline-block px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                    invoice.status === 'Pending' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {invoice.status}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">Payment Method</h3>
                            <p className="text-sm sm:text-lg">{invoice.payment_method}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <span className="text-xs sm:text-sm text-gray-600">Name:</span>
                                <p className="font-medium text-sm sm:text-base">{invoice.Customer?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-xs sm:text-sm text-gray-600">Phone:</span>
                                <p className="font-medium text-sm sm:text-base">{invoice.Customer?.phone || 'N/A'}</p>
                            </div>
                            {invoice.Customer?.address && (
                                <div className="col-span-1 sm:col-span-2">
                                    <span className="text-xs sm:text-sm text-gray-600">Address:</span>
                                    <p className="font-medium text-sm sm:text-base">{invoice.Customer.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Items</h3>
                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                            <table className="w-full border min-w-[500px]">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Item</th>
                                        <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm">Qty</th>
                                        <th className="px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">Price</th>
                                        <th className="px-2 sm:px-4 py-2 text-right text-xs sm:text-sm">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.InvoiceItems?.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="px-2 sm:px-4 py-3">
                                                <div className="font-medium text-sm sm:text-base">{item.item_name}</div>
                                                {item.prescription_data && (
                                                    <div className="mt-2 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded border">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2">
                                                            <div>
                                                                <p className="font-bold text-gray-600 mb-1 text-xs sm:text-sm">Right Eye:</p>
                                                                <div className="space-y-1">
                                                                    <p className="text-gray-500 text-xs sm:text-sm break-words">
                                                                        <span className="font-medium">D:</span>{' '}
                                                                        <span className="text-gray-700">
                                                                            {item.prescription_data.right?.distance?.sph || '-'} / {item.prescription_data.right?.distance?.cyl || '-'} x {item.prescription_data.right?.distance?.axis || '-'}
                                                                        </span>
                                                                    </p>
                                                                    <p className="text-gray-500 text-xs sm:text-sm break-words">
                                                                        <span className="font-medium">N:</span>{' '}
                                                                        <span className="text-gray-700">
                                                                            {item.prescription_data.right?.near?.sph || '-'} / {item.prescription_data.right?.near?.cyl || '-'} x {item.prescription_data.right?.near?.axis || '-'}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-600 mb-1 text-xs sm:text-sm">Left Eye:</p>
                                                                <div className="space-y-1">
                                                                    <p className="text-gray-500 text-xs sm:text-sm break-words">
                                                                        <span className="font-medium">D:</span>{' '}
                                                                        <span className="text-gray-700">
                                                                            {item.prescription_data.left?.distance?.sph || '-'} / {item.prescription_data.left?.distance?.cyl || '-'} x {item.prescription_data.left?.distance?.axis || '-'}
                                                                        </span>
                                                                    </p>
                                                                    <p className="text-gray-500 text-xs sm:text-sm break-words">
                                                                        <span className="font-medium">N:</span>{' '}
                                                                        <span className="text-gray-700">
                                                                            {item.prescription_data.left?.near?.sph || '-'} / {item.prescription_data.left?.near?.cyl || '-'} x {item.prescription_data.left?.near?.axis || '-'}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(item.prescription_data.lensType || item.prescription_data.remarks) && (
                                                            <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                                                                <p className="text-gray-500 text-xs sm:text-sm break-words">
                                                                    <span className="font-medium">Lens:</span>{' '}
                                                                    <span className="font-medium">{item.prescription_data.lensType || '-'}</span>
                                                                </p>
                                                                <p className="text-gray-500 text-xs sm:text-sm break-words">
                                                                    <span className="font-medium">Remarks:</span>{' '}
                                                                    <span className="font-medium">{item.prescription_data.remarks || '-'}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 sm:px-4 py-3 text-center text-sm">{item.quantity}</td>
                                            <td className="px-2 sm:px-4 py-3 text-right text-sm">${parseFloat(item.unit_price).toFixed(2)}</td>
                                            <td className="px-2 sm:px-4 py-3 text-right font-medium text-sm">${parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${parseFloat(invoice.total_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-red-600">-${parseFloat(invoice.discount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                                <span>Final Amount:</span>
                                <span>${parseFloat(invoice.final_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 text-sm sm:text-base">
                                <span>Paid:</span>
                                <span className="font-bold">${parseFloat(invoice.paid_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600 text-base sm:text-lg font-bold border-t pt-2">
                                <span>Due:</span>
                                <span>${dueAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.PaymentHistories && invoice.PaymentHistories.length > 0 && (
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Payment History</h3>
                            <div className="space-y-2">
                                {invoice.PaymentHistories.map((payment, index) => (
                                    <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                                            <div>
                                                <p className="font-medium text-green-800">${parseFloat(payment.amount).toFixed(2)}</p>
                                                <p className="text-xs text-gray-600">
                                                    {new Date(payment.payment_date).toLocaleString()} • {payment.payment_method}
                                                </p>
                                                {payment.notes && (
                                                    <p className="text-xs text-gray-500 italic mt-1">{payment.notes}</p>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                By: {payment.processor?.name || 'System'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {invoice.note && (
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                            <p className="text-gray-600 bg-yellow-50 p-3 rounded text-sm">{invoice.note}</p>
                        </div>
                    )}

                    {/* Processed By */}
                    {invoice.User && (
                        <div className="text-xs sm:text-sm text-gray-500">
                            <span>Processed by: </span>
                            <span className="font-medium">{invoice.User.name} ({invoice.User.email})</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
