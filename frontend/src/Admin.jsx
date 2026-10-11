
import { useEffect, useState } from "react";
import "./Admin.css";

const API = "http://localhost:5000";

export default function Admin() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("adminToken") || ""
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClub, setSelectedClub] = useState("All");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredRegistrations = registrations.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      item.student_name?.toLowerCase().includes(search) ||
      item.roll_number?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search);

    const matchesClub =
      selectedClub === "All" || item.club_name === selectedClub;

    return matchesSearch && matchesClub;
  });

  const clubNames = [
    "All",
    ...new Set(
      registrations.map((item) => item.club_name).filter(Boolean)
    ),
  ];

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      sessionStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setPassword("");
      setMessage("Login successful!");
    } catch (err) {
      setError(err.message || "Could not connect to the server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function loadRegistrations() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API}/api/registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("adminToken");

          if (!cancelled) {
            setToken("");
            setError("Your login expired. Please log in again.");
          }
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load registrations");
        }

        if (!cancelled) {
          setRegistrations(data.registrations || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load registrations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRegistrations();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleLogout() {
    sessionStorage.removeItem("adminToken");
    setToken("");
    setRegistrations([]);
    setSearchTerm("");
    setSelectedClub("All");
    setError("");
    setMessage("");
  }

  if (!token) {
    return (
      <main className="admin-page">
        <form onSubmit={handleLogin} className="admin-login-card">
          <div className="admin-logo">C</div>
          <p className="admin-eyebrow">CLUBCONNECT MANAGEMENT</p>
          <h1>Welcome Back</h1>
          <h2>Admin Login</h2>
          <p className="admin-muted">
            Sign in to manage student club registrations.
          </p>

          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter admin username"
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            autoComplete="current-password"
            required
          />

          {error && <p className="admin-alert admin-error">{error}</p>}

          <button className="admin-primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          <a href="/" className="admin-back-link">
            ← Back to ClubConnect
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <div className="admin-logo">C</div>
          <div>
            <h1>ClubConnect</h1>
            <p className="admin-muted">Admin Dashboard</p>
          </div>
        </div>

        <button className="admin-logout-button" onClick={handleLogout}>
          Logout ↗
        </button>
      </header>

      <section className="admin-welcome">
        <p className="admin-eyebrow">OVERVIEW</p>
        <h2>Student Registrations</h2>
        <p className="admin-muted">
          View, search and manage registrations across your college clubs.
        </p>
      </section>

      {message && (
        <p className="admin-alert admin-success" role="status">{message}</p>
      )}
      {error && (
        <p className="admin-alert admin-error" role="alert">{error}</p>
      )}

      <section className="admin-stats">
        <article className="admin-stat-card">
          <span className="admin-stat-icon">📋</span>
          <p className="admin-muted">Total Registrations</p>
          <h3>{registrations.length}</h3>
          <span className="admin-stat-note">All submitted records</span>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-icon">🎓</span>
          <p className="admin-muted">Clubs Represented</p>
          <h3>{new Set(registrations.map((item) => item.club_name)).size}</h3>
          <span className="admin-stat-note">Clubs with registrations</span>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-icon">🔎</span>
          <p className="admin-muted">Matching Results</p>
          <h3>{filteredRegistrations.length}</h3>
          <span className="admin-stat-note">Based on current filters</span>
        </article>
      </section>

      <section className="admin-table-card">
        <div className="admin-table-heading">
          <div>
            <p className="admin-eyebrow">MEMBER DIRECTORY</p>
            <h2>All Registrations</h2>
          </div>
          <span className="admin-result-count">
            {filteredRegistrations.length} results
          </span>
        </div>

        <div className="admin-filters">
          <input
            type="search"
            placeholder="Search name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search registrations"
          />

          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            aria-label="Filter by club"
          >
            {clubNames.map((club) => (
              <option key={club} value={club}>
                {club === "All" ? "All Clubs" : club}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="admin-clear-button"
            onClick={() => {
              setSearchTerm("");
              setSelectedClub("All");
            }}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <p className="admin-empty-state">Loading registrations...</p>
        ) : registrations.length === 0 ? (
          <p className="admin-empty-state">No registrations found.</p>
        ) : filteredRegistrations.length === 0 ? (
          <p className="admin-empty-state">
            No matching registrations. Try another search or club.
          </p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Email</th>
                  <th>Club</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="admin-student-name">{item.student_name}</td>
                    <td>{item.roll_number}</td>
                    <td>{item.email}</td>
                    <td>
                      <span className="admin-club-tag">{item.club_name}</span>
                    </td>
                    <td>
                      {item.registered_at
                        ? new Date(item.registered_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="admin-footer">
        ClubConnect <span>•</span> College Club Management System
      </footer>
    </main>
  );
}