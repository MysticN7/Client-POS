import { useState, useEffect } from 'react';
import api from '../api/axios';
import { BarChart, Calendar, TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';

export default function Reports() {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [summary, setSummary] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch initial data on mount
    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = dateRange;

            // Fetch sales summary
            const summaryRes = await api.get('/reports/sales-summary', {
                params: { startDate, endDate }
            });
            setSummary(summaryRes.data);

            // Fetch top products with date range
            const productsRes = await api.get('/reports/product-performance', {
                params: { startDate, endDate, limit: 10 }
            });
            setTopProducts(productsRes.data);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        fetchReports();
    };

    return (
        <div className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Sales Reports</h2>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow w-full sm:w-auto">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="border rounded p-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 w-full sm:w-auto"
                    />
                    <span className="dark:text-gray-300 text-sm">to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="border rounded p-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 w-full sm:w-auto"
                    />
                    <button
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm w-full sm:w-auto"
                    >
                        {loading ? 'Loading...' : 'Generate'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500 dark:text-gray-300">Loading reports...</div>
                </div>
            ) : !summary ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500 dark:text-gray-300">Select date range and click "Generate" to view reports</div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-medium">Total Sales</h3>
                                <DollarSign className="w-5 h-5 text-blue-500" />
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">৳{summary.totalSales.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{summary.transactionCount} transactions</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border-l-4 border-green-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-medium">Net Sales</h3>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">৳{summary.netSales.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">After discounts</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border-l-4 border-purple-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-medium">Total Collected</h3>
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">৳{summary.totalPaid.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Received payments</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border-l-4 border-red-500">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm font-medium">Total Due</h3>
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">৳{summary.totalDue.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Outstanding balance</p>
                        </div>
                    </div>

                    {/* Top Selling Products */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
                        <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center text-gray-800 dark:text-gray-100">
                            <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                            Top Selling Products
                        </h3>
                        {topProducts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No product sales data for this period
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                            <th className="py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-200">#</th>
                                            <th className="py-3 px-2 sm:px-4 font-semibold text-gray-700 dark:text-gray-200">Product</th>
                                            <th className="py-3 px-2 sm:px-4 text-right font-semibold text-gray-700 dark:text-gray-200">Qty Sold</th>
                                            <th className="py-3 px-2 sm:px-4 text-right font-semibold text-gray-700 dark:text-gray-200">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProducts.map((item, index) => (
                                            <tr key={index} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="py-3 px-2 sm:px-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                                                <td className="py-3 px-2 sm:px-4 font-medium text-gray-800 dark:text-gray-100">
                                                    {item.productName || 'Unknown Product'}
                                                    {item.sku && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({item.sku})</span>}
                                                </td>
                                                <td className="py-3 px-2 sm:px-4 text-right text-gray-700 dark:text-gray-300">{item.totalQuantity}</td>
                                                <td className="py-3 px-2 sm:px-4 text-right font-semibold text-green-600 dark:text-green-400">৳{Number(item.totalRevenue).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
