'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Search,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import styles from '../admin.module.css';

interface PromoCodeItem {
  id: string;
  code: string;
  discount: number;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface Stats {
  totalCount: number;
  activeCount: number;
  totalUses: number;
}

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount: '51',
    isActive: true,
    maxUses: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes');
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data.promoCodes || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load promo codes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      code: '',
      discount: '51',
      isActive: true,
      maxUses: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: PromoCodeItem) => {
    setEditingId(p.id);
    setFormData({
      code: p.code,
      discount: String(p.discount),
      isActive: p.isActive,
      maxUses: p.maxUses ? String(p.maxUses) : '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const generateRandomCode = () => {
    const prefixes = ['SHIKHAR', 'PATWARI', 'MOCK', 'SAVE', 'EXAM'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({ ...prev, code: `${prefix}${num}` }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount: parseInt(formData.discount, 10),
      isActive: formData.isActive,
      maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : null,
    };

    if (!payload.code || payload.code.length < 3) {
      setFormError('Code must be at least 3 characters.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(payload.discount) || payload.discount <= 0) {
      setFormError('Please enter a valid discount amount in ₹.');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/promo-codes/${editingId}`
        : '/api/admin/promo-codes';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save promo code');
      }

      setIsModalOpen(false);
      setActionSuccess(editingId ? 'Promo code updated successfully!' : 'Promo code created successfully!');
      setTimeout(() => setActionSuccess(null), 4000);
      fetchPromoCodes();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (p: PromoCodeItem) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });

      if (res.ok) {
        fetchPromoCodes();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteConfirmId(null);
        setActionSuccess('Promo code deleted successfully!');
        setTimeout(() => setActionSuccess(null), 4000);
        fetchPromoCodes();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Filtered list
  const filtered = promoCodes.filter((p) => {
    const matchesSearch =
      !search || p.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && p.isActive) ||
      (filterStatus === 'inactive' && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Top Breadcrumb & Action Header */}
      <div className={styles.pageHeader}>
        <div>
          <Link
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Admin Hub</span>
          </Link>
          <h1 className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Tag size={28} color="#818CF8" />
            Promo Codes &amp; Discounts
          </h1>
          <p className={styles.pageSubtitle}>
            Create and manage promotional discount codes across all exam test series. Baseline test series price is ₹200; e.g. ₹51 discount gives ₹149 price.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            size="md"
            onClick={fetchPromoCodes}
            leftIcon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button
            variant="accent"
            size="md"
            onClick={openCreateModal}
            leftIcon={<Plus size={16} />}
          >
            Create Promo Code
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-xl)',
            color: '#10b981',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          {actionSuccess}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className={styles.statsOverview} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }}>
        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Total Promo Codes</span>
            <Tag size={18} color="#818CF8" />
          </div>
          <div className={styles.adminStatVal} style={{ color: '#FFFFFF' }}>
            {stats?.totalCount ?? promoCodes.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Configured in system
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Active Codes</span>
            <CheckCircle2 size={18} color="#34D399" />
          </div>
          <div className={styles.adminStatVal} style={{ color: '#34D399' }}>
            {stats?.activeCount ?? promoCodes.filter((p) => p.isActive).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Available for student checkout
          </div>
        </div>

        <div className={styles.adminStatCard}>
          <div className={styles.adminStatHeader}>
            <span>Total Times Used</span>
            <Percent size={18} color="#FBBF24" />
          </div>
          <div className={styles.adminStatVal} style={{ color: '#FBBF24' }}>
            {stats?.totalUses ?? promoCodes.reduce((s, p) => s + p.usedCount, 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Redeemed by students
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Input
            placeholder="Search by code (e.g. PATWARI51, MOCK149)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Filter:
          </span>
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.adminTableWrapper} style={{ marginBottom: '2rem' }}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Promo Code</th>
              <th>Discount Amount</th>
              <th>Effective Price (₹200 Base)</th>
              <th>Status</th>
              <th>Usage Count</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                  Loading promo codes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  No promo codes found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const effectivePrice = Math.max(0, 200 - item.discount);
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            letterSpacing: '0.05em',
                            padding: '0.25rem 0.6rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            borderRadius: '6px',
                            color: '#A5B4FC',
                          }}
                        >
                          {item.code}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>
                        ₹{item.discount} OFF
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                          ₹200
                        </span>
                        <strong style={{ color: '#F5B301', fontSize: '0.95rem' }}>
                          ₹{effectivePrice}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(item)}
                        title="Click to toggle status"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {item.isActive ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            <XCircle size={12} style={{ marginRight: '4px' }} /> Disabled
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.usedCount}</span>
                      {item.maxUses ? (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                          {' '}/ {item.maxUses}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}> (unlimited)</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          title="Edit promo code"
                        >
                          <Edit2 size={14} />
                        </Button>
                        {deleteConfirmId === item.id ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Delete promo code"
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Promo Code' : 'Create New Promo Code'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
          {formError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Promo Code
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder="e.g. PATWARI51 or MOCK149"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={generateRandomCode}
                title="Generate Random Code"
                leftIcon={<Sparkles size={15} />}
              >
                Auto Generate
              </Button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Uppercase characters only (e.g. PATWARI51).
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Discount Amount (₹)
            </label>
            <Input
              type="number"
              min="1"
              max="200"
              placeholder="e.g. 51"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              With ₹200 test series price, ₹51 discount gives final promotional price of ₹149.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Maximum Allowed Redemptions (Optional)
            </label>
            <Input
              type="number"
              min="1"
              placeholder="Leave empty for unlimited redemptions"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary-500)' }}
            />
            <label htmlFor="isActiveCheck" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              Enable this promo code immediately
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              isLoading={isSubmitting}
            >
              {editingId ? 'Save Changes' : 'Create Promo Code'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
