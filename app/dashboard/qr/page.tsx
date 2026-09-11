"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const createCartId = () =>
  `cart-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export default function CartQrSetup() {
  const [shopName, setShopName] = useState("Street Bites");
  const [cartId, setCartId] = useState("street-bites-main");
  const [publicOrigin, setPublicOrigin] = useState("");

  useEffect(() => {
    setPublicOrigin(window.location.origin);
  }, []);

  const cleanCartId = useMemo(
    () =>
      cartId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    [cartId]
  );

  const qrOrigin = publicOrigin.trim().replace(/\/$/, "");

  const cartUrl =
    qrOrigin && cleanCartId
      ? `${qrOrigin}/cart/${cleanCartId}`
      : "";

 const generateNewCartId = async () => {
  const newCartId = createCartId();

  const { error } = await supabase.from("carts").insert({
    cart_id: newCartId,
    name: shopName,
  });

  if (error) {
    console.error("Cart save error:", error);
    alert("Could not create cart. Please try again.");
    return;
  }

  setCartId(newCartId);
  alert("New cart created successfully!");
};
  const copyLink = async () => {
    if (!cartUrl) return;

    await navigator.clipboard.writeText(cartUrl);
    alert("Customer menu link copied!");
  };

  const printQr = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 print:bg-white">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-zinc-600 hover:text-black"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          {/* Header */}
          <header className="bg-black px-6 py-8 text-white sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
              S2O Vendor
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              QR Code Setup
            </h1>

            <p className="mt-2 max-w-xl text-sm text-zinc-300">
              Create a QR code that customers can scan to open your food cart
              menu and place orders.
            </p>
          </header>

          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-2">
            {/* Settings */}
            <div>
              <h2 className="text-xl font-black text-zinc-900">
                Cart details
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-zinc-700">
                    Food Cart / Shop Name
                  </label>

                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Example: Street Bites"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-zinc-700">
                    Cart ID
                  </label>

                  <input
                    value={cartId}
                    onChange={(e) => setCartId(e.target.value)}
                    placeholder="street-bites-main"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500"
                  />

                  <p className="mt-2 text-xs text-zinc-500">
                    Use a simple ID such as street-bites-main.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-zinc-700">
                    Public App URL
                  </label>

                  <input
                    value={publicOrigin}
                    onChange={(e) => setPublicOrigin(e.target.value)}
                    placeholder="https://s2-o.vercel.app"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-orange-500"
                  />

                  <p className="mt-2 text-xs text-zinc-500">
                    For customers, use your public S2O URL.
                  </p>
                </div>

                <button
                  onClick={generateNewCartId}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 font-bold text-zinc-800 hover:bg-zinc-50"
                >
                  Generate New Cart ID
                </button>
              </div>
            </div>

            {/* QR Preview */}
            <div className="text-center">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Scan to Order
                </p>

                <h2 className="mt-2 text-2xl font-black text-zinc-900">
                  {shopName || "Your Food Cart"}
                </h2>

                <div className="mx-auto mt-6 inline-block rounded-2xl bg-white p-5 shadow-sm">
                  {cartUrl ? (
                    <QRCodeSVG
                      value={cartUrl}
                      size={240}
                      level="M"
                      includeMargin
                    />
                  ) : (
                    <div className="flex h-[240px] w-[240px] items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                      Enter cart details
                    </div>
                  )}
                </div>

                <p className="mt-5 text-sm font-bold text-zinc-700">
                  Scan this QR to open the menu
                </p>

                <div className="mt-4 rounded-xl bg-white p-3 text-left">
                  <p className="text-xs font-bold uppercase text-zinc-400">
                    Customer Menu Link
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-zinc-800">
                    {cartUrl || "Waiting for URL..."}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={copyLink}
                    disabled={!cartUrl}
                    className="rounded-xl bg-zinc-900 px-4 py-3 font-bold text-white disabled:opacity-40"
                  >
                    Copy Link
                  </button>

                  <button
                    onClick={printQr}
                    disabled={!cartUrl}
                    className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-white disabled:opacity-40"
                  >
                    Print QR
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Print section */}
          <div className="border-t border-zinc-200 px-6 py-8 text-center sm:px-10">
            <h3 className="text-xl font-black text-zinc-900">
              Ready for your food cart?
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-500">
              Print this QR code and place it on your counter, table, banner,
              or food cart. Customers can scan it with their phone camera.
            </p>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          nav,
          header,
          button,
          a,
          input,
          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          section {
            max-width: 100% !important;
          }
        }
      `}</style>
    </main>
  );
}