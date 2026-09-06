"use client";

import PaystackPop from "@paystack/inline-js";

export default function PayButton() {
  const payWithPaystack = () => {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    if (!publicKey) {
      alert("Paystack public key is missing.");
      return;
    }

    const paystack = new PaystackPop();

    paystack.checkout({
      key: publicKey,
      email: "customer@example.com",
      amount: 5000,
      currency: "GHS",
    });
  };

  return (
    <button onClick={payWithPaystack}>
      Upgrade for premium access
    </button>
  );
}