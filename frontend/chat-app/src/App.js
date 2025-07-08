import { useEffect, useState } from "react";
import Chat from "./Chat/Chat";
import Login from "./Login/Login";

const isLoggedIn = async (tokenId) => {
  try {
    const res = await fetch("http://localhost:3003/user/verifyLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid === true;
  } catch (err) {
    console.error("Login check failed:", err);
    return false;
  }
};

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const storedToken = localStorage.getItem("tokenId");
      if (storedToken) {
        const stillValid = await isLoggedIn(storedToken);
        if (stillValid) {
          setToken(storedToken); // 🔐 valid token
        } else {
          localStorage.removeItem("tokenId");
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  const handleLogin = (tokenId) => {
    localStorage.setItem("tokenId", tokenId); // Store token for future
    setToken(tokenId);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <>
      {token ? (
        <Chat tokenId={token} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
