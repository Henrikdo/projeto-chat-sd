// src/Layout/PageContainer.jsx
function PageContainer({ children }) {
  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem",
      width: "100%",
    }}>
      {children}
    </div>
  );
}

export default PageContainer;
