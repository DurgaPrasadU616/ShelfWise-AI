import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  LoaderCircle,
  Plus,
  ScanText,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  AlertTriangle,
} from 'lucide-react';
import ocrService from '../services/ocr.service';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert } from '../components/ui/alert';
import { useToast } from '../components/ui/toast';
import { cn } from '../utils/cn';
import { formatCurrency, formatDateTime } from '../utils/format';

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT_ATTR = '.pdf,image/png,image/jpeg,image/webp';

const PROCESS_STEPS = ['Uploading document', 'Extracting line items with AI', 'Verifying extracted data'];

const CATEGORY_OPTIONS = [
  'Medicine',
  'Food & Bev',
  'Cosmetics',
  'Supplies',
  'Electronics',
  'Other',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported file type. Use PDF, PNG, JPG, or WEBP.';
  if (file.size > MAX_SIZE) return 'File exceeds the 10MB size limit.';
  return null;
}

function emptyItem() {
  return {
    productName: '',
    sku: '',
    category: 'Other',
    quantity: 0,
    unitCost: 0,
    batchNo: '',
    mfgDate: '',
    expiryDate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  };
}

const EDIT_INPUT =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm transition-colors hover:border-border focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20 focus:outline-none';

const INVALID_INPUT =
  'border-red-500/50 bg-red-500/10 focus:border-red-500 focus:bg-card focus:ring-red-500/20';

