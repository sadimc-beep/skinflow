export default function InventoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="p-6 sm:p-8 max-w-[1600px] mx-auto">
            <div className="bg-transparent rounded-xl">
                {children}
            </div>
        </div>
    );
}
