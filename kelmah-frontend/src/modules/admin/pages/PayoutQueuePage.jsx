import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';

const StatusBadge = ({ status }) => {
  const color = {
    queued: '#b08900',
    processing: '#1f6feb',
    completed: '#238636',
    failed: '#da3633'
  }[status] || '#6e7681';
  return (
    <span style={{
      backgroundColor: color,
      color: 'white',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 12
    }}>{status}</span>
  );
};

const PayoutQueuePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('queued');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.listPayouts({ status, page, limit });
      setItems(res.data || res.items || []);
    } catch (e) {
      setError(e?.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, page, limit]);

  const onProcessBatch = async () => {
    setProcessing(true);
    try {
      await adminService.processPayoutBatch(limit);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to process batch');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Payout Queue</h2>
      <details style={{ marginBottom: 16 }}>
        <summary>Enqueue payout (admin)</summary>
        <EnqueueForm onSubmitted={load} />
      </details>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          Page:
          <input type="number" value={page} onChange={(e) => setPage(parseInt(e.target.value || '1'))} min={1} style={{ width: 80, marginLeft: 8 }} />
        </label>
        <label>
          Limit:
          <input type="number" value={limit} onChange={(e) => setLimit(parseInt(e.target.value || '20'))} min={1} max={100} style={{ width: 80, marginLeft: 8 }} />
        </label>
        <button onClick={onProcessBatch} disabled={processing}>
          {processing ? 'Processing…' : 'Process batch'}
        </button>
        <button onClick={load} disabled={loading}>Refresh</button>
      </div>
      {error && <div style={{ color: '#da3633', marginBottom: 12 }}>{error}</div>}
      <div style={{ border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#161b22' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>User</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Amount</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Currency</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Provider</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Attempts</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Created</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Last error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 16 }}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 16 }}>No items</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it._id} style={{ borderTop: '1px solid #30363d' }}>
                  <td style={{ padding: 12 }}>{it.user}</td>
                  <td style={{ padding: 12 }}>{it.amount}</td>
                  <td style={{ padding: 12 }}>{it.currency}</td>
                  <td style={{ padding: 12 }}>{it.provider}</td>
                  <td style={{ padding: 12 }}><StatusBadge status={it.status} /></td>
                  <td style={{ padding: 12 }}>{it.attempts}</td>
                  <td style={{ padding: 12 }}>{new Date(it.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 12 }}>{it.lastError?.message || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutQueuePage;

const EnqueueForm = ({ onSubmitted }) => {
  const [user, setUser] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [provider, setProvider] = useState('mtn_momo');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setOk('');
    try {
      if (!user || !amount || !paymentMethod) throw new Error('user, amount, paymentMethod are required');
      const res = await adminService.enqueuePayout({ user, amount: parseFloat(amount), currency, provider, paymentMethod });
      setOk('Queued');
      setUser(''); setAmount(''); setPaymentMethod('');
      onSubmitted && onSubmitted();
    } catch (e) {
      setError(e?.message || 'Failed to enqueue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, alignItems: 'end', marginTop: 12 }}>
      <label style={{ display: 'grid' }}>
        <span>User ID</span>
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="user ObjectId" />
      </label>
      <label style={{ display: 'grid' }}>
        <span>Amount</span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} step={0.01} />
      </label>
      <label style={{ display: 'grid' }}>
        <span>Currency</span>
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
      </label>
      <label style={{ display: 'grid' }}>
        <span>Provider</span>
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="mtn_momo">MTN MoMo</option>
          <option value="vodafone_cash">Vodafone Cash</option>
          <option value="airteltigo">AirtelTigo</option>
          <option value="paystack">Paystack</option>
        </select>
      </label>
      <label style={{ display: 'grid' }}>
        <span>Payment Method ID</span>
        <input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="paymentMethod ObjectId" />
      </label>
      <button type="submit" disabled={submitting}>Enqueue</button>
      {error && <div style={{ gridColumn: '1 / -1', color: '#da3633' }}>{error}</div>}
      {ok && <div style={{ gridColumn: '1 / -1', color: '#238636' }}>{ok}</div>}
    </form>
  );
};

