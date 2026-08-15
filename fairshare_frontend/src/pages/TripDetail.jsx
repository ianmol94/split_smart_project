import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Loader, EmptyState } from "../components/Loader";
import { formatMoney } from "../utils/format";

const TABS = ["Expenses", "Balances", "Members"];

export default function TripDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Expenses");

  const loadTrip = useCallback(async () => {
    try {
      const data = await api.getTrip(token, id);
      setTrip(data.trip || data.group);
    } catch (err) {
      setError(err.message);
    }
  }, [token, id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  if (error) {
    return (
      <div className="page">
        <div className="error-banner" style={{ marginTop: "2rem" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page">
        <Loader label="Loading trip…" />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginTop: "2.5rem" }}>
        <span className="eyebrow">Trip</span>
        <h1 style={{ marginTop: "0.3rem" }}>{trip.name}</h1>
        {trip.description && <p>{trip.description}</p>}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Expenses" && <ExpensesTab tripId={id} trip={trip} token={token} currentUser={user} />}
      {tab === "Balances" && <BalancesTab tripId={id} token={token} />}
      {tab === "Members" && <MembersTab trip={trip} token={token} onUpdated={loadTrip} />}
    </div>
  );
}

/* ---------------------------- Expenses tab ---------------------------- */

function ExpensesTab({ tripId, trip, token, currentUser }) {
  const [expenses, setExpenses] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getExpenses(token, tripId);
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token, tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (expenseId) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.deleteExpense(token, expenseId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2 style={{ margin: 0 }}>Expenses</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add expense"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card card-tight" style={{ marginBottom: "1.5rem" }}>
          <AddExpenseForm
            trip={trip}
            token={token}
            currentUser={currentUser}
            onAdded={() => {
              setShowForm(false);
              load();
            }}
          />
        </div>
      )}

      {expenses === null ? (
        <Loader label="Loading expenses…" />
      ) : expenses.length === 0 ? (
        <EmptyState title="No expenses logged yet" hint="Add the first one for this trip above." />
      ) : (
        expenses.map((exp) => (
          <div key={exp._id} className="ticket">
            <div className="ticket-main">
              <div className="ticket-desc">{exp.description}</div>
              <div className="ticket-meta">
                Paid by {exp.paidBy?.name || "someone"} · split {exp.splitType} among{" "}
                {exp.splits?.length || 0}
              </div>
            </div>
            <div className="ticket-amount">
              <span className="value mono">₹{formatMoney(exp.amount)}</span>
              <span className="label">total</span>
              <button
                className="ticket-delete"
                onClick={() => handleDelete(exp._id)}
                aria-label={`Delete ${exp.description}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AddExpenseForm({ trip, token, currentUser, onAdded }) {
  const members = trip.members || [];
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentUser?.id || members[0]?._id || "");
  const [splitType, setSplitType] = useState("equal");
  const [selected, setSelected] = useState(() => new Set(members.map((m) => m._id)));
  const [customValues, setCustomValues] = useState({}); // userId -> string
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleMember = (memberId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const participantIds = members.filter((m) => selected.has(m._id));
    if (participantIds.length === 0) {
      setError("Select at least one participant to split with.");
      return;
    }

    let participants;
    if (splitType === "equal") {
      participants = participantIds.map((m) => ({ user: m._id }));
    } else if (splitType === "exact") {
      participants = participantIds.map((m) => ({
        user: m._id,
        amount: Number(customValues[m._id] || 0),
      }));
    } else {
      participants = participantIds.map((m) => ({
        user: m._id,
        percentage: Number(customValues[m._id] || 0),
      }));
    }

    setBusy(true);
    try {
      await api.addExpense(token, {
        group: trip._id,
        description,
        amount: Number(amount),
        paidBy,
        splitType,
        participants,
      });
      onAdded();
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
          <label htmlFor="exp-desc">What was it for?</label>
          <input
            id="exp-desc"
            required
            placeholder="Dinner, cabs, hotel…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="exp-amount">Amount</label>
          <input
            id="exp-amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="paid-by">Paid by</label>
          <select id="paid-by" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="split-type">Split</label>
          <select id="split-type" value={splitType} onChange={(e) => setSplitType(e.target.value)}>
            <option value="equal">Equally</option>
            <option value="exact">By exact amount</option>
            <option value="percentage">By percentage</option>
          </select>
        </div>
      </div>

      <label>Split between</label>
      <div style={{ marginBottom: "0.75rem" }}>
        {members.map((m) => (
          <div key={m._id} className="split-row">
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={selected.has(m._id)}
              onChange={() => toggleMember(m._id)}
              id={`member-${m._id}`}
            />
            <label htmlFor={`member-${m._id}`} className="name" style={{ margin: 0, fontWeight: 400 }}>
              {m.name}
            </label>
            {splitType !== "equal" && selected.has(m._id) && (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={splitType === "exact" ? "amount" : "%"}
                value={customValues[m._id] || ""}
                onChange={(e) =>
                  setCustomValues((prev) => ({ ...prev, [m._id]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
      </div>
      {splitType === "exact" && <p className="hint">Amounts must add up to the total.</p>}
      {splitType === "percentage" && <p className="hint">Percentages must add up to 100.</p>}

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Adding…" : "Add expense"}
      </button>
    </form>
  );
}

/* ---------------------------- Balances tab ---------------------------- */

function BalancesTab({ tripId, token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getBalances(token, tripId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token, tripId]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <Loader label="Crunching balances…" />;

  const { balances = [], settlements = [] } = data;

  return (
    <div>
      <h2>Who stands where</h2>
      <div className="card card-tight" style={{ marginBottom: "1.5rem" }}>
        {balances.map((b) => (
          <div key={b.user?._id} className="balance-row">
            <span className="balance-name">{b.user?.name}</span>
            <span className={`balance-amount ${b.netBalance >= 0 ? "positive" : "negative"}`}>
              {b.netBalance >= 0 ? "+" : "−"}₹{formatMoney(Math.abs(b.netBalance))}
            </span>
          </div>
        ))}
      </div>

      <h2>Settle up</h2>
      {settlements.length === 0 ? (
        <EmptyState title="Everyone's settled" hint="No payments needed right now." />
      ) : (
        settlements.map((s, i) => (
          <div key={i} className="settlement-row">
            <strong>{s.from?.name}</strong>
            <span className="arrow">→</span>
            <strong>{s.to?.name}</strong>
            <span className="amount mono">₹{formatMoney(s.amount)}</span>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------------------- Members tab ---------------------------- */

function MembersTab({ trip, token, onUpdated }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.addMember(token, trip._id, email);
      setEmail("");
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Members</h2>
      <div className="chip-row">
        {(trip.members || []).map((m) => (
          <span key={m._id} className="chip">
            {m.name}
          </span>
        ))}
      </div>

      <div className="card card-tight" style={{ maxWidth: 420 }}>
        <h3>Add someone</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="add-email">Their email</label>
            <input
              id="add-email"
              type="email"
              required
              placeholder="friend@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="hint">They need to already have a Fairshare account.</p>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add to trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
