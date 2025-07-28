  import { useEffect, useState } from "react";
  import "./App.css";
  import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
  } from "react-router-dom";

  import UserPage from "./User/UserPage";
  import SideNav from "./SideNav/SideNav";
  import Chat from "./Chat/Chat";
  import Login from "./Login/Login";
  import Signup from "./Login/SignUp";
  
  import PageContainer from "./Layout/PageContainer";
  import { auth } from "./firebase-config";
  import { onAuthStateChanged } from "firebase/auth";

  function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    }, []);

    if (loading) {
      return <p>Carregando...</p>;
    }

    return (
      <Router>

        {currentUser && <SideNav />}
        <Routes>
          {currentUser ? (
            <>
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
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </Router>
    );
  }

  export default App;
