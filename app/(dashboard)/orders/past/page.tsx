import OrdersTable from "@/components/shared/OrdersTable";

export default function PastOrdersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Past Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Delivered, completed, cancelled and refunded orders
        </p>
      </div>
      <OrdersTable type="past" />
    </div>
  );
}
