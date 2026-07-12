import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStripe, stripeConfigured, priceCents } from "@/lib/stripe";

export const runtime = "nodejs";

// Creates a Stripe Checkout session for the one-time full-access fee.
// Requires a logged-in account (guests are prompted to register first).
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to pay." }, { status: 401 });
  }
  if (user.paid || user.is_admin) {
    return NextResponse.json({ alreadyPaid: true });
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Online payment isn't available yet." }, { status: 503 });
  }

  const base = (process.env.APP_URL || "https://smartelectorates.com").replace(/\/$/, "");
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(user.id),
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: priceCents(),
            product_data: {
              name: "Smart Electorates — Full Access",
              description: "One-time fee for complete, permanent access (K2,500).",
            },
          },
        },
      ],
      success_url: `${base}/access/success?s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/access`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
