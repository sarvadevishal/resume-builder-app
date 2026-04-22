import { getStripeClient } from "@/lib/services/stripe";

export async function POST(request) {
  const stripe = getStripeClient();

  if (!stripe) {
    return new Response("Stripe not configured", { status: 400 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      return new Response("ok");
    }

    return new Response("ignored");
  } catch (error) {
    return new Response(error.message, { status: 400 });
  }
}
