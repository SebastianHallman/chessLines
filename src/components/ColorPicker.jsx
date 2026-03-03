export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      <h3>Play as</h3>
      <button
        className={`color-btn white ${value === "white" ? "selected" : ""}`}
        onClick={() => onChange("white")}
      >
        ♔ White
      </button>
      <button
        className={`color-btn black ${value === "black" ? "selected" : ""}`}
        onClick={() => onChange("black")}
      >
        ♚ Black
      </button>
    </div>
  );
}
