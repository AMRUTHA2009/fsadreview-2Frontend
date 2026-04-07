import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <main className="auth-card">
      <h2>Unauthorized</h2>
      <p>You do not have access to this page.</p>
      <Link to="/dashboard">Go to dashboard</Link>
    </main>
  );
}
