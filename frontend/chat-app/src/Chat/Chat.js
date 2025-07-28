import React, { useState, useEffect } from "react";
import { auth } from "../firebase-config";
import { Image as ImageIcon, X, Pencil, Trash2,User } from "lucide-react";
import { useRef } from "react";
import "./Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const [newMessage, setNewMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [iSent, setISent] = useState(false); // <- flag: eu enviei
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  const isNearBottom = (el, tolerance = 200) => {
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < tolerance;
  };

  useEffect(() => {
    const el = listRef.current;

    if (!el) {
      return;
    }

    if (iSent || isNearBottom(el)) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setISent(false);
    }
  }, [messages, iSent]);


  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:8000/messages");
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
        console.log("Messages fetched:", data);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (e) {
        setError("Server offline or unreachable");
        console.error("Error fetching messages:", e);
      }
    };
    fetchMessages();

    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onmessage = (event) => {
      console.log("New message received:", event.data);
      const newMessage = JSON.parse(event.data);

      setMessages((prev) => [...prev, newMessage]);
    };
    socket.onopen = () => console.log("🔌 WebSocket connected");
    socket.onerror = (err) => console.error("WebSocket error:", err);
    socket.onclose = () => console.log("WebSocket closed");

    return () => socket.close();
  }, []);

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageFile(null);
  };
  const handleSend = async () => {
    const user = auth.currentUser;
    if (!newMessage.trim() && !imageFile) return;
    if (user) {
      try {
        const formData = new FormData();
        const tokenId = await user.getIdToken();
        localStorage.setItem("tokenId", tokenId);
        formData.append("tokenId", tokenId);
        formData.append("message", newMessage);
        if (imageFile) {
          formData.append("image", imageFile); // <- nome do campo
        }

        const res = await fetch("http://localhost:3003/messages", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to send message");

        setNewMessage("");
        handleRemoveImage();
      } catch (e) {
        console.error("Error sending message:", e);
        setError("Failed to send message");
      }
    }
  };
  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setImageFile(selectedFile);
      const imageUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(imageUrl);
    }
  };
  const handleDelete = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const tokenId = await user.getIdToken();

      const response = await fetch(`http://localhost:8000/messages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenId}`,
        },
      });

      console.log("Response status:", response);
      if (!response.ok) {
        throw new Error("Erro ao deletar a mensagem");
      }

      // Remover da lista local
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    } catch (err) {
      console.error("Erro ao deletar mensagem:", err);
      alert("Erro ao deletar a mensagem.");
    }
  };
  const handleEdit = async (id, newText) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const tokenId = await user.getIdToken();

      const response = await fetch(`http://localhost:8000/messages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenId}`,
        },
        body: JSON.stringify({ message: newText }),
      });

      if (!response.ok) throw new Error("Erro ao editar a mensagem", response);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, message: newText } : msg
        )
      );
      setEditingMessageId(null); // Finaliza edição
    } catch (err) {
      console.error("Erro ao editar mensagem:", err);
      alert("Erro ao editar a mensagem.");
    }
  };




  return (

    <div className="chat-container">
      <h1 className="chat-title" hidden>Chat</h1>

      <div className="chat-box" ref={listRef}>
        <ul className="chat-messages">
          {messages.map((msg, index) => (

            <li key={index} className="chat-message">
              <div className="message-wrapper">

                {msg.photoUrl ? (
                  <img
                    src={msg.photoUrl}
                    alt="avatar"
                    className="message-avatar"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      backgroundColor: "#ccc",
                    }}
                  />
                ) : (
                  <User
                    size={32}
                    style={{
                      borderRadius: "50%",
                      backgroundColor: "#ccc",
                      padding: 4,
                      color: "#555",
                      display: "inline-block",
                    }}
                  />
                )}
                <div className="message-content">
                  <div className="message-header">
                    <p className="message_display_name">{msg.display_name}</p>
                    <p className="timestamp">
                      {new Date(msg.timestamp).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' '}
                    </p>
                    {auth.currentUser?.uid === msg.userId && (<div className="message-actions">
                      <button
                        className="message-icon-button"
                        onClick={() => {
                          setEditingMessageId(msg._id);
                          setEditText(msg.message);
                        }}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="message-icon-button"
                        onClick={() => handleDelete(msg._id)}
                        title="Apagar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>)}
                  </div>
                  {editingMessageId === msg._id ? (
                    <>
                      <div className="edit-container">
                        <input
                          className="edit-input"
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEdit(msg._id, editText);
                            } else if (e.key === "Escape") {
                              setEditingMessageId(null);
                            }
                          }}
                          onBlur={() => { setEditingMessageId(null); }}
                          autoFocus
                        />
                        <p className="editing-text">esc para cancelar • enter para salvar</p>
                      </div>
                    </>
                  ) : (< p className="message_text">{msg.message}</p>)}
                </div>
              </div>
              {
                msg.imageUrl && (
                  <div className="chat-image">
                    <img
                      src={msg.imageUrl}
                      alt="imagem da mensagem"
                      className="message-image"
                    />
                  </div>
                )
              }


            </li>
          ))}
          <div ref={bottomRef} />
        </ul>

        <div className="chat-input-container">
          <div className="chat-input-area">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="No que você está pensando?"
              className="chat-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />

            <div className="image-upload-container">
              <label className="chat-image-upload">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="preview-img" />
                ) : (
                  <ImageIcon size={20} />
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleImageChange}
                />
              </label>

              {previewUrl && (
                <button className="remove-btn" onClick={handleRemoveImage}>
                  <X size={16} />
                </button>
              )}
            </div>

            <button onClick={handleSend} className="chat-button">
              Enviar
            </button>
          </div>
        </div>
      </div>




      {error && <p className="chat-error">{error}</p>}
    </div >
  );

}
export default Chat;
