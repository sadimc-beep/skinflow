import Link from 'next/link';
import Image from 'next/image';
import { inventoryApi } from '@/lib/services/inventory';
import { ArrowRight, AlertTriangle, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StoreDashboardPage() {
    let products: any[] = [];
    let pendingOrders: any[] = [];

    try { const r = await inventoryApi.products.list({ limit: 200 }); products = r.results || []; } catch { }
    try { const r = await inventoryApi.purchaseOrders.list({ limit: 100 }); pendingOrders = (r.results || []).filter((o: any) => o.status === 'PENDING' || o.status === 'SENT'); } catch { }

    const stockTracked = products.filter((p: any) => p.is_stock_tracked).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm text-[#A0978D] font-semibold tracking-wide mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h1 className="font-display text-4xl text-[#1C1917] leading-tight tracking-tight">Inventory & Store</h1>
                    <p className="text-[#A0978D] text-sm mt-1">Products, stock levels, and procurement</p>
                </div>
                <Link
                    href="/inventory/purchase-orders"
                    className="inline-flex items-center gap-2 pl-5 pr-4 py-2.5 bg-[#1C1917] hover:bg-[#2E2A25] text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200"
                >
                    <ShoppingBag className="h-4 w-4" />
                    New PO
                    <span className="w-6 h-6 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center ml-1">
                        <ArrowRight className="w-3 h-3 text-[#C4A882]" />
                    </span>
                </Link>
            </div>

            {/* Image module cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ModuleImageCard
                    title="Catalog"
                    stat={products.length}
                    statLabel="total products"
                    description="Products & treatments"
                    href="/inventory/products"
                    image="/card-inventory.jpg"
                />
                <ModuleImageCard
                    title="Stock Levels"
                    stat={stockTracked}
                    statLabel="stock-tracked items"
                    description="Real-time quantities"
                    href="/inventory/stock"
                    image="/card-clinical.jpg"
                />
            </div>

            {/* Secondary stat strips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatStrip label="Total Products" value={products.length} />
                <StatStrip label="Stock Tracked" value={stockTracked} />
                <StatStrip label="Pending POs" value={pendingOrders.length} />
            </div>

            {/* Nav rows */}
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A0978D] mb-3">Navigate</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: 'Catalog', desc: 'Products, treatments & retail items', href: '/inventory/products' },
                        { title: 'Stock Levels', desc: 'Current inventory quantities', href: '/inventory/stock' },
                        { title: 'Purchase Orders', desc: 'Order from vendors', href: '/inventory/purchase-orders' },
                        { title: 'Receive Stock (GRN)', desc: 'Confirm received deliveries', href: '/inventory/grn' },
                        { title: 'Vendors', desc: 'Supplier management', href: '/inventory/vendors' },
                        { title: 'Requisitions', desc: 'Internal stock requests', href: '/inventory/requisitions' },
                    ].map(card => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group flex items-center justify-between bg-[#F7F3ED] border border-[#E8E1D6] hover:border-[#D9D0C5] hover:bg-[#EDE7DC] rounded-2xl px-5 py-4 transition-all duration-200"
                        >
                            <div>
                                <p className="font-semibold text-[#1C1917] text-sm">{card.title}</p>
                                <p className="text-xs text-[#A0978D] mt-0.5">{card.desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-[#C4A882] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Pending PO alert */}
            {pendingOrders.length > 0 && (
                <div className="flex items-center justify-between bg-[#F7F3ED] border border-[#E8E1D6] rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-[#C4705A] shrink-0" />
                        <span className="text-sm font-semibold text-[#1C1917]">{pendingOrders.length} purchase orders pending approval</span>
                    </div>
                    <Link href="/inventory/purchase-orders" className="text-sm font-semibold text-[#C4A882] hover:text-[#1C1917] flex items-center gap-1 transition">
                        Review <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}

function ModuleImageCard({ title, stat, statLabel, description, href, image }: {
    title: string; stat: string | number; statLabel: string; description: string; href: string; image: string;
}) {
    return (
        <Link href={href} className="group block relative overflow-hidden rounded-2xl" style={{ paddingBottom: '55%' }}>
            <Image src={image} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="50vw" />
            <div className="absolute inset-0 card-scrim" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-[#1C1917] rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[#F7F3ED] font-display text-2xl font-normal leading-none stat-number">{stat}</p>
                        <p className="text-[#A0978D] text-xs mt-1">{statLabel}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[#F7F3ED] text-sm font-semibold">{title}</p>
                        <p className="text-[#78706A] text-xs mt-0.5">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#C4A882] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </Link>
    );
}

function StatStrip({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col gap-1 px-5 py-4 bg-[#1C1917]/5 rounded-xl">
            <p className="font-display text-3xl text-[#1C1917] stat-number leading-none">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78706A]">{label}</p>
        </div>
    );
}
