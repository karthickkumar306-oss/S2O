"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  customer: string;
  mobile: string;
  items: any[];
  total: number;
  status: "New" | "Preparing" | "Ready" | "Completed";
  createdAt: string;
};

export default function Dashboard() {
  const [order, setOrder] = useState<Order | null>(null);

useEffect(() => {
  const loadLatestOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Dashboard order error:", error);
      return;
    }

    if (data) {
      setOrder({
        id: data.id,
        customer: data.customer,
        mobile: data.mobile || "",
        items: Array.isArray(data.items)
          ? data.items
          : Object.values(data.items || {}),
        total: Number(data.total),
        status: data.status,
        createdAt: data.created_at,
      });
    }
  };

  loadLatestOrder();

  const channel = supabase
    .channel("orders-dashboard")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        if (
          payload.eventType === "INSERT" ||
          payload.eventType === "UPDATE"
        ) {
          const data = payload.new as any;

          setOrder({
            id: data.id,
            customer: data.customer,
            mobile: data.mobile || "",
            items: Array.isArray(data.items)
              ? data.items
              : Object.values(data.items || {}),
            total: Number(data.total),
            status: data.status,
            createdAt: data.created_at,
          });
        }
      }
    )
    .subscribe((status) => {
      console.log("Orders realtime:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const updateStatus = (
    status: "New" | "Preparing" | "Ready" | "Completed"
  ) => {
    if (!order) return;

    const updatedOrder = {
      ...order,
      status,
    };

    setOrder(updatedOrder);
    localStorage.setItem(
      "s2o-latest-order",
      JSON.stringify(updatedOrder)
    );
  };

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Header */}
      <header className="bg-zinc-950 px-6 py-6 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
            S2O Vendor
          </p>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">
                Street Bites
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Order Management
              </p>
            </div>

            <div className="rounded-full bg-green-500/15 px-4 py-2 text-sm font-bold text-green-400">
              ● OPEN
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-8">

        {/* Dashboard title */}
        <div className="mb-6">
          <h2 className="text-2xl font-black">
            Incoming Order
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Orders placed by your customers will appear here.
          </p>

          <Link
            href="/dashboard/qr"
            className="mt-4 inline-flex rounded-xl bg-zinc-950 px-4 py-3 text-sm font-black text-white"
          >
            Cart QR setup →
          </Link>
        </div>

        {!order ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🛒</div>

            <h3 className="mt-4 text-xl font-black">
              No orders yet
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              Place an order from the customer menu to see it here.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm">

            {/* Order top */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Order Number
                </p>

                <h3 className="mt-1 text-3xl font-black text-orange-500">
                  #{order.id}
                </h3>

                <p className="mt-2 font-bold">
                  {order.customer}
                </p>

                <p className="text-sm text-zinc-500">
                  📞 {order.mobile}
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-black ${
                  order.status === "New"
                    ? "bg-orange-100 text-orange-600"
                    : order.status === "Preparing"
                    ? "bg-blue-100 text-blue-600"
                    : order.status === "Ready"
                    ? "bg-green-100 text-green-600"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {order.status}
              </div>
            </div>

            {/* Items */}
            <div className="mt-7 rounded-2xl bg-zinc-50 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Ordered Items
              </p>

              <div className="space-y-3">
                {(Array.isArray(order.items)
  ? order.items
  : Object.values(order.items || {})
).map((item: any, index) => {
                  const name =
                    item.name ||
                    item.title ||
                    item.item?.name ||
                    "Food Item";

                  const quantity =
                    item.quantity ||
                    item.qty ||
                    item.count ||
                    1;

                  const price =
                    item.price ||
                    item.item?.price ||
                    0;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-zinc-200 pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-bold">
                          {name}
                        </p>

                        <p className="text-sm text-zinc-500">
                          Quantity: {quantity}
                        </p>
                      </div>

                      <p className="font-black">
                        ₹{Number(price) * Number(quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-5">
              <span className="text-lg font-bold">
                Total
              </span>

              <span className="text-3xl font-black text-orange-500">
                ₹{order.total}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-6">

              {order.status === "New" && (
                <button
                  onClick={() => updateStatus("Preparing")}
                  className="w-full rounded-2xl bg-orange-500 px-5 py-4 font-black text-white"
                >
                  Accept Order & Start Preparing
                </button>
              )}

              {order.status === "Preparing" && (
                <button
                  onClick={() => updateStatus("Ready")}
                  className="w-full rounded-2xl bg-zinc-950 px-5 py-4 font-black text-white"
                >
                  Mark Order Ready
                </button>
              )}

              {order.status === "Ready" && (
                <button
                  onClick={() => updateStatus("Completed")}
                  className="w-full rounded-2xl bg-green-600 px-5 py-4 font-black text-white"
                >
                  Complete Order ✓
                </button>
              )}

              {order.status === "Completed" && (
                <div className="rounded-2xl bg-green-50 p-4 text-center font-black text-green-600">
                  Order Completed ✓
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="pb-8 text-center text-xs text-zinc-400">
        Powered by S2O • Digital Ordering
      </footer>
    </main>
  );
}