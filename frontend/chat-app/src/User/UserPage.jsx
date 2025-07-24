import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function UserPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    // Você pode pegar o nome do usuário decodificando o token se quiser.
    // Aqui usamos um valor inicial fixo como exemplo.
    setName("João da Silva");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tokenId");
    navigate("/");
    window.location.reload();
  };

  const handlePasswordChange = () => {
    alert("Funcionalidade de troca de senha ainda não implementada.");
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: "2rem" }}>👤 Minha Conta</h1>

      <div style={formGroup}>
        <label htmlFor="name">Nome:</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <button onClick={handlePasswordChange} style={blueButton}>
        Alterar Senha
      </button>

      <button onClick={handleLogout} style={redButton}>
        Sair
      </button>
    </div>
  );
}

// 🎨 Estilos

const containerStyle = {
  maxWidth: "400px",
  margin: "4rem auto",
  padding: "2rem",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const inputStyle = {
  padding: "0.5rem",
  fontSize: "1rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const blueButton = {
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  backgroundColor: "#0078d4",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const redButton = {
  ...blueButton,
  backgroundColor: "#e74c3c",
};

export default UserPage;
