import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Stack, TextField, Divider, Select, MenuItem, Alert } from '@mui/material';
import paymentService from '../../payment/services/paymentService';

const EscrowManager = () => {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ amount: '', contractId: '', jobId: '', workerId: '', provider: 'paystack', email: '' });
  const [message, setMessage] = useState(null);

  const loadEscrows = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getEscrows();
      setEscrows(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error('Load escrows failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEscrows(); }, []);

  const fundEscrow = async () => {
    try {
      setMessage(null);
      // Generate escrow reference on client for E2E mapping
      const escrowReference = `ESC_${Date.now()}_${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      const payload = {
        amount: Number(form.amount),
        currency: 'GHS',
        contractId: form.contractId,
        jobId: form.jobId,
        workerId: form.workerId,
        provider: form.provider,
        reference: escrowReference
      };
      const { success, message: msg } = await paymentService.fundEscrow(payload);
      if (!success) throw new Error(msg || 'Fund failed');
      setMessage({ type: 'success', text: `Escrow funded (ref ${escrowReference})` });
      await loadEscrows();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // Minimal payment initialization using escrow reference (Stripe or Paystack)
  const initPayment = async () => {
    try {
      setMessage(null);
      if (!form.amount) throw new Error('Enter amount');
      const escrowReference = `ESC_${Date.now()}_${Math.random().toString(36).slice(2,8).toUpperCase()}`;

      if (form.provider === 'stripe') {
        const res = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(Number(form.amount) * 100),
            currency: 'GHS',
            provider: 'stripe',
            metadata: { escrowReference }
          })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Payment init failed');
        setMessage({ type: 'success', text: `Stripe initialized (escrowRef ${escrowReference})` });
      } else if (form.provider === 'paystack') {
        const res = await fetch('/api/payments/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email || 'test@example.com',
            amount: Number(form.amount),
            currency: 'GHS',
            metadata: { escrowReference },
            escrowReference
          })
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json.error?.message || json.message || 'Payment init failed');
        setMessage({ type: 'success', text: `Paystack initialized (ref ${json.data.reference})` });
      } else {
        throw new Error('Select Stripe or Paystack for this test');
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const releaseEscrow = async (id) => {
    try {
      setMessage(null);
      const res = await fetch(`/api/payments/escrows/${id}/release`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Release failed');
      setMessage({ type: 'success', text: 'Escrow released' });
      await loadEscrows();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  const refundEscrow = async (id) => {
    try {
      setMessage(null);
      const { success, message: msg } = await paymentService.refundEscrow(id);
      if (!success) throw new Error(msg || 'Refund failed');
      setMessage({ type: 'success', text: 'Escrow refunded' });
      await loadEscrows();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Escrow Manager</Typography>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Amount (GHS)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <TextField label="Contract ID" value={form.contractId} onChange={e => setForm(f => ({ ...f, contractId: e.target.value }))} />
        <TextField label="Job ID" value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))} />
        <TextField label="Worker ID" value={form.workerId} onChange={e => setForm(f => ({ ...f, workerId: e.target.value }))} />
        <Select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
          <MenuItem value="paystack">Paystack</MenuItem>
          <MenuItem value="stripe">Stripe</MenuItem>
          <MenuItem value="mtn">MTN MoMo</MenuItem>
          <MenuItem value="vodafone">Vodafone Cash</MenuItem>
          <MenuItem value="airteltigo">AirtelTigo Money</MenuItem>
        </Select>
        {form.provider === 'paystack' && (
          <TextField label="Email (Paystack)" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        )}
        <Button variant="contained" onClick={fundEscrow}>Fund Escrow</Button>
        <Button variant="outlined" onClick={initPayment}>Init Payment</Button>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>My Escrows</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Stack spacing={1}>
          {escrows.map(e => (
            <Box key={e._id} sx={{ p: 2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}>
              <Typography variant="subtitle1">{e.reference} — {e.status}</Typography>
              <Typography variant="body2">Amount: {e.amount} {e.currency} • Provider: {e.provider}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => releaseEscrow(e._id)} disabled={e.status !== 'active'}>Release</Button>
                <Button size="small" onClick={() => refundEscrow(e._id)} disabled={!(e.status === 'active' || e.status === 'disputed')}>Refund</Button>
              </Stack>
            </Box>
          ))}
          {escrows.length === 0 && (
            <Typography key="empty" variant="body2">No escrows found.</Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
};

export default EscrowManager;


