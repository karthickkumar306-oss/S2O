import { redirect } from "next/navigation";

type CartPageProps = {
  params: Promise<{ cartId: string }>;
};

/**
 * A cart QR code opens this route. The menu itself remains in the existing
 * customer page so cart scanning and ordinary customer ordering use one flow.
 */
export default async function CartPage({ params }: CartPageProps) {
  await params;
  redirect("/");
}
