import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

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

    // Verify the transaction with Paystack
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

    // Confirm the payment details
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

    const customerEmail = transaction.customer?.email;

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer email was not found.",
        },
        { status: 400 }
      );
    }

    // Give the customer premium access for 30 days
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const userKey = `premium:${customerEmail.toLowerCase()}`;

    await redis.set(
      userKey,
      {
        email: customerEmail.toLowerCase(),
        plan: "premium",
        paymentReference: transaction.reference,
        expiresAt,
      },
      {
        ex: 30 * 24 * 60 * 60,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified and premium access activated.",
      email: customerEmail,
      expiresAt,
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