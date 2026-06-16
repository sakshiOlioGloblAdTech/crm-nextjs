import OrdersTable from "@/components/shared/OrdersTable";

export default function CurrentOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Current Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Orders that are placed, processing or shipped
        </p>
      </div>
      <OrdersTable type="current" />
    </div>
  );
}
