export default function Loading({ message = "Loading..." }) {
  return (
    <div className="container">
      <p className="muted">{message}</p>
    </div>
  );
}