export default function Ocr() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | processing | needs_review | failed
  const [stepIndex, setStepIndex] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const setFileValidated = (next) => {
    const problem = next ? validateFile(next) : null;
    if (problem) {
      setError(problem);
      return;
    }
    setFile(next);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) setFileValidated(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase('processing');
    setStepIndex(0);
    setError(null);

    try {
      const uploadRes = await ocrService.uploadInvoice(file);
      const uploadId = uploadRes?.data?.uploadId;
      if (!uploadId) throw new Error('Upload failed — no upload id returned.');

      setStepIndex(1);
      let invoiceData = null;

      // Poll until OCR finishes (max ~30 seconds)
      for (let attempt = 0; attempt < 20; attempt++) {
        const statusRes = await ocrService.getUploadStatus(uploadId);
        invoiceData = statusRes?.data;
        if (!invoiceData) throw new Error('Could not load upload status.');
        if (invoiceData.status !== 'processing') break;
        await sleep(1500);
      }

      if (invoiceData.status === 'failed') {
        setError(invoiceData.error || 'OCR processing failed.');
        setPhase('failed');
        return;
      }

      setInvoice(invoiceData);
      setStepIndex(2);
      await sleep(400);
      setPhase('needs_review');

      // Notify user if OCR had an issue but recovered gracefully
      if (invoiceData.error && (invoiceData.severity === 'warning' || invoiceData.severity === 'error')) {
        toast({
          title: invoiceData.severity === 'error' ? 'OCR note' : 'AI unavailable',
          description: invoiceData.error,
          variant: 'warning',
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Upload failed.');
      setPhase('failed');
    }
  };

  const handleItemChange = (index, field, value) => {
    setInvoice((prev) => {
      if (!prev) return prev;
      const items = [...prev.extractedItems];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, extractedItems: items };
    });
  };

  const handleAddItem = () => {
    setInvoice((prev) => (prev ? { ...prev, extractedItems: [...prev.extractedItems, emptyItem()] } : prev));
  };

  const handleRemoveItem = (index) => {
    setInvoice((prev) =>
      prev ? { ...prev, extractedItems: prev.extractedItems.filter((_, i) => i !== index) } : prev,
    );
  };

  const validation = useMemo(() => {
    const items = invoice?.extractedItems || [];
    let errorCount = 0;
    const itemErrors = items.map((item) => {
      const missing = [];
      if (!item.productName || item.productName.trim() === '') missing.push('productName');
      const qty = Number(item.quantity);
      if (item.quantity === '' || item.quantity == null || Number.isNaN(qty) || qty < 0) missing.push('quantity');
      const cost = Number(item.unitCost);
      if (item.unitCost === '' || item.unitCost == null || Number.isNaN(cost) || cost < 0) missing.push('unitCost');
      if (!item.batchNo || item.batchNo.trim() === '') missing.push('batchNo');
      if (!item.mfgDate) missing.push('mfgDate');
      if (!item.expiryDate) missing.push('expiryDate');
      if (!item.category) missing.push('category');

      errorCount += missing.length;
      return missing;
    });

    return { errorCount, itemErrors };
  }, [invoice]);

  const handleCommit = async () => {
    if (validation.errorCount > 0) return;
    if (!invoice?.extractedItems?.length) return;

    const payload = invoice.extractedItems.map((item, i) => ({
      ...item,
      sku: (item.sku && item.sku.trim()) || `SKU-${Date.now()}-${i}`,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      mfgDate: item.mfgDate || null,
      expiryDate: item.expiryDate || null,
    }));

    try {
      setPhase('processing');
      setStepIndex(2);
      const res = await ocrService.commitOcr(invoice._id, payload);
      const result = res?.data;
      
      const health = result?.analytics?.healthScore;
      toast({
        title: 'Inventory saved',
        description: `${payload.length} items committed.${health != null ? ` Health score: ${Math.round(health)}/100.` : ''}`,
        variant: 'success',
      });
      
      // Auto-navigate to dashboard on success
      navigate('/dashboard?refresh=ocr');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save inventory.');
      setPhase('needs_review');
    }
  };

  const handleReject = async () => {
    if (!confirmReject) {
      setConfirmReject(true);
      setTimeout(() => setConfirmReject(false), 3000);
      return;
    }
    try {
      await ocrService.rejectOcr(invoice._id, 'Rejected by user');
      setRejected(true);
      setPhase('failed');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Reject failed.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setInvoice(null);
    setPhase('idle');
    setError(null);
    setConfirmReject(false);
    setRejected(false);
    setStepIndex(0);
  };

  const totals = useMemo(() => {
    const items = invoice?.extractedItems || [];
    const total = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitCost || 0), 0);
    return { count: items.length, total };
  }, [invoice]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="OCR Processing"
        description="Upload supplier invoices for automatic AI extraction"
        icon={<ScanText className="h-5 w-5" />}
      />

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {/* ── Dropzone ─────────────────────────────────────────── */}
        {phase === 'idle' && (
          <motion.div key="dropzone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            <Card
              className={cn(
                'flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-colors sm:p-14',
                dragActive ? 'border-primary bg-primary/5' : 'border-border/80 hover:border-primary/40',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPT_ATTR}
                onChange={(e) => {
                  setFileValidated(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />

              <div
                role="button"
                tabIndex={0}
                aria-label="Upload an invoice"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className="flex w-full cursor-pointer flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">Drop invoice here or click to browse</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Supported formats: PDF, PNG, JPG, WEBP — up to 10MB. AI will extract all line items.
                </p>
              </div>

              {file && (
                <div className="mt-6 flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row">
                  <FileText className="h-8 w-8 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <Button onClick={handleUpload} loading={phase === 'processing'}>
                    <ScanText className="h-4 w-4" />
                    Process document
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── Progress ─────────────────────────────────────────── */}
        {phase === 'processing' && (
          <motion.div key="progress" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            <Card className="p-10">
              <div className="flex flex-col items-center gap-6">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold">Analysing your invoice</h3>
                  <p className="text-sm text-muted-foreground">Extracting product details, prices and dates…</p>
                </div>
                <div className="w-full max-w-sm">
                  {PROCESS_STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-3 py-2.5">
                      {i < stepIndex ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                      ) : i === stepIndex ? (
                        <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
                      )}
                      <span className={cn('text-sm', i <= stepIndex ? 'text-foreground' : 'text-muted-foreground/60')}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Review ───────────────────────────────────────────── */}
        {phase === 'needs_review' && invoice && (
          <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">Review & Confirm</h2>
                  <p className="text-sm text-muted-foreground">
                    Verify and complete all required fields before saving inventory.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleReject}>
                  {confirmReject ? <AlertCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {confirmReject ? 'Confirm reject?' : 'Reject'}
                </Button>
                <Button onClick={handleCommit} disabled={validation.errorCount > 0 || invoice.extractedItems.length === 0}>
                  <Check className="h-4 w-4" />
                  Approve &amp; Save
                </Button>
              </div>
            </div>
            
            {invoice.error && (
              <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {invoice.severity === 'error' ? 'Limited extraction' : 'AI extraction temporarily unavailable'}
                  </p>
                  <p className="mt-0.5 text-warning/90">{invoice.error}</p>
                </div>
              </div>
            )}

            {validation.errorCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium">Action Required:</span> {validation.errorCount} missing or invalid field(s). Please fill out all highlighted fields below to continue.
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {invoice.filename}
                  </CardTitle>
                  <CardDescription>
                    {formatSize(invoice.size)} · {invoice.ocrEngine?.includes('rule') ? 'Basic OCR extraction' : (invoice.ocrEngine || 'OCR engine')} · uploaded {formatDateTime(invoice.createdAt)}
                  </CardDescription>
                </div>
                <span className="hidden font-mono text-sm text-muted-foreground sm:block">
                  Total: <span className="font-semibold text-foreground">{formatCurrency(totals.total)}</span>
                </span>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b border-border/70 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        <th className="w-48 px-3 py-3">Product Name *</th>
                        <th className="w-28 px-3 py-3">Category *</th>
                        <th className="w-20 px-3 py-3">Qty *</th>
                        <th className="w-24 px-3 py-3">Unit Cost *</th>
                        <th className="w-32 px-3 py-3">Batch No *</th>
                        <th className="w-36 px-3 py-3">Mfg Date *</th>
                        <th className="w-36 px-3 py-3">Expiry Date *</th>
                        <th className="w-24 px-3 py-3">SKU</th>
                        <th className="px-3 py-3 text-right">Line Total</th>
                        <th className="w-12 px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {invoice.extractedItems.map((item, index) => {
                        const isInvalid = (field) => validation.itemErrors[index]?.includes(field);
                        return (
                          <tr key={index} className="transition-colors hover:bg-muted/30">
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                placeholder="Product name"
                                value={item.productName || ''}
                                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                className={cn(EDIT_INPUT, isInvalid('productName') && INVALID_INPUT)}
                                aria-label="Product name"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={item.category || ''}
                                onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                className={cn(EDIT_INPUT, 'cursor-pointer', isInvalid('category') && INVALID_INPUT)}
                                aria-label="Category"
                              >
                                <option value="" disabled>Select...</option>
                                {CATEGORY_OPTIONS.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.quantity !== undefined ? item.quantity : ''}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className={cn(EDIT_INPUT, 'text-right font-mono', isInvalid('quantity') && INVALID_INPUT)}
                                aria-label="Quantity"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost !== undefined ? item.unitCost : ''}
                                onChange={(e) => handleItemChange(index, 'unitCost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className={cn(EDIT_INPUT, 'text-right font-mono', isInvalid('unitCost') && INVALID_INPUT)}
                                aria-label="Unit cost"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                placeholder="Batch No"
                                value={item.batchNo || ''}
                                onChange={(e) => handleItemChange(index, 'batchNo', e.target.value)}
                                className={cn(EDIT_INPUT, 'font-mono text-xs', isInvalid('batchNo') && INVALID_INPUT)}
                                aria-label="Batch Number"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="date"
                                value={toDateInputValue(item.mfgDate)}
                                onChange={(e) => handleItemChange(index, 'mfgDate', e.target.value)}
                                className={cn(EDIT_INPUT, isInvalid('mfgDate') && INVALID_INPUT)}
                                aria-label="Manufacturing date"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="date"
                                value={toDateInputValue(item.expiryDate)}
                                onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                                className={cn(EDIT_INPUT, isInvalid('expiryDate') && INVALID_INPUT)}
                                aria-label="Expiry date"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                placeholder="SKU"
                                value={item.sku || ''}
                                onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                                className={cn(EDIT_INPUT, 'font-mono text-xs')}
                                aria-label="SKU"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                              {formatCurrency((item.quantity || 0) * (item.unitCost || 0))}
                            </td>
                            <td className="px-2 py-2 text-right">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {invoice.extractedItems.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-sm">
                    <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <p className="font-medium text-warning">No items extracted automatically</p>
                    <p className="max-w-sm text-muted-foreground">
                      Add items manually below, or reject and re-upload a clearer image.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="h-4 w-4" />
                    Add item
                  </Button>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-mono">{totals.count}</span> items
                    </span>
                    <span className="font-mono">
                      Total: <span className="font-semibold">{formatCurrency(totals.total)}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Failed ───────────────────────────────────────────── */}
        {phase === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
            <Card className="flex flex-col items-center justify-center border-destructive/20 bg-destructive/8 p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-destructive">
                {rejected ? 'Invoice rejected' : 'Processing failed'}
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {rejected
                  ? 'This invoice was rejected and no inventory was saved.'
                  : error || 'The invoice could not be processed. No inventory was saved.'}
              </p>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  {rejected ? 'Upload another invoice' : 'Try again'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
