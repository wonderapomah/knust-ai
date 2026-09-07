import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is missing." },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack secret key is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    const transaction = data.data;

    const paymentIsSuccessful =
      transaction.status === "success" &&
      transaction.currency === "GHS" &&
      transaction.amount === 5000;

    if (!paymentIsSuccessful) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment was not successful or the amount is incorrect.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      reference: transaction.reference,
      email: transaction.customer?.email,
      amount: transaction.amount,
      currency: transaction.currency,
    });
  } catch (error) {
    console.error("Paystack verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while verifying payment.",
      },
      { status: 500 }
    );
  }
}