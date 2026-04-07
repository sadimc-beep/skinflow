export default function InventoryDashboardPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-medium text-slate-500 text-sm">Active Requisitions</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-medium text-slate-500 text-sm">Low Stock Alerts</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">4</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-medium text-slate-500 text-sm">Total Products</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2">142</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Stock Movements</h3>
                <div className="text-slate-500 text-center py-8">
                    Data table coming soon.
                </div>
            </div>
        </div>
    );
}
