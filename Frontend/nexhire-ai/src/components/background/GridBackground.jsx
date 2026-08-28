function GridBackground() {
  return (
    <div
  className="absolute inset-0 opacity-50"
  style={{
    backgroundImage: `
      linear-gradient(rgba(255,215,0,.18) 1.5px, transparent 1.5px),
      linear-gradient(90deg, rgba(255,215,0,.18) 1.5px, transparent 1.5px)
    `,
    backgroundSize: "48px 48px",
    maskImage:
      "radial-gradient(circle at center, black 5%, transparent 100%)"
  }}
/>
  );
}

export default GridBackground;