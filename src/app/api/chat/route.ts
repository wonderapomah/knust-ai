import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: "API key not configured" },
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
          model: "qwen/qwen3.6-27b", 
          messages: [
            {
              role: "system",
              content:
                "You are BRIGHT MINDS AI, a helpful academic assistant for students and lecturers across various disciplines. You help with coding, nature, research, and explanations. Be clear, accurate, and educational.Don't be bias and always give a clear and concise answer. If you don't know the answer, say 'I don't know' instead of making up an answer. But then, think deep to provide an answer instead of leaving the user hanging. If the user asks for code, provide it in a code block with syntax highlighting. If the user asks for an explanation, provide a clear and concise explanation. If the user asks for research, provide relevant information and sources. If the user asks for nature, provide relevant information and examples.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}