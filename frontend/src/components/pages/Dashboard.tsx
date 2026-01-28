import React from 'react';

const Dashboard: React.FC = () => {
    const mockStats = [
        { id: 1, label: 'Total Sales', value: '$12,450', change: '+12%' },
        { id: 2, label: 'Active Users', value: '1,205', change: '+5%' },
        { id: 3, label: 'New Signups', value: '48', change: '-2%' },
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Test Dashboard</h1>
                <p className="text-gray-600">Welcome back to your performance overview.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {mockStats.map((stat) => (
                    <div key={stat.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                        <div className="flex items-baseline mt-2">
                            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                            <span className={`ml-2 text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
                </div>
                <div className="p-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 text-sm uppercase">
                                <th className="pb-4 font-medium">User</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium">Date</th>
                                <th className="pb-4 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 divide-y divide-gray-100">
                            <tr>
                                <td className="py-4">John Doe</td>
                                <td className="py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span></td>
                                <td className="py-4">Oct 24, 2023</td>
                                <td className="py-4 text-right font-medium text-gray-900">$250.00</td>
                            </tr>
                            <tr>
                                <td className="py-4">Jane Smith</td>
                                <td className="py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span></td>
                                <td className="py-4">Oct 23, 2023</td>
                                <td className="py-4 text-right font-medium text-gray-900">$1,200.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
