import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is missing");

      return NextResponse.json(
        { error: "Paystack secret key is not configured" },
        { status: 500 }
      );
    }

    const amount = 5000; // GHS 50.00, converted to pesewas

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          currency: "GHS",
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
          metadata: {
            plan: "premium",
            duration: 30,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack initialization error:", data);

      return NextResponse.json(
        {
          error:
            data?.message || "Unable to initialize Paystack payment",
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Initialize payment error:", error);

    return NextResponse.json(
      { error: "Something went wrong while starting payment" },
      { status: 500 }
    );
  }
}