// Login.js
import React, { useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 🔒 Replace this with your actual login logic (e.g., Firebase auth)
      const response = await fetch("http://localhost:3003/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");
      const data = await response.json();

      console.log(data.data.idToken)
      onLogin(data.data.idToken); // 🔑 pass token to parent
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: 300, margin: "50px auto", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: 10, fontSize: 16 },
  button: { padding: 10, fontSize: 16, cursor: "pointer" },
};

export default Login;
