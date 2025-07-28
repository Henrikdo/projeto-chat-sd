import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase-config";
import logo from "../assets/logo.svg";

function Signup() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
      // opcional: redirecionar ou mostrar sucesso
    } catch (err) {
      setError("Erro ao criar conta: " + err.message);
    }
  };

  return (
    <div style={{ ...styles.container }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <img src={logo} style={{ width: "50px", height: "50px" }} alt="Logo Chato" />
        <h1 style={{ color: "#fff" }}>Chato</h1>
      </div>
      <h2 style={styles.h2}>Criar Conta</h2>
      <form onSubmit={handleSignup} style={styles.form}>
        <input
          type="text"
          placeholder="Nome de exibição"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Criar Conta</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  h2: { color: "#fff" },
  container: {
    maxWidth: 300,
    margin: "50px auto",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
  },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    border: "1px solid #ccc",
    backgroundColor: "#424242",
    color: "#fff",
  },
  button: {
    padding: 10,
    fontSize: 16,
    cursor: "pointer",
    borderRadius: 5,
    border: "none",
    backgroundColor: "#227E25FF",
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
  },
};

export default Signup;
