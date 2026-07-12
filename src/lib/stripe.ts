// Stripe integration for the one-time "full access" fee. NODE-RUNTIME ONLY.
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  _stripe = new Stripe(key);
  return _stripe;
}

// Full-access price, in USD cents. K2,500 ≈ US$625 (env-overridable).
export function priceCents(): number {
  const n = Number(process.env.STRIPE_PRICE_USD_CENTS);
  return Number.isFinite(n) && n > 0 ? n : 62500;
}

export const PRICE_LABEL = "US$625";
