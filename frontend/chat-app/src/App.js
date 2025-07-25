import { useEffect, useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Componentes
import UserPage from "./User/UserPage";
import SideNav from "./SideNav/SideNav";
import Chat from "./Chat/Chat";
import Login from "./Login/Login";
import PageContainer from "./Layout/PageContainer";

// 1. Importe o 'auth' do seu arquivo de configuração do Firebase
import { auth } from "./firebase-config"; // Ajuste o caminho se necessário
import { onAuthStateChanged } from "firebase/auth";

function App() {
  // 2. O estado agora armazena o objeto 'user' completo, não apenas o token.
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. useEffect agora observa o estado de autenticação do Firebase
  useEffect(() => {
    // onAuthStateChanged retorna uma função 'unsubscribe' para limpeza
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Se 'user' existir, o usuário está logado. Se for 'null', não está.
      setCurrentUser(user);
      setLoading(false); // Marca o carregamento como concluído
    });

    // Função de limpeza que será chamada quando o componente for desmontado
    return () => unsubscribe();
  }, []); // O array vazio garante que isso rode apenas uma vez

  // 4. Removemos as funções 'isLoggedIn' e 'handleLogin'. O Firebase cuida de tudo!

  if (loading) {
    return <p>Carregando...</p>; // Tela de loading enquanto o Firebase verifica a sessão
  }

  return (
    <Router>
      {/* 5. A lógica de roteamento agora é baseada no 'currentUser' */}
      {currentUser && <SideNav />}
      <Routes>
        {currentUser ? (
          <>
            {/* 6. O componente Chat não precisa mais receber o token como prop */}
            <Route
              path="/"
              element={
                <PageContainer>
                  <Chat />
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
            {/* O componente de Login agora usa o SDK do Firebase internamente */}
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
