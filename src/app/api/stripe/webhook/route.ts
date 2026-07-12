import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { markPaid } from "@/lib/db";

export const runtime = "nodejs";

// Stripe -> us. Source of truth for granting access. Verifies the signature,
// then on a completed checkout marks the referenced user as paid. Public
// (no session); Stripe authenticates via the webhook signature.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      client_reference_id: string | null;
      payment_status?: string;
    };
    const userId = Number(session.client_reference_id);
    if (userId && session.payment_status !== "unpaid") {
      markPaid(userId, session.id);
    }
  }

  return NextResponse.json({ received: true });
}
