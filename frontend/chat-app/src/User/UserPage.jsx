import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";


function UserPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tempName, setTempName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const startEditing = () => {
    setTempName(name); // guarda o valor atual antes de editar
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setName(tempName); // restaura o valor antigo
    setIsEditing(false);
  };

  const saveEditing = async () => {
    try {
      const res = await fetch("http://localhost:3003/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: localStorage.getItem("tokenId"),
          displayName: name,  // envia o valor atual do input
        }),
      });

      if (!res.ok) throw new Error("Failed to update user");
      // Se quiser, pode ler a resposta: const data = await res.json();

    } catch (e) {
      console.error("Error updating user:", e);
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("tokenId");
    console.log("Token from localStorage:", token);
    if (!token) {
      navigate("/");
    }

    // Se quiser puxar o nome do usuário autenticado:
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setName(currentUser.displayName || "Usuário sem nome");
      setPhotoURL(currentUser.photoURL || null);
    }
  }, [navigate]);

  const handleLogout = async () => {
    const auth = getAuth();

    try {
      await signOut(auth); // Encerra a sessão do Firebase
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }

    localStorage.removeItem("tokenId"); // Remove o token local
    navigate("/");
    window.location.reload(); // (opcional) força recarregamento limpo
  };

  const handlePasswordChange = () => {
    alert("Funcionalidade de troca de senha ainda não implementada.");
  };
  return (
    <div style={pageContainerStyle}>
      <div style={containerStyle}>
        <h1 style={{ marginBottom: "2rem", fontWeight: 200, textAlign: "left" }}>Minha Conta</h1>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div
            onClick={() => document.getElementById("fileInput").click()}
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: "#ddd",
              backgroundImage: photoURL ? `url(${photoURL})` : "",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "#888",
              cursor: "pointer",
              border: "2px solid #ccc",
            }}
            title="Clique para trocar a foto"
          >
            {!currentUser?.photoURL && "🖼️"}
          </div>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              const auth = getAuth();
              const user = auth.currentUser;
              const tokenId = await user.getIdToken();
              formData.append("tokenId", tokenId);
              formData.append("displayName", name); // mantém o nome atual
              formData.append("image", file);

              try {
                const res = await fetch("http://localhost:3003/user/updateUserImage", {
                  method: "PUT",
                  body: formData,
                });
                if (!res.ok) throw new Error("Erro ao enviar imagem");

                const data = await res.json();
                console.log("Imagem enviada:", data);

          
                await auth.currentUser.reload(); // força atualização
                const updatedUser = auth.currentUser;
                setPhotoURL(updatedUser.photoURL);
                localStorage.setItem("userPhotoUrl", updatedUser.photoURL);

              } catch (err) {
                console.error("Erro ao trocar imagem:", err);
              }
            }}
          />
        </div>
        <div style={formGroup}>
          <label htmlFor="name">Nome:</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            disabled={!isEditing} // desativa o input enquanto não estiver editando
          />
          {!isEditing && (
            <button style={editButtonStyle} onClick={startEditing}>Editar</button>
          )}
          {isEditing && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={saveButtonStyle} onClick={saveEditing} >
                Salvar
              </button>
              <button style={cancelButtonStyle} onClick={cancelEditing}>Cancelar</button>
            </div>
          )}
        </div>

        <button onClick={handlePasswordChange} hidden style={blueButton}>
          Alterar Senha
        </button>

        <button onClick={handleLogout} style={redButton}>
          Sair
        </button>
      </div>
    </div>
  );
}

const editButtonStyle = {
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  backgroundColor: "#0078d4",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const saveButtonStyle = {
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  backgroundColor: "#097006FF",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const cancelButtonStyle = {
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  backgroundColor: "#8A2D23FF",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const pageContainerStyle = {
  display: "flex",
  alignItems: "start",
  width: "100%",
  height: "100%",
}

const containerStyle = {
  maxWidth: "400px",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
  justifyContent: "center",
  gap: "1rem",
  color: "#fff",
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  alignItems: "start",
  color: "#fff",
};

const inputStyle = {
  padding: "0.5rem",
  fontSize: "1rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  color: "#fff",
  background: "transparent",
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
