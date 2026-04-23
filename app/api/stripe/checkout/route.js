import { NextResponse } from "next/server";
import { createCheckout } from "@/lib/services/stripe";

export async function POST(request) {
  try {
    const body = await request.json();

    if (typeof body.customerEmail !== "string" || !body.customerEmail.trim()) {
      return NextResponse.json(
        {
          error: "Sign in before starting checkout."
        },
        { status: 400 }
      );
    }

    const session = await createCheckout({
      priceId: body.priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
      customerEmail: body.customerEmail
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 400 }
    );
  }
}
