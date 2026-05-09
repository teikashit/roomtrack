import { useState, useEffect } from "react";
import { User } from "../../App";
import { api } from "../../apiClient";
import AppLayout from "../../components/AppLayout";
import "./Payments.css";

interface Props {
  user: User;
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToMyRoom?: () => void;
  onGoToPayments?: () => void;
  onGoToAnnouncements?: () => void;
  onGoToDashboard?: () => void;
}

interface Payment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  paid:              { label: "Paid",             cls: "status-paid"         },
  pending:           { label: "Pending",          cls: "status-pending"      },
  overdue:           { label: "Overdue",          cls: "status-overdue"      },
  for_verification:  { label: "For Verification", cls: "status-verification" },
};

export default function TenantPayments({ user, onLogout, onGoToProfile, onGoToMyRoom, onGoToPayments, onGoToAnnouncements, onGoToDashboard }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    const data = await api.getPaymentsByTenant(user.id);
    const sorted = [...data].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    setPayments(sorted as Payment[]);
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  const pendingPayments = payments.filter(p => p.status.toLowerCase() !== "paid");
  const totalBalance = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const nextDue = pendingPayments[pendingPayments.length - 1] || pendingPayments[0];

  const openCheckout = (p: Payment) => {
    setSelectedPayment(p);
    setCheckoutSuccess(false);
    setShowCheckout(true);
  };

  const handlePayNow = async () => {
    if (!selectedPayment) return;
    setCheckoutLoading(true);
    await api.updatePaymentStatus(selectedPayment.id, "for_verification");
    setCheckoutLoading(false);
    setCheckoutSuccess(true);
    fetchPayments();
  };

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      activePage="Payments"
      onGoToProfile={onGoToProfile}
      onGoToMyRoom={onGoToMyRoom}
      onGoToPayments={onGoToPayments}
      onGoToAnnouncements={onGoToAnnouncements}
      onGoToDashboard={onGoToDashboard}
    >
      <div className="pay-header fade-up">
        <div className="pay-header__left">
          <h1 className="pay-title">My Payments</h1>
          <p className="pay-sub">View your payment history and pay your outstanding balance.</p>
        </div>
      </div>

      {/* Balance banner */}
      {!loading && totalBalance > 0 && (
        <div className="tenant-pay-banner fade-up delay-1">
          <div className="tenant-pay-banner__icon">💳</div>
          <div className="tenant-pay-banner__info">
            <div className="tenant-pay-banner__title">You have an outstanding balance</div>
            <div className="tenant-pay-banner__sub">
              {pendingPayments.length} payment{pendingPayments.length !== 1 ? "s" : ""} pending
              {nextDue ? ` — next due ${formatDate(nextDue.due_date)}` : ""}
            </div>
          </div>
          <div>
            <div className="tenant-pay-banner__amount">₱{totalBalance.toLocaleString()}</div>
            <div className="tenant-pay-banner__due">Total Balance</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="pay-stats fade-up delay-2">
        {[
          { label: "Total Balance",   value: `₱${totalBalance.toLocaleString()}`,                                                         icon: "💳", cls: "icon-red"   },
          { label: "Paid",            value: String(payments.filter(p => p.status === "paid").length),                                     icon: "✅", cls: "icon-green" },
          { label: "Pending",         value: String(payments.filter(p => p.status === "pending" || p.status === "overdue").length),        icon: "⏳", cls: "icon-amber" },
          { label: "For Verification",value: String(payments.filter(p => p.status === "for_verification").length),                        icon: "🔍", cls: "icon-violet"},
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">{s.label}</span>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            </div>
            <div className="stat-card__value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="pay-table-wrap fade-up delay-3">
        {loading ? (
          <div className="pay-empty">Loading your payments…</div>
        ) : payments.length === 0 ? (
          <div className="pay-empty">No payment records found. Contact your landlord.</div>
        ) : (
          <table className="pay-table">
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const si = STATUS_INFO[p.status] || { label: p.status, cls: "status-pending" };
                const canPay = p.status === "pending" || p.status === "overdue";
                return (
                  <tr key={p.id}>
                    <td>{formatDate(p.due_date)}</td>
                    <td><div className="pay-amount">₱{Number(p.amount).toLocaleString()}</div></td>
                    <td><span className={`status-badge ${si.cls}`}>{si.label}</span></td>
                    <td>
                      {canPay && (
                        <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "12.5px" }} onClick={() => openCheckout(p)}>
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <span className="modal__title">💳 Pay Rent</span>
              <button className="modal__close" onClick={() => setShowCheckout(false)}>✕</button>
            </div>
            {checkoutSuccess ? (
              <div className="modal__body" style={{ textAlign: "center", padding: "40px 24px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Payment Submitted!</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Your payment of ₱{Number(selectedPayment.amount).toLocaleString()} has been submitted for verification.
                  Your landlord will confirm it shortly.
                </div>
                <div style={{ marginTop: "24px" }}>
                  <button className="btn-primary" onClick={() => setShowCheckout(false)}>Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className="modal__body">
                  <div style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "18px 20px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Payment Summary</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700 }}>Rent Payment</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Due: {formatDate(selectedPayment.due_date)}</div>
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>
                        ₱{Number(selectedPayment.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", background: "var(--amber-bg)", borderRadius: "var(--radius-sm)", padding: "12px 14px", border: "1px solid #fcd34d" }}>
                    📌 After clicking "Submit Payment", your landlord will review and confirm the transaction. Status will change to "For Verification".
                  </div>
                </div>
                <div className="modal__foot">
                  <button className="btn-secondary" onClick={() => setShowCheckout(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handlePayNow} disabled={checkoutLoading}>
                    {checkoutLoading ? "Processing…" : "Submit Payment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
