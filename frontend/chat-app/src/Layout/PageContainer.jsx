// src/Layout/PageContainer.jsx
function PageContainer({ children }) {
  return (
    <div className = "page-container" style={{
      marginLeft: "200px",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "right",
      justifyContent: "right",
      width: "100%",

    }}>
      {children}
    </div>
  );
}

export default PageContainer;
