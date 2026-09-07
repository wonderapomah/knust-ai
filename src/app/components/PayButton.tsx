"use client";

import { useState } from "react";

export default function PayButton() {
  const [loading, setLoading] = useState(false);

  const payWithPaystack = async () => {
    const email = prompt("Enter your email address:");

    if (!email) {
      alert("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed.");
      }

      // Redirect the customer to Paystack's secure payment page
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Payment error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={payWithPaystack} disabled={loading}>
      {loading ? "Opening payment..." : "Upgrade for premium access"}
    </button>
  );
}