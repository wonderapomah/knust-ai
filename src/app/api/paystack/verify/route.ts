import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is missing" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is missing" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return NextResponse.json(
        { error: result.message || "Payment verification failed" },
        { status: 400 }
      );
    }

    const transaction = result.data;

    if (
      transaction.status !== "success" ||
      transaction.currency !== "GHS" ||
      transaction.amount !== 5000
    ) {
      return NextResponse.json(
        { error: "Payment was not successful or is invalid" },
        { status: 400 }
      );
    }

    const email = transaction.customer.email.toLowerCase();

    await redis.set(
      `premium:${email}`,
      {
        email,
        plan: "premium",
        paymentReference: reference,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      {
        ex: 30 * 24 * 60 * 60,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}