import { forwardRef, useEffect, useState } from 'react';
import api from '../api/axios';

const InvoicePrint = forwardRef(({ invoice, customer, items, user }, ref) => {
    const [settings, setSettings] = useState({
        business_name: 'Minar Optics',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1234 567890',
        email: 'info@minaroptics.com',
        website: '',
        map_link: '',
        footer_text: 'Thank you for your business!',
        show_served_by: true,
        show_date_time: true,
        header_font_size: 12,
        body_font_size: 10,
        show_note: true,
        show_signature: false
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/invoice-settings');
                if (res.data) {
                    setSettings(res.data);
                }
            } catch (err) {
                console.error('Could not load invoice settings, using defaults:', err);
            }
        };
        fetchSettings();
    }, []);

    // Parse prescription_data if it's a JSON string
    const parsedItems = items?.map(item => {
        if (item.prescription_data && typeof item.prescription_data === 'string') {
            try {
                return { ...item, prescription_data: JSON.parse(item.prescription_data) };
            } catch (e) {
                console.error('Failed to parse prescription_data:', e);
                return item;
            }
        }
        return item;
    }) || [];

    if (!invoice) return <div ref={ref} style={{ padding: '20px' }}>Loading invoice...</div>;

    const numberToWords = (num) => {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        if ((num = num.toString()).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return;
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim();
    };

    const netTotal = Math.max(0, invoice.total_amount - invoice.discount);
    const amountInWords = numberToWords(Math.floor(netTotal)) || 'Zero';

    return (
        <div ref={ref} className="bg-white text-black" style={{ width: '80mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: `${settings.body_font_size || 11}px`, padding: '8mm' }}>
            {/* Header */}
            <div className="text-center mb-3">
                <h1 className="font-black uppercase tracking-wide mb-1" style={{ fontSize: `${settings.header_font_size || 12}px`}}>{settings.business_name} <span className="text-base">👁️</span></h1>
                <p className="text-xs font-semibold">{settings.address} 👓</p>
                <p className="text-xs font-bold">{settings.phone}</p>
                {settings.email && <p className="text-xs">{settings.email}</p>}
                {settings.website && <p className="text-xs">{settings.website}</p>}
                {settings.map_link && <p className="text-xs"><a href={settings.map_link} target="_blank" rel="noreferrer">Location</a></p>}
            </div>

            {/* Invoice Banner */}
            <div className="bg-gray-300 text-center font-black py-1 mb-2 text-xs">
                INVOICE NO : {invoice.invoice_number}
            </div>

            {/* Customer Details */}
            <div className="mb-3 text-xs">
                <p className="mb-1"><strong>Date :</strong> {new Date(invoice.created_at || new Date()).toLocaleDateString('en-US')}</p>
                <p className="mb-1"><strong>Customer :</strong> {customer?.name || 'Walk-In Customer'} ({customer?.phone || '00000000000'})</p>
                <div className="flex justify-between mt-1">
                    {settings.show_served_by && <span>User: {user?.name || 'Admin User'}</span>}
                    {settings.show_date_time && <span>{new Date(invoice.created_at || new Date()).toLocaleTimeString('en-US', { hour12: true })}</span>}
                </div>
            </div>

            {/* Rx Table (Displaying first item's Rx if available) */}
            {parsedItems.find(i => i.prescription_data) && (
                <div className="mb-3">
                    {(() => {
                        const rxItem = parsedItems.find(i => i.prescription_data);
                        const rx = rxItem.prescription_data;

                        // Helper to safely get data
                        const getVal = (eye, type, field) => rx?.[eye]?.[type]?.[field] || '-';

                        return (
                            <div>
                                <table className="w-full text-center border-collapse border border-black" style={{ fontSize: '10px' }}>
                                    <thead>
                                        <tr className="border-b border-black">
                                            <th className="border-r border-black py-1 px-1"></th>
                                            <th className="border-r border-black py-1 px-1 font-black" colSpan="3">Right</th>
                                            <th className="py-1 px-1 font-black" colSpan="3">Left</th>
                                        </tr>
                                        <tr className="border-b border-black">
                                            <th className="border-r border-black py-1 px-1"></th>
                                            <th className="border-r border-black py-1 px-1 font-black">SPH</th>
                                            <th className="border-r border-black py-1 px-1 font-black">CYL</th>
                                            <th className="border-r border-black py-1 px-1 font-black">AXIS</th>
                                            <th className="border-r border-black py-1 px-1 font-black">SPH</th>
                                            <th className="border-r border-black py-1 px-1 font-black">CYL</th>
                                            <th className="py-1 px-1 font-black">AXIS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-black">
                                            <td className="border-r border-black py-1 px-2 font-black text-left">Dist</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('right', 'distance', 'sph')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('right', 'distance', 'cyl')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('right', 'distance', 'axis')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('left', 'distance', 'sph')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('left', 'distance', 'cyl')}</td>
                                            <td className="py-1 px-1 font-bold">{getVal('left', 'distance', 'axis')}</td>
                                        </tr>
                                        <tr className="border-b border-black">
                                            <td className="border-r border-black py-1 px-2 font-black text-left">Near</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('right', 'near', 'sph')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('right', 'near', 'cyl')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('right', 'near', 'axis')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('left', 'near', 'sph')}</td>
                                            <td className="border-r border-black py-1 px-1 font-bold">{getVal('left', 'near', 'cyl')}</td>
                                            <td className="py-1 px-1 font-bold">{getVal('left', 'near', 'axis')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="w-full border-collapse border-l border-r border-b border-black mb-2" style={{ fontSize: '10px' }}>
                                    <tbody>
                                        <tr>
                                            <td className="border-r border-black py-1 px-2 font-bold text-left" style={{ width: '50%' }}>
                                                Lens: {rx.lensType || ''}
                                            </td>
                                            <td className="py-1 px-2 font-bold text-left">
                                                Rem: {rx.remarks || ''}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Bill Header */}
            <div className="text-center font-black mb-2 text-xs">Bill</div>

            {/* Bill Table */}
            <table className="w-full text-left mb-2 border-collapse border border-black" style={{ fontSize: '10px' }}>
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-1 px-2 border-r border-black text-center font-black">Sl</th>
                        <th className="py-1 px-2 border-r border-black font-black">Item</th>
                        <th className="py-1 px-2 border-r border-black text-center font-black">Qty</th>
                        <th className="py-1 px-2 border-r border-black text-center font-black">Rate</th>
                        <th className="py-1 px-2 text-center font-black">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {parsedItems.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 px-2 border-r border-black text-center">{index + 1}</td>
                            <td className="py-1 px-2 border-r border-black">{item.item_name || item.name}</td>
                            <td className="py-1 px-2 border-r border-black text-center">{item.quantity}</td>
                            <td className="py-1 px-2 border-r border-black text-center">{item.unit_price || item.price}</td>
                            <td className="py-1 px-2 text-center">{((item.unit_price || item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end text-xs mb-2">
                <div style={{ width: '45%' }}>
                    <div className="flex justify-between py-1">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">{Number(invoice.total_amount).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="font-bold">Discount</span>
                        <span className="font-bold">{Number(invoice.discount || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-black">
                        <span className="font-bold">Paid Payment</span>
                        <span className="font-bold">{Number(invoice.paid_amount || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-black">
                        <span className="font-bold">Due</span>
                        <span className="font-bold">{(netTotal - (invoice.paid_amount || 0)).toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* In Words */}
            <div className="text-xs font-bold mb-2">
                In Words : {amountInWords.toLowerCase()} Taka Only .
            </div>

            {/* Note */}
            {settings.show_note && invoice.note && (
                <div className="mb-2 text-xs">
                    <strong>Note:</strong> {invoice.note}
                </div>
            )}

            <div className="text-center mt-4 text-xs">
                <p className="font-black mb-1">Come Again</p>
                <p className="font-normal">{settings.footer_text} 👓</p>
                {settings.show_signature && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs">
                            <div style={{ width: '45%' }}>
                                <div className="border-t border-black pt-1">Customer Signature</div>
                            </div>
                            <div style={{ width: '45%' }}>
                                <div className="border-t border-black pt-1">Authorized Signature</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default InvoicePrint;
