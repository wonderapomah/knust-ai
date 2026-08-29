"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I encountered an error. Please try again." },
      ]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl mt-10">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">
          BRIGHT MINDS AI
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Your academic assistant for coding, nature & research
        </p>

        {/* Chat messages */}
        <div className="bg-white rounded-xl shadow-md p-4 h-[500px] overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-20">
              Ask me anything about coding, nature, or research...
            </p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-black"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-500">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-black px-6 py-3 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}