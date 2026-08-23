"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState("");
  const [reply, setReply] = useState("");

  async function sendMessage() {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    setReply(data.reply);
  }

  return (
    <div className="flex flex-col items-center p-10">
      <h1 className="text-3xl font-bold mb-4"><em><mark>KNUST AI</mark></em></h1>

      <input
        className="border p-2 w-full max-w-md mb-4"
        placeholder="Type your message..."
        value={messages}
        onChange={(e) => setMessages(e.target.value)}
      />

      <button
        onClick={sendMessage}
        className="bg-blue-600 text-white px-4 py-2 mt-3 rounded mb-4"
      >
        Send
      </button>

      <div className="mt-6 p-4 border w-full max-w-md bg-gray-100 rounded">
        <p className="font-semibold">AI Response:</p>
        <p>{reply}</p>
      </div>
    </div>
  );  
}
