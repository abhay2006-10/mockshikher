'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Download,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from '@/app/admin/admin.module.css';

interface AdminImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultExamSlug?: string;
  defaultMockNumber?: number;
  onSuccess?: () => void;
}

interface RowErrorItem {
  rowNumber: number;
  column: string;
  message: string;
}

interface PreviewRow {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  exam: string;
  mock_test_number: number;
  question: string;
  subject: string;
  correct_answer: string;
  difficulty: string;
  marks: number;
  negative_marks: number;
}

interface ImportSummary {
  totalRows: number;
  validRows?: number;
  invalidRows?: number;
  duplicateRows?: number;
  created?: number;
  updated?: number;
  skipped?: number;
}

/**
 * Safely parses API responses, preventing "Unexpected token '<', <html>... is not valid JSON" crashes.
 */
async function parseApiResponse(res: Response): Promise<{ ok: boolean; data: any; errorMessage: string }> {
  const contentType = res.headers.get('content-type') || '';
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (readErr: any) {
    return {
      ok: false,
      data: null,
      errorMessage: `Failed to read server response: ${readErr.message}`,
    };
  }

  const isJson = contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[');

  if (isJson) {
    try {
      const data = JSON.parse(rawText);
      if (!res.ok) {
        return {
          ok: false,
          data,
          errorMessage: data.error || data.message || `Server error (HTTP ${res.status})`,
        };
      }
      return { ok: true, data, errorMessage: '' };
    } catch {
      // JSON parse error on malformed JSON payload
    }
  }

  // Handle HTML or non-JSON responses with clear diagnostics
  let helpfulMessage = '';
  if (res.status === 401) {
    helpfulMessage = 'Authentication session expired or missing (HTTP 401). Please refresh the page and log in as admin.';
  } else if (res.status === 403) {
    helpfulMessage = 'Forbidden (HTTP 403): You do not have admin permissions to perform question imports.';
  } else if (res.status === 404) {
    helpfulMessage = 'API endpoint not found (HTTP 404): /api/admin/questions/import.';
  } else if (res.status === 413) {
    helpfulMessage = 'File payload is too large for the server (HTTP 413 Payload Too Large). Please split CSV into smaller batches.';
  } else if (res.status >= 500) {
    helpfulMessage = `Internal server error (HTTP ${res.status}). The server or database encountered an issue.`;
  } else {
    helpfulMessage = `Server returned an unexpected non-JSON response (HTTP ${res.status}).`;
  }

  // Extract <title> or <body> text if HTML was returned
  const titleMatch = rawText.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    helpfulMessage += ` Details: ${titleMatch[1].trim()}`;
  }

  return {
    ok: false,
    data: null,
    errorMessage: helpfulMessage,
  };
}

