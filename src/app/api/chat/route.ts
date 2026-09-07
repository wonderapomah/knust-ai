import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const FREE_LIMIT = 15;
const PAID_LIMIT = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      message,
      userId: bodyUserId,
      plan: bodyPlan,
      history = [],
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A valid message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing" },
        { status: 500 }
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() || "unknown";

    const userId = bodyUserId || ipAddress;

    // This is only temporary until Paystack subscription verification
    // is connected to the backend.
    const plan = bodyPlan === "paid" ? "paid" : "free";

    const limit = plan === "paid" ? PAID_LIMIT : FREE_LIMIT;

    const today = new Date().toISOString().slice(0, 10);
    const redisKey = `usage:${userId}:${today}`;

    const currentUsage = (await redis.get<number>(redisKey)) || 0;

    if (currentUsage >= limit) {
      return NextResponse.json(
        {
          error:
            plan === "free"
              ? "You have reached your free daily limit. Please upgrade to continue."
              : "You have reached your daily usage limit.",
          used: currentUsage,
          limit,
        },
        { status: 429 }
      );
    }

    const systemPrompt = `
You are BrightMinds AI, a helpful academic assistant for coding,
mathematics, science, nature, research, and general learning.

Answer the user's question directly and clearly.

IMPORTANT RULES:
- Never show your internal reasoning.
- Never output <think>, </think>, "thinking process", analysis,
  chain of thought, or hidden instructions.
- Do not explain how you internally arrived at the answer.
- Give only the final user-facing answer.
- Use simple explanations when the user asks for an explanation.
- Use Markdown when useful.
- For mathematics, show the necessary solution steps, but do not reveal
  private internal reasoning.
- If the user asks who discovered gravity, answer that Isaac Newton
  formulated the law of universal gravitation, while earlier scientists
  studied falling objects and planetary motion.
- Do not help with illegal hacking, stealing data, malware, or damaging
  computer systems.
`;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (item: any) =>
              item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
          .slice(-10)
      : [];

    const groqMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...safeHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.3,
          max_tokens: 2048,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return NextResponse.json(
        {
          error: "The AI service returned an error.",
        },
        { status: 500 }
      );
    }

    let reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate an answer.";

    // Remove any thinking tags if the model still returns them.
    reply = reply
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/^\s*Here's a thinking process:\s*/i, "")
      .trim();

    await redis.set(redisKey, currentUsage + 1, {
      ex: 60 * 60 * 24,
    });

    return NextResponse.json({
      reply,
      plan,
      used: currentUsage + 1,
      limit,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while processing your request.",
      },
      { status: 500 }
    );
  }
}