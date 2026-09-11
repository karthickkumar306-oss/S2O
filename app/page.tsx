"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const categories = ["All", "Rolls", "Burgers", "Snacks", "Drinks"];

const menuItems = [
  {
    id: 1,
    name: "Chicken Roll",
    description: "Spicy chicken, onion & sauces",
    price: 120,
    category: "Rolls",
    emoji: "🌯",
  },
  {
    id: 2,
    name: "Paneer Roll",
    description: "Paneer, vegetables & special sauce",
    price: 100,
    category: "Rolls",
    emoji: "🌯",
  },
  {
    id: 3,
    name: "Chicken Burger",
    description: "Crispy chicken & fresh vegetables",
    price: 150,
    category: "Burgers",
    emoji: "🍔",
  },
  {
    id: 4,
    name: "French Fries",
    description: "Crispy golden fries",
    price: 80,
    category: "Snacks",
    emoji: "🍟",
  },
  {
    id: 5,
    name: "Masala Fries",
    description: "Fries with our special masala",
    price: 100,
    category: "Snacks",
    emoji: "🍟",
  },
  {
    id: 6,
    name: "Cold Drink",
    description: "Chilled refreshing drink",
    price: 50,
    category: "Drinks",
    emoji: "🥤",
  },
];

type Cart = Record<number, number>;

export default function Home() {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Cart>({});
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");

  const [dbMenuItems, setDbMenuItems] = useState<any[]>([]);
const [menuLoading, setMenuLoading] = useState(true);

const cartId =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("cartId") ||
      "street-bites-main"
    : "street-bites-main";
useEffect(() => {
  const loadMenu = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("cart_id", cartId)
      .eq("available", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Menu loading error:", error);
      setMenuLoading(false);
      return;
    }

    setDbMenuItems(data || []);
    setMenuLoading(false);
  };

  loadMenu();
}, []);


const [orderStatus, setOrderStatus] = useState<
  "New" | "Preparing" | "Ready" | "Completed"
>("New");
 const displayMenuItems =
  dbMenuItems.length > 0
    ? dbMenuItems.map((item, index) => ({
        id: index + 1,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        category: item.category,
        emoji: item.emoji,
      }))
    : menuItems;

