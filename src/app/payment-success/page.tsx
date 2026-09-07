"use client";

import { useEffect, useState } from "react";

export default function PaymentSuccess() {
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("reference");

      if (!reference) {
        setMessage("Payment reference was not found.");
        return;
      }

      try {
        const response = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(reference)}`
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setMessage(
            "Payment successful! Your premium access is now active."
          );
        } else {
          setMessage("Your payment could not be verified.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("An error occurred while verifying your payment.");
      }
    };

    verifyPayment();
  }, []);

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Payment Status</h1>

      <p>{message}</p>

      <a href="/">Return to BrightMinds</a>
    </main>
  );
}