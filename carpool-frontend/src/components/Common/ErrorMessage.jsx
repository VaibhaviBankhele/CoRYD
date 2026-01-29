export default function ErrorMessage({ message }) {
    if (!message) return null;
  
    return (
      <div style={{ color: "red", padding: "10px" }}>
        ❌ {message}
      </div>
    );
  }
  