const filteredItems =
  category === "All"
    ? displayMenuItems
    : displayMenuItems.filter((item) => item.category === category);
 
      useEffect(() => {
 if (!orderPlaced || !orderId) return;

  const channel = supabase
    .channel("customer-order-status")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        const updatedOrder = payload.new as {
          status: "New" | "Preparing" | "Ready" | "Completed";
        };

        setOrderStatus(updatedOrder.status);
      }
    )
    .subscribe((status) => {
      console.log("Customer order realtime:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [orderPlaced, orderId]);
  const cartItems = useMemo(() => {
    return menuItems.filter((item) => cart[item.id]);
  }, [cart]);

  const totalItems = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * cart[item.id],
    0
  );

  const addToCart = (id: number) => {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  };

  const decreaseItem = (id: number) => {
    setCart((current) => {
      const updated = { ...current };

      if (updated[id] === 1) {
        delete updated[id];
      } else {
        updated[id] = updated[id] - 1;
      }

      return updated;
    });
  };

  const removeItem = (id: number) => {
    setCart((current) => {
      const updated = { ...current };
      delete updated[id];
      return updated;
    });
  };
const placeOrder = async () => {
  if (!customerName.trim()) {
    alert("Please enter your name.");
    return;
  }

  if (mobile.length !== 10) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  const order = {
    id: `S2O-${Date.now().toString().slice(-6)}`,
    customer: customerName,
    mobile: mobile,
    items: cart,
    total: subtotal,
    status: "New",
    createdAt: new Date().toISOString(),
  };

const { data, error } = await supabase
  .from("orders")
  .insert({
    customer: customerName,
    mobile: mobile,
    items: cart,
    total: subtotal,
    status: "New",
  })
  .select("id")
  .single();

  if (error) {
    console.error(
  "Order save error:",
  error.message,
  error.details,
  error.hint,
  error.code
);
    alert("Could not place order. Please try again.");
    return;
  }

localStorage.setItem("s2o-latest-order", JSON.stringify(...));

setOrderId(data.id);
setOrderPlaced(true);
};

  /* ORDER CONFIRMATION */
  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-zinc-50 px-5 text-zinc-900">
        <section className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <span className="text-5xl text-green-600">✓</span>
          </div>

          <p className="mt-7 text-sm font-bold uppercase tracking-[0.25em] text-green-600">
            Order Confirmed
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Thank you, {customerName}! 👋
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">
            Your order has been received by Street Bites.
            Please wait while your food is being prepared.
          </p>

          {/* Order Number */}
          <div className="mt-8 w-full rounded-3xl bg-zinc-950 p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Your Order Number
            </p>

            <p className="mt-2 text-4xl font-black text-orange-500">
              #S2O-1001
            </p>

            <div className="my-5 border-t border-zinc-800" />

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Items</span>
              <span className="font-bold">{totalItems}</span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-zinc-400">Total</span>
              <span className="font-black">₹{subtotal}</span>
            </div>
          </div>

          {/* Status */}
          <div className="mt-5 w-full rounded-2xl bg-white p-5 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Order Status
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                🍳
              </div>

              <div>
                <p className="font-black">Preparing your order</p>
                <p className="text-xs text-zinc-500">
                  The food cart has received your order.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setOrderPlaced(false);
              setShowCart(false);
              setCart({});
              setCustomerName("");
              setMobile("");
            }}
            className="mt-7 w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white transition active:scale-95"
          >
            Order More Food
          </button>

          <p className="mt-6 text-xs text-zinc-400">
            Digital ordering by{" "}
            <span className="font-bold text-zinc-700">S2O</span>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 text-zinc-900">
      {/* Header */}
      <header className="bg-zinc-950 px-5 pb-6 pt-6 text-white">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                Powered by S2O
              </p>

              <h1 className="mt-1 text-2xl font-black">
                S2O<span className="text-orange-500">.</span>
              </h1>
            </div>

            <div className="rounded-full bg-green-500/15 px-3 py-2 text-xs font-bold text-green-400">
              ● OPEN
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-3xl font-black">
              Street Bites 🍔
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Fresh food. Fast service.
            </p>
          </div>
        </div>
      </header>

      {/* MENU */}
      {!showCart && (
        <section className="mx-auto max-w-lg px-5 pt-6">
          <div className="rounded-2xl bg-orange-500 p-5 text-white shadow-lg shadow-orange-100">
            <p className="text-sm font-semibold text-orange-100">
              Welcome 👋
            </p>

            <h3 className="mt-1 text-xl font-black">
              What would you like today?
            </h3>

            <p className="mt-1 text-xs text-orange-100">
              Order directly from the cart — no waiting in line.
            </p>
          </div>

          {/* Categories */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold ${
                  category === item
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 shadow-sm"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Menu */}
          <div className="mt-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black">Menu</h3>

              <span className="text-xs text-zinc-400">
                {filteredItems.length} items
              </span>
            </div>

            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-4xl">
                    {item.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-black">{item.name}</h4>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {item.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-black">
                        ₹{item.price}
                      </span>

                      {cart[item.id] ? (
                        <div className="flex items-center gap-2 rounded-xl bg-orange-50 p-1">
                          <button
                            onClick={() => decreaseItem(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-black"
                          >
                            −
                          </button>

                          <span className="w-5 text-center text-sm font-black">
                            {cart[item.id]}
                          </span>

                          <button
                            onClick={() => addToCart(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 font-black text-white"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CART */}
      {showCart && (
        <section className="mx-auto max-w-lg px-5 pt-6">
          <button
            onClick={() => setShowCart(false)}
            className="mb-5 text-sm font-bold text-zinc-500"
          >
            ← Back to Menu
          </button>

          <h2 className="text-3xl font-black">
            Your Cart 🛒
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {totalItems} item{totalItems !== 1 ? "s" : ""} selected
          </p>

          <div className="mt-6 space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                    {item.emoji}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-black">{item.name}</h3>

                    <p className="text-sm text-zinc-500">
                      ₹{item.price} × {cart[item.id]}
                    </p>
                  </div>

                  <p className="font-black">
                    ₹{item.price * cart[item.id]}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-bold text-red-500"
                  >
                    Remove
                  </button>

                  <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-1">
                    <button
                      onClick={() => decreaseItem(item.id)}
                      className="h-8 w-8 rounded-lg bg-white font-black"
                    >
                      −
                    </button>

                    <span className="w-5 text-center font-black">
                      {cart[item.id]}
                    </span>

                    <button
                      onClick={() => addToCart(item.id)}
                      className="h-8 w-8 rounded-lg bg-orange-500 font-black text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Details */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black">
              Customer Details
            </h3>

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="mt-4 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            />

            <input
              value={mobile}
              onChange={(e) =>
                setMobile(
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="10-digit mobile number"
              inputMode="numeric"
              className="mt-3 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            />
          </div>

          {/* Total */}
          <div className="mt-4 rounded-2xl bg-zinc-950 p-5 text-white">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="my-4 border-t border-zinc-800" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-black">Total</span>

              <span className="text-2xl font-black text-orange-500">
                ₹{subtotal}
              </span>
            </div>

            <button
              onClick={placeOrder}
              className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white"
            >
              Place Order →
            </button>
          </div>
        </section>
      )}

      {/* Floating Cart */}
      {!showCart && totalItems > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-lg -translate-x-1/2">
          <button
            onClick={() => setShowCart(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-white shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
                🛒
              </div>

              <div className="text-left">
                <p className="text-xs text-zinc-400">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </p>

                <p className="font-black">View Cart</p>
              </div>
            </div>

            <span className="font-black">
              ₹{subtotal} →
            </span>
          </button>
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-zinc-400">
        Digital ordering by{" "}
        <span className="font-bold text-zinc-700">S2O</span>
      </footer>
    </main>
  );
}