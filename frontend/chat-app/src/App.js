import { useEffect, useState } from "react";
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import UserPage from "./User/UserPage";
import Header from "./Header/Header";
import Chat from "./Chat/Chat";
import Login from "./Login/Login";
import PageContainer from "./Layout/PageContainer"; // <-- importe aqui

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
          setToken(storedToken);
        } else {
          localStorage.removeItem("tokenId");
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  const handleLogin = (tokenId) => {
    localStorage.setItem("tokenId", tokenId);
    setToken(tokenId);
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <Router>
      {token && <Header />}
      <Routes>
        {token ? (
          <>
            <Route
              path="/"
              element={
                <PageContainer>
                  <Chat tokenId={token} />
                </PageContainer>
              }
            />
            <Route
              path="/user"
              element={
                <PageContainer>
                  <UserPage />
                </PageContainer>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
