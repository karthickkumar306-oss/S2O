"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MenuItem = {
  id: string;
  cart_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
  available: boolean;
};



export default function MenuManagement() {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Rolls");
  const [emoji, setEmoji] = useState("🍴");

  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Menu load error:", error);
      alert("Could not load menu.");
      return;
    }

    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
const loadVendor = async () => {
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("cart_id", "street-bites-main")
    .maybeSingle();

  if (error || !vendor) {
    console.error("Vendor loading error:", error);
    alert("Vendor account not found.");
    return;
  }

  setCartId(vendor.cart_id);
};

  loadVendor();
}, []);

  useEffect(() => {
    loadItems();
}, [cartId]);

  const clearForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("Rolls");
    setEmoji("🍴");
    setEditingId(null);
  };

  const saveItem = async () => {
    if (!name.trim()) {
      alert("Please enter food name.");
      return;
    }

    if (!price || Number(price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    const itemData = {
      cart_id: cartId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      emoji,
      available: true,
    };

    if (editingId) {
      const { error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingId);

      if (error) {
        console.error(error);
        alert("Could not update item.");
        return;
      }

      alert("Food item updated!");
    } else {
      const { error } = await supabase
        .from("menu_items")
        .insert(itemData);

      if (error) {
        console.error(error);
        alert("Could not add item.");
        return;
      }

      alert("Food item added!");
    }

    clearForm();
    await loadItems();
  };

  const editItem = (item: MenuItem) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setPrice(String(item.price));
    setCategory(item.category || "Rolls");
    setEmoji(item.emoji || "🍴");
  };

  const toggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ available: !item.available })
      .eq("id", item.id);

    if (error) {
      console.error(error);
      alert("Could not change availability.");
      return;
    }

    await loadItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this food item?")) return;

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Could not delete item.");
      return;
    }

    await loadItems();
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-orange-600"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4 rounded-3xl bg-black p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
            S2O Vendor
          </p>
          <h1 className="mt-2 text-3xl font-black">Menu Management</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Manage your food-cart menu.
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            {editingId ? "Edit Food Item" : "Add Food Item"}
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Food name"
              className="rounded-xl border px-4 py-3"
            />

            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              type="number"
              className="rounded-xl border px-4 py-3"
            />

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="rounded-xl border px-4 py-3"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option>Rolls</option>
              <option>Burgers</option>
              <option>Snacks</option>
              <option>Drinks</option>
              <option>Other</option>
            </select>

            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Emoji"
              className="rounded-xl border px-4 py-3"
            />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={saveItem}
              className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
            >
              {editingId ? "Update Item" : "Add Item"}
            </button>

            {editingId && (
              <button
                onClick={clearForm}
                className="rounded-xl border px-6 py-3 font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Your Menu</h2>

          {loading ? (
            <p className="mt-5 text-zinc-500">Loading menu...</p>
          ) : items.length === 0 ? (
            <p className="mt-5 text-zinc-500">No food items yet.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-3xl">
                      {item.emoji}
                    </div>

                    <div>
                      <h3 className="font-black">{item.name}</h3>
                      <p className="text-sm text-zinc-500">
                        {item.description}
                      </p>
                      <p className="mt-1 font-bold">₹{item.price}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`rounded-lg px-3 py-2 text-sm font-bold ${
                        item.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </button>

                    <button
                      onClick={() => editItem(item)}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-bold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}