export default function AdminImportModal({
  isOpen,
  onClose,
  defaultExamSlug,
  defaultMockNumber,
  onSuccess,
}: AdminImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [targetExamSlug, setTargetExamSlug] = useState<string>(defaultExamSlug || '');
  const [targetMockNumber, setTargetMockNumber] = useState<number | undefined>(defaultMockNumber);
  const [availableExams, setAvailableExams] = useState<
    { id: string; name: string; slug: string; mockTests?: { id: string; testNumber: number; name: string }[] }[]
  >([]);

  const [isDragging, setIsDragging] = useState(false);
  const [createMissingMockTests, setCreateMissingMockTests] = useState(true);
  const [createMissingSubjects, setCreateMissingSubjects] = useState(true);
  const [replaceAllQuestions, setReplaceAllQuestions] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [rowErrors, setRowErrors] = useState<RowErrorItem[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    created?: number;
    updated?: number;
    skipped?: number;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available exams when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTargetExamSlug(defaultExamSlug || '');
      setTargetMockNumber(defaultMockNumber);
      fetch('/api/admin/exams')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.exams) {
            setAvailableExams(data.exams);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultExamSlug, defaultMockNumber]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setPreviewRows([]);
    setRowErrors([]);
    setSummary(null);
    setExecutionResult(null);
    setServerError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilePicked = async (pickedFile: File) => {
    // Clear old state completely to prevent stale React state
    setFile(pickedFile);
    setPreviewRows([]);
    setRowErrors([]);
    setSummary(null);
    setExecutionResult(null);
    setServerError(null);

    await runPreview(pickedFile, createMissingMockTests, createMissingSubjects);
  };

  const runPreview = async (
    targetFile: File,
    createMocks: boolean,
    createSubj: boolean
  ) => {
    setIsValidating(true);
    setServerError(null);
    setPreviewRows([]);
    setRowErrors([]);
    setSummary(null);

    const formData = new FormData();
    formData.append('file', targetFile);
    formData.append('mode', 'preview');
    formData.append('createMissingMockTests', createMocks ? 'true' : 'false');
    formData.append('createMissingSubjects', createSubj ? 'true' : 'false');
    if (targetExamSlug) formData.append('targetExamSlug', targetExamSlug);
    if (targetMockNumber) formData.append('targetMockNumber', String(targetMockNumber));

    try {
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        body: formData,
      });

      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        setServerError(parsed.errorMessage);
        if (parsed.data?.rowErrors) setRowErrors(parsed.data.rowErrors);
      } else {
        setSummary(parsed.data.summary);
        setPreviewRows(parsed.data.preview || []);
        setRowErrors(parsed.data.rowErrors || []);
      }
    } catch (err: any) {
      setServerError(err.message || 'Network error during validation preview.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setIsExecuting(true);
    setServerError(null);
    setExecutionResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', 'execute');
    formData.append('createMissingMockTests', createMissingMockTests ? 'true' : 'false');
    formData.append('createMissingSubjects', createMissingSubjects ? 'true' : 'false');
    formData.append('replaceAllQuestions', replaceAllQuestions ? 'true' : 'false');
    if (targetExamSlug) formData.append('targetExamSlug', targetExamSlug);
    if (targetMockNumber) formData.append('targetMockNumber', String(targetMockNumber));

    try {
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        body: formData,
      });

      const parsed = await parseApiResponse(res);
      if (!parsed.ok) {
        setServerError(parsed.errorMessage);
        if (parsed.data?.rowErrors) setRowErrors(parsed.data.rowErrors);
      } else {
        setExecutionResult({
          success: true,
          message: parsed.data.message,
          created: parsed.data.summary?.created,
          updated: parsed.data.summary?.updated,
          skipped: parsed.data.summary?.skipped,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setServerError(err.message || 'Network error during import execution.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={styles.drawerOverlay} onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className={styles.drawerModal}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '95%' }}
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={24} color="#F5B301" />
            <div>
              <h3 className={styles.drawerTitle}>Upload Mock Tests & Questions (CSV/Excel)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                {targetExamSlug
                  ? `Selected Series: ${targetExamSlug} ${targetMockNumber ? `• Mock #${targetMockNumber}` : ''}`
                  : 'Select an exam series below or auto-detect from CSV'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Exam Series & Mock Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F5B301', display: 'block', marginBottom: '0.35rem' }}>
                Target Exam Series:
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: 'var(--color-bg-primary)',
                  color: '#fff',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                }}
                value={targetExamSlug}
                onChange={(e) => {
                  setTargetExamSlug(e.target.value);
                  setTargetMockNumber(undefined);
                }}
              >
                <option value="">Auto-detect from CSV (or select series)</option>
                {availableExams.map((ex) => (
                  <option key={ex.id} value={ex.slug}>
                    {ex.name} ({ex.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F5B301', display: 'block', marginBottom: '0.35rem' }}>
                Target Mock Test (Optional):
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: 'var(--color-bg-primary)',
                  color: '#fff',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                }}
                value={targetMockNumber || ''}
                onChange={(e) => setTargetMockNumber(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              >
                <option value="">Auto-detect from CSV (or select mock)</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Mock #{num} {num === 1 ? '(Free Diagnostic)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Server Error Alert */}
          {serverError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                color: '#F87171',
                fontSize: '0.875rem',
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Error: </strong>
                {serverError}
              </div>
            </div>
          )}

          {/* Success Result Summary */}
          {executionResult && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '1.25rem',
                color: '#34D399',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
                <CheckCircle2 size={22} color="#10B981" />
                <span>Import Execution Completed Successfully</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#E2E8F0' }}>
                {executionResult.message}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Questions Created</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>{executionResult.created ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Questions Updated</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8' }}>{executionResult.updated ?? 0}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Rows Skipped</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>{executionResult.skipped ?? 0}</div>
                </div>
              </div>

              {/* Action buttons to allow uploading another mock immediately */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <Button
                  variant="accent"
                  size="md"
                  onClick={handleReset}
                  leftIcon={<Upload size={16} />}
                >
                  Upload Another Mock Test (CSV / Excel)
                </Button>
                <Button variant="secondary" size="md" onClick={onClose}>
                  Done & Close
                </Button>
              </div>
            </div>
          )}

          {/* Drag & Drop File Picker Zone */}
          {!executionResult && (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFilePicked(e.dataTransfer.files[0]);
                  }
                }}
                style={{
                  border: `2px dashed ${isDragging ? '#F5B301' : 'var(--color-border)'}`,
                  background: isDragging ? 'rgba(245, 179, 1, 0.05)' : 'var(--color-bg-secondary)',
                  borderRadius: '12px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFilePicked(e.target.files[0]);
                    }
                  }}
                />

                <Upload size={36} color="#F5B301" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ color: '#fff', margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  {file ? file.name : 'Choose CSV / Excel file or drag & drop here'}
                </h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB • Click to choose a different file`
                    : 'Supports UTF-8 CSV (with/without BOM), CRLF/LF, multiline Hindi text, and Excel (.xlsx)'}
                </p>
              </div>

              {/* Template download link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <a
                  href="/api/admin/questions/template"
                  download="mockshikhar_questions_template.csv"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: '#F5B301',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <Download size={13} />
                  <span>Download Clean Sample Template (1 row)</span>
                </a>
              </div>
            </div>
          )}

          {/* Import Configuration Checkboxes */}
          {!executionResult && (
            <div
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Import Options & Fallbacks:
              </span>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0' }}>
                <input
                  type="checkbox"
                  checked={createMissingMockTests}
                  onChange={(e) => {
                    setCreateMissingMockTests(e.target.checked);
                    if (file) runPreview(file, e.target.checked, createMissingSubjects);
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                />
                <span>
                  <strong>Create missing mock tests</strong> (auto-creates Mock Test row if mock_test_number does not exist in exam)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#E2E8F0' }}>
                <input
                  type="checkbox"
                  checked={createMissingSubjects}
                  onChange={(e) => {
                    setCreateMissingSubjects(e.target.checked);
                    if (file) runPreview(file, createMissingMockTests, e.target.checked);
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                />
                <span>
                  <strong>Create missing subjects/topics</strong> (case-insensitive trimmed matching; auto-creates if missing)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: replaceAllQuestions ? '#F87171' : '#94A3B8' }}>
                <input
                  type="checkbox"
                  checked={replaceAllQuestions}
                  onChange={(e) => setReplaceAllQuestions(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#EF4444' }}
                />
                <span>
                  <strong>Replace all questions in this mock</strong> (deletes existing questions in target mock; strictly blocked if students have attempts)
                </span>
              </label>
            </div>
          )}

          {/* Validation Status Indicator */}
          {isValidating && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#F5B301', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} className="spin" />
              <span>Analyzing file rows & validating data...</span>
            </div>
          )}

          {/* Validation Summary & Preview */}
          {summary && !executionResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Validation Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                <div style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Total Rows</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{summary.totalRows}</div>
                </div>
                <div style={{ background: 'var(--color-bg-primary)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#34D399' }}>Valid Rows</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10B981' }}>{summary.validRows}</div>
                </div>
                <div style={{ background: 'var(--color-bg-primary)', border: `1px solid ${summary.invalidRows ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-border)'}`, borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: summary.invalidRows ? '#F87171' : '#94A3B8' }}>Invalid Rows</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: summary.invalidRows ? '#EF4444' : '#94A3B8' }}>{summary.invalidRows}</div>
                </div>
                <div style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Duplicates / Warnings</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F5B301' }}>{summary.duplicateRows}</div>
                </div>
              </div>

              {/* Row-Level Errors Table */}
              {rowErrors.length > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>Row-Level Errors ({rowErrors.length}):</span>
                  </div>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#94A3B8', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <th style={{ padding: '0.35rem' }}>Row #</th>
                        <th style={{ padding: '0.35rem' }}>Column</th>
                        <th style={{ padding: '0.35rem' }}>Error Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowErrors.map((err, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.35rem', color: '#F5B301', fontWeight: 700 }}>Row {err.rowNumber}</td>
                          <td style={{ padding: '0.35rem', color: '#E2E8F0', fontFamily: 'monospace' }}>{err.column}</td>
                          <td style={{ padding: '0.35rem', color: '#F87171' }}>{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--color-bg-secondary)', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#fff', borderBottom: '1px solid var(--color-border)' }}>
                    Preview (First {previewRows.length} rows):
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: 'var(--color-bg-primary)', position: 'sticky', top: 0 }}>
                        <tr style={{ color: '#94A3B8', borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Row</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Exam</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Mock</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Question Snippet</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Subject</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Ans</th>
                          <th style={{ padding: '0.4rem 0.6rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((r) => (
                          <tr key={r.rowNumber} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                            <td style={{ padding: '0.4rem 0.6rem', color: '#94A3B8' }}>{r.rowNumber}</td>
                            <td style={{ padding: '0.4rem 0.6rem', color: '#fff' }}>{r.exam}</td>
                            <td style={{ padding: '0.4rem 0.6rem', color: '#F5B301' }}>#{r.mock_test_number}</td>
                            <td style={{ padding: '0.4rem 0.6rem', color: '#E2E8F0', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.question}
                            </td>
                            <td style={{ padding: '0.4rem 0.6rem', color: '#38BDF8' }}>{r.subject}</td>
                            <td style={{ padding: '0.4rem 0.6rem', fontWeight: 800, color: '#10B981' }}>{r.correct_answer}</td>
                            <td style={{ padding: '0.4rem 0.6rem' }}>
                              {r.isValid ? (
                                <span style={{ color: '#10B981', fontWeight: 600 }}>Valid</span>
                              ) : (
                                <span style={{ color: '#EF4444', fontWeight: 600 }}>Error</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter} style={{ justifyContent: 'space-between' }}>
          <div>
            {file && !executionResult && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Choose Different File
              </Button>
            )}
            {executionResult && (
              <Button variant="accent" size="sm" onClick={handleReset} leftIcon={<Upload size={14} />}>
                Upload Another Mock Test
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <Button variant="secondary" size="md" onClick={onClose}>
              {executionResult ? 'Close' : 'Cancel'}
            </Button>
            {!executionResult && (
              <Button
                variant="accent"
                size="md"
                disabled={!file || isValidating || isExecuting || (summary?.validRows === 0)}
                onClick={handleConfirmImport}
                leftIcon={isExecuting ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
              >
                {isExecuting ? 'Importing to Database...' : `Confirm & Import (${summary?.validRows ?? 0} Valid Rows)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
