import { useEffect, useState } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null); 
  console.log("App component rendered");
  useEffect(() => {
   const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:8000/messages");
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Server offline or unreachable");
    }
  };
  fetchMessages();
  // Connect WebSocket for real-time updates
  const socket = new WebSocket("ws://localhost:8000/ws");

  socket.onmessage = (event) => {
    const newMessage = JSON.parse(event.data);
    setMessages((prev) => [...prev, newMessage]);
  };

  socket.onopen = () => console.log("🔌 WebSocket connected");
  socket.onerror = (err) => console.error("WebSocket error:", err);
  socket.onclose = () => console.log("WebSocket closed");

  return () => {
    socket.close(); // Cleanup
  };
}, []);
  return (
    <div>
      <h1>Mensagens em tempo real</h1>
      <ul>
        {messages.map((msg, index) => {
          console.log("Rendering message:", msg);
          return <li key={index}>
            <strong>{msg.display_name}:</strong> {msg.message}
          </li>;
       })}
    </ul>
    </div>
  );
}

export default App;
