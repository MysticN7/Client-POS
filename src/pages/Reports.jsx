import { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart, Calendar } from 'lucide-react';

export default function Reports() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState(null);
    const [topProducts, setTopProducts] = useState([]);

    useEffect(() => {
        fetchReports();
    }, [startDate, endDate]);

    const fetchReports = async () => {
        try {
            const summaryRes = await api.get(`/reports/sales-summary?startDate=${startDate}&endDate=${endDate}`);
            setSummary(summaryRes.data);

            const productsRes = await api.get('/reports/product-performance');
            setTopProducts(productsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sales Reports</h2>
                <div className="flex space-x-2 items-center bg-white p-2 rounded shadow">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded p-1" />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded p-1" />
                </div>
            </div>

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
                        <p className="text-2xl font-bold text-gray-800">${summary.totalSales.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{summary.transactionCount} transactions</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium">Net Sales (After Discount)</h3>
                        <p className="text-2xl font-bold text-gray-800">${summary.netSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <h3 className="text-gray-500 text-sm font-medium">Total Collected</h3>
                        <p className="text-2xl font-bold text-gray-800">${summary.totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                        <h3 className="text-gray-500 text-sm font-medium">Total Due</h3>
                        <p className="text-2xl font-bold text-red-600">${summary.totalDue.toFixed(2)}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h3 className="text-lg font-bold mb-4 flex items-center"><BarChart className="w-5 h-5 mr-2" /> Top Selling Products</h3>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2">Product</th>
                                <th className="py-2 text-right">Qty Sold</th>
                                <th className="py-2 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((item, index) => (
                                <tr key={index} className="border-b last:border-0">
                                    <td className="py-2">{item.Product?.name}</td>
                                    <td className="py-2 text-right">{item.total_quantity}</td>
                                    <td className="py-2 text-right">${Number(item.total_revenue).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
