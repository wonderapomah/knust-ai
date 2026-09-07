"use client";

import { useState } from "react";

export default function PayButton() {
  const [loading, setLoading] = useState(false);

  const payNow = async () => {
    const email = window.prompt("Enter your email address:");

    if (!email) return;

    try {
      setLoading(true);

      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server returned non-JSON response:", text);
        throw new Error(
          "The payment server returned an HTML page instead of JSON."
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      if (!data.authorization_url) {
        throw new Error("Paystack authorization URL was not returned.");
      }

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
    <button onClick={payNow} disabled={loading}>
      {loading ? "Opening payment..." : "Upgrade to Premium"}
    </button>
  );
}