import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is missing");
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Handle Groq errors
    if (!response.ok) {
      console.error("Groq API error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message || "Groq API request failed",
        },
        { status: response.status }
      );
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Unexpected Groq response:", data);

      return NextResponse.json(
        { error: "No response was returned by Groq" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Server error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}