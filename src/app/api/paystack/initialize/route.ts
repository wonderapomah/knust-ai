import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is not configured" },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: 5000,
          currency: "GHS",
          callback_url: `${appUrl}/payment-success`,
          metadata: {
            plan: "premium",
            duration: 30,
          },
        }),
      }
    );

    const data = await paystackResponse.json();

    if (!paystackResponse.ok || !data.status) {
      return NextResponse.json(
        {
          error:
            data.message || "Paystack could not initialize the transaction",
        },
        { status: paystackResponse.status || 400 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);

    return NextResponse.json(
      { error: "Internal server error while initializing payment" },
      { status: 500 }
    );
  }
}