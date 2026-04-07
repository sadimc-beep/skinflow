"use client";

import { useState } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

type CartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
};

export function PosClient() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const dummyProducts = [
        { id: 101, name: "Hyaluronic Acid Serum", price: 45.00, stock: 12 },
        { id: 102, name: "SPF 50 Sunscreen", price: 32.50, stock: 8 },
        { id: 103, name: "Retinol Night Cream", price: 85.00, stock: 4 },
        { id: 104, name: "Gentle Cleanser", price: 24.00, stock: 15 },
    ].filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
    };

    const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setCart([]);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-5 h-[calc(100vh-12rem)] min-h-[600px]">
            {/* Product grid */}
            <div className="flex-1 flex flex-col bg-[#F7F3ED] border border-[#E8E1D6] rounded-2xl overflow-hidden">
                {/* Search bar */}
                <div className="p-4 border-b border-[#E8E1D6]">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#A0978D]" />
                        <input
                            placeholder="Scan barcode or search products..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#EDE7DC] border border-[#D9D0C5] rounded-xl text-sm text-[#1C1917] placeholder:text-[#A0978D] focus:outline-none focus:ring-1 focus:ring-[#C4A882] transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Product cards */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {dummyProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white border border-[#E8E1D6] rounded-2xl p-4 cursor-pointer hover:border-[#C4A882] hover:shadow-[0_2px_12px_rgba(196,168,130,0.15)] transition-all group flex flex-col justify-between h-28"
                            >
                                <div>
                                    <h4 className="font-semibold text-[#1C1917] text-sm line-clamp-2 leading-tight">{product.name}</h4>
                                    <p className="text-xs text-[#A0978D] mt-1">{product.stock} in stock</p>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-bold text-[#1C1917] text-sm">৳{product.price.toFixed(2)}</span>
                                    <div className="h-6 w-6 rounded-full bg-[#EDE7DC] flex items-center justify-center group-hover:bg-[#1C1917] group-hover:text-[#C4A882] transition-colors">
                                        <Plus className="w-3.5 h-3.5 text-[#78706A] group-hover:text-[#C4A882]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart / Register */}
            <div className="w-full md:w-88 flex flex-col bg-[#F7F3ED] border border-[#E8E1D6] rounded-2xl overflow-hidden" style={{ width: '360px' }}>
                {/* Cart header */}
                <div className="p-4 bg-[#1C1917] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-[#C4A882]" />
                        <h3 className="font-semibold text-[#F7F3ED]">Current Sale</h3>
                    </div>
                    <span className="bg-[#F7F3ED]/15 text-[#F7F3ED] text-xs px-2.5 py-1 rounded-full">{cart.length} items</span>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#A0978D] py-16">
                            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">Cart is empty</p>
                            <p className="text-xs mt-1 text-[#C4A882]">Select products to begin</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex flex-col gap-2 pb-4 border-b border-[#E8E1D6]">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-[#1C1917] text-sm leading-tight pr-4">{item.name}</span>
                                        <span className="font-bold text-[#1C1917] text-sm shrink-0">৳{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border border-[#D9D0C5] rounded-lg bg-white overflow-hidden">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-[#78706A] hover:text-[#1C1917] hover:bg-[#EDE7DC] transition-colors">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="px-3 text-sm font-semibold text-[#1C1917] w-8 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-[#78706A] hover:text-[#1C1917] hover:bg-[#EDE7DC] transition-colors">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-[#C4705A] hover:text-[#B04030] p-1 rounded-lg hover:bg-[#C4705A]/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Totals + Checkout */}
                <div className="p-4 bg-[#EDE7DC] border-t border-[#D9D0C5] space-y-2 shrink-0">
                    <div className="flex justify-between text-sm text-[#78706A]">
                        <span>Subtotal</span><span className="font-medium text-[#1C1917]">৳{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#78706A]">
                        <span>Tax (8%)</span><span className="font-medium text-[#1C1917]">৳{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-[#1C1917] pt-2 border-t border-[#D9D0C5]">
                        <span>Total</span><span>৳{total.toFixed(2)}</span>
                    </div>

                    <button
                        className="w-full mt-3 h-13 flex items-center justify-center gap-2 bg-[#1C1917] hover:bg-[#2E2A25] disabled:opacity-50 disabled:cursor-not-allowed text-[#F7F3ED] rounded-full text-sm font-semibold transition-all duration-200"
                        style={{ height: '52px' }}
                        disabled={cart.length === 0 || isCheckingOut}
                        onClick={handleCheckout}
                    >
                        {isCheckingOut ? "Processing..." : (
                            <>
                                Checkout ৳{total.toFixed(2)}
                                <span className="w-7 h-7 rounded-full bg-[#F7F3ED]/10 flex items-center justify-center">
                                    <ArrowRight className="w-3.5 h-3.5 text-[#C4A882]" />
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
