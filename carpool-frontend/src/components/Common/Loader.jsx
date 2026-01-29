export default function Loader({ text = "Loading..." }) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        ⏳ {text}
      </div>
    );
  }
  