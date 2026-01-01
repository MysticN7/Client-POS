import { useRef, useEffect, useState } from 'react';
// import { useReactToPrint } from 'react-to-print';
import InvoicePrint from './InvoicePrint';
import { Check, Printer, X } from 'lucide-react';
import api from '../api/axios';

const InvoiceModal = ({ invoice, items, customer, user, onClose }) => {
    const componentRef = useRef(null);
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

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:absolute print:z-[9999]">
            <div className="bg-white dark:bg-gray-900 dark:text-gray-100 p-4 sm:p-6 rounded shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:w-full print:h-full print:max-h-full print:overflow-visible print:p-0">
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-lg sm:text-2xl font-bold">Invoice</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 p-2 touch-manipulation">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Invoice Preview */}
                <div className="mb-4">
                    <div className="print-only">
                        <InvoicePrint
                            ref={componentRef}
                            invoice={invoice}
                            items={items}
                            customer={customer}
                            user={user}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 print:hidden">
                    <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base">
                        <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                        Print
                    </button>
                    <button onClick={onClose} className="flex-1 bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 touch-manipulation text-sm sm:text-base">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
