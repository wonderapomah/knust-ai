import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const FREE_DAILY_LIMIT = 15;
const PAID_DAILY_LIMIT = 200;

function getTodayKey(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return `chat-count:${userId}:${today}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId: bodyUserId, plan: bodyPlan } = body;

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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userId = bodyUserId || ip;
    const plan = bodyPlan === "paid" ? "paid" : "free";
    const dailyLimit = plan === "paid" ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
    const key = getTodayKey(userId);

    const currentCount = (await redis.get<number>(key)) || 0;

    if (currentCount >= dailyLimit) {
      return NextResponse.json(
        {
          error:
            plan === "paid"
              ? "You have reached today's paid limit."
              : "You have reached today's free limit. Please upgrade.",
          plan,
          used: currentCount,
          limit: dailyLimit,
        },
        { status: 429 }
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
    const reply =
      data.choices?.[0]?.message?.content || "No response generated.";

    const used = await redis.incr(key);
    if (used === 1) {
      await redis.expire(key, 60 * 60 * 26);
    }

    return NextResponse.json({
      reply,
      plan,
      used,
      limit: dailyLimit,
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}