import Stripe from "stripe";

let stripeClient;

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export async function createCheckout({ priceId, customerEmail }) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  if (!priceId) {
    throw new Error("A Stripe price is required to start checkout.");
  }

  if (!customerEmail?.trim()) {
    throw new Error("A signed-in customer email is required to start checkout.");
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail.trim().toLowerCase(),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`
  });
}
