import React, { useState, useEffect } from "react";
import "./Chat.css";

function Chat({ tokenId }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:8000/messages");
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        setError("Server offline or unreachable");
        console.error("Error fetching messages:", e);
      }
    };
    fetchMessages();

    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };
    socket.onopen = () => console.log("🔌 WebSocket connected");
    socket.onerror = (err) => console.error("WebSocket error:", err);
    socket.onclose = () => console.log("WebSocket closed");

    return () => socket.close();
  }, [error]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch("http://localhost:3003/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          message: newMessage
        })
      });
      if (!res.ok) throw new Error("Failed to send message");
      setNewMessage("");
    } catch (e) {
      console.error("Error sending message:", e);
      setError("Failed to send message");
    }
  };

  return (
    <div className="chat-container">
        <h1 className="chat-title">Chat</h1>

        <div className="chat-box">
        <ul className="chat-messages">
            {messages.map((msg, index) => (
            <li key={index} className="chat-message">
                <strong>{msg.display_name}:</strong> {msg.message}
            </li>
            ))}
        </ul>
        </div>

        <div className="chat-input-area">
        <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="chat-input"
            onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
            }}
        />
        <button onClick={handleSend} className="chat-button">Enviar</button>
        
        </div>

        {error && <p className="chat-error">{error}</p>}
    </div>
    );

}
export default Chat;
