import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loader, EmptyState } from "../components/Loader";

export default function Trips() {
  const { token } = useAuth();
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const data = await api.getTrips(token);
      setTrips(data.trips || data.groups || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: "2.5rem" }}>
        <div>
          <span className="eyebrow">Your trips</span>
          <h1 style={{ marginTop: "0.3rem" }}>Where are we splitting?</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New trip"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card card-tight" style={{ marginBottom: "1.5rem" }}>
          <CreateTripForm
            token={token}
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {trips === null ? (
        <Loader label="Loading trips…" />
      ) : trips.length === 0 ? (
        <EmptyState
          title="No trips yet"
          hint="Start one above — add a name and invite people by email."
        />
      ) : (
        <div className="trip-grid">
          {trips.map((trip) => (
            <Link key={trip._id} to={`/trips/${trip._id}`} className="trip-card">
              <h3>{trip.name}</h3>
              <p style={{ margin: "0 0 0.6rem", fontSize: "0.85rem" }}>
                {trip.description || "No description yet"}
              </p>
              <span className="trip-meta">
                {trip.members?.length || 0} {trip.members?.length === 1 ? "person" : "people"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTripForm({ token, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const memberEmails = emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      await api.createTrip(token, { name, description, memberEmails });
      setName("");
      setDescription("");
      setEmails("");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field-row">
        <div className="field">
          <label htmlFor="trip-name">Trip name</label>
          <input
            id="trip-name"
            required
            placeholder="Goa weekend"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="trip-desc">Description (optional)</label>
          <input
            id="trip-desc"
            placeholder="3 nights, 5 people"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="trip-emails">Invite people by email</label>
        <input
          id="trip-emails"
          placeholder="raj@gmail.com, priya@gmail.com"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />
        <p className="hint">Comma-separated. They need an existing Fairshare account — add more later too.</p>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create trip"}
      </button>
    </form>
  );
}
