"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

const createCartId = () =>
  `cart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export default function CartQrSetup() {
  const [cartId, setCartId] = useState("street-bites-main");
  const [origin, setOrigin] = useState("");
  const [publicOrigin, setPublicOrigin] = useState("");

  useEffect(() => {
    const currentOrigin = window.location.origin;
    setOrigin(currentOrigin);
    setPublicOrigin(currentOrigin);
  }, []);

  const cleanCartId = useMemo(
    () => cartId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || "new-cart",
    [cartId]
  );
  const qrOrigin = publicOrigin.trim().replace(/\/$/, "") || origin;
  const cartUrl = qrOrigin ? `${qrOrigin}/cart/${cleanCartId}` : `/cart/${cleanCartId}`;

  return (
    <main className="min-h-screen bg-zinc-100 px-5 py-8 text-zinc-900">
      <section className="mx-auto max-w-lg">
        <Link href="/dashboard" className="text-sm font-bold text-zinc-500">
          ← Back to dashboard
        </Link>

        <header className="mt-6 rounded-3xl bg-zinc-950 p-7 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
            S2O Vendor
          </p>
          <h1 className="mt-2 text-3xl font-black">Cart QR setup</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Give each food cart its own QR. Customers scan it to open the Street Bites menu.
          </p>
        </header>

        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">
          <label className="text-sm font-black" htmlFor="cart-id">
            Cart ID
          </label>
          <input
            id="cart-id"
            value={cartId}
            onChange={(event) => setCartId(event.target.value)}
            className="mt-3 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            placeholder="e.g. street-bites-main"
          />
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Use a different ID for every cart, such as <span className="font-bold">street-bites-2</span>.
          </p>

          <button
            onClick={() => setCartId(createCartId())}
            className="mt-4 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white"
          >
            Generate unique cart ID
          </button>

          <label className="mt-5 block text-sm font-black" htmlFor="public-url">
            Public app URL
          </label>
          <input
            id="public-url"
            value={publicOrigin}
            onChange={(event) => setPublicOrigin(event.target.value)}
            className="mt-3 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            placeholder="https://your-app.example.com"
          />
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            For a phone test on Wi-Fi, replace localhost with your computer&apos;s local network address.
          </p>
        </div>

        <div className="mt-5 rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto inline-flex rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <QRCodeSVG value={cartUrl} size={220} level="M" includeMargin />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Customer menu link
          </p>
          <a
            href={cartUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block break-all text-sm font-bold text-orange-600 underline"
          >
            {cartUrl}
          </a>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Print or display this QR at the selected cart. The link opens the same ordering menu customers already use.
          </p>
        </div>
      </section>
    </main>
  );
}
