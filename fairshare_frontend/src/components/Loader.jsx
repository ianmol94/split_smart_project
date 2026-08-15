export function Loader({ label = "Loading…" }) {
  return <div className="loader">{label}</div>;
}

export function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {hint && <p style={{ margin: 0 }}>{hint}</p>}
    </div>
  );
}
