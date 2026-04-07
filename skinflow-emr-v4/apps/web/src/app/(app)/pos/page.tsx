import { PosClient } from "@/components/pos/PosClient";
import { ShoppingCart, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function StorePosPage() {
    const now = format(new Date(), 'EEEE, MMMM d · h:mm a');
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        Point of Sale
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5 ml-13">
                        <Clock className="h-3.5 w-3.5" /> {now}
                    </p>
                </div>
            </div>
            <PosClient />
        </div>
    );
}
