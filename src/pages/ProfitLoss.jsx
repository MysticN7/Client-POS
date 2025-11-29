import { useState, useEffect } from 'react';
import api from '../api/axios';
import { TrendingUp, TrendingDown, Banknote, PieChart } from 'lucide-react';

export default function ProfitLoss() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchProfitLoss = async () => {
        if (!dateRange.startDate || !dateRange.endDate) {
            console.log('Missing date range');
            return;
        }

        setLoading(true);
        console.log('Fetching profit/loss report with date range:', dateRange);
        try {
            console.log('Making API request to /reports/profit-loss');
            const { data: reportData } = await api.get('/reports/profit-loss', {
                params: dateRange
            });
            console.log('Received profit/loss data:', reportData);
            setData(reportData);
        } catch (error) {
            console.error('Error fetching profit/loss:', error);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        fetchProfitLoss();
    };

    const grossProfit = (data?.totalRevenue || 0) - (data?.cogs || 0);
    const netProfit = grossProfit - (data?.totalExpenses || 0);
    const profitMargin = data?.totalRevenue ? ((netProfit / data.totalRevenue) * 100).toFixed(2) : 0;

    return (
        <div className="p-2 sm:p-4">
            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Profit & Loss Statement</h2>

                {/* Date Range Selector */}
                <div className="bg-white dark:bg-gray-800 dark:text-gray-100 p-3 sm:p-4 rounded-lg shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-sm"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded p-2 text-sm"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 touch-manipulation"
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-4 flex justify-center items-center h-64">
                    <div className="text-gray-500 dark:text-gray-300">Loading...</div>
                </div>
            ) : !data ? (
                <div className="p-4 flex justify-center items-center h-64">
                    <div className="text-gray-500 dark:text-gray-300">Select date range and click "Generate Report" to view data</div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 font-medium">Total Revenue</p>
                                    <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-200">৳{(data?.totalRevenue || 0).toFixed(2)}</p>
                                </div>
                                <Banknote className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-300 font-medium">Total Expenses</p>
                                    <p className="text-lg sm:text-2xl font-bold text-orange-700 dark:text-orange-200">৳{(data?.totalExpenses || 0).toFixed(2)}</p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border ${netProfit >= 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs sm:text-sm font-medium ${netProfit >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>Net Profit</p>
                                    <p className={`text-lg sm:text-2xl font-bold ${netProfit >= 0 ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}`}>
                                        ৳{Math.abs(netProfit).toFixed(2)}
                                    </p>
                                </div>
                                {netProfit >= 0 ? <TrendingUp className="w-8 h-8 text-green-600" /> : <TrendingDown className="w-8 h-8 text-red-600" />}
                            </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300 font-medium">Profit Margin</p>
                                    <p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-200">{profitMargin}%</p>
                                </div>
                                <PieChart className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Statement */}
                    <div className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow overflow-hidden">
                        <div className="p-4 sm:p-6">
                            <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Income Statement</h3>

                            {/* Revenue Section */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center py-2 border-b-2 border-gray-300 dark:border-gray-700">
                                    <span className="font-bold text-gray-700 dark:text-gray-200">Revenue</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-200">৳{(data?.totalRevenue || 0).toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-2 mt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Sales Revenue</span>
                                        <span className="dark:text-gray-300">৳{(data?.totalRevenue || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cost of Goods Sold */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">Cost of Goods Sold (COGS)</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">-৳{(data?.cogs || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Gross Profit */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center py-2 bg-gray-50 dark:bg-gray-700 px-2 rounded">
                                    <span className="font-bold text-gray-800 dark:text-gray-100">Gross Profit</span>
                                    <span className={`font-bold ${grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ৳{grossProfit.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Operating Expenses */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center py-2 border-b-2 border-gray-300 dark:border-gray-700">
                                    <span className="font-bold text-gray-700 dark:text-gray-200">Operating Expenses</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">-৳{(data?.totalExpenses || 0).toFixed(2)}</span>
                                </div>
                                <div className="pl-4 space-y-2 mt-2">
                                    {data?.expensesByCategory && Object.entries(data.expensesByCategory).map(([category, amount]) => (
                                        <div key={category} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">{category}</span>
                                            <span className="text-red-600 dark:text-red-400">-৳{parseFloat(amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Net Profit */}
                            <div className="pt-4 border-t-2 border-gray-400 dark:border-gray-600">
                                <div className="flex justify-between items-center py-2 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 px-4 rounded-lg">
                                    <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Net Profit</span>
                                    <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ৳{netProfit.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
