"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";

interface Customer {
  id: string;
  order_id: string;
  received_at: string;
  brand: string | null;
  customer_name: string | null;
  ssn: string | null;
  phone: string | null;
  address: string | null;
  account: string | null;
  model_code: string | null;
  color: string | null;
  contract_period: string | null;
  service_type: string | null;
  monthly_fee: number | null;
  promotion: string[] | null;
  desired_install_date: string | null;
  scheduled_install_date: string | null;
  status: string;
  memo: string | null;
}

const statusList = ["전체", "접수완료", "서명완료", "설치완료"];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR");
}

function parseCurrency(formatted: string): string {
  return formatted.replace(/,/g, "");
}

function generateCopyText(c: Customer): string {
  const lines: string[] = [];
  lines.push(c.brand || "");
  lines.push(
    [c.customer_name, c.ssn, c.phone].filter(Boolean).join(" ")
  );
  if (c.address) lines.push(c.address);
  if (c.account) lines.push(c.account);

  const productLine = [
    c.model_code,
    c.color || null,
    c.contract_period,
    c.service_type,
    c.monthly_fee ? `${formatCurrency(c.monthly_fee)}원` : null,
    c.promotion && c.promotion.length > 0 ? c.promotion.join(",") : null,
  ]
    .filter(Boolean)
    .join(" ");
  if (productLine) lines.push(productLine);

  if (c.desired_install_date) lines.push(`설치희망일: ${c.desired_install_date}`);
  if (c.memo) lines.push(`메모: ${c.memo}`);

  return lines.filter((l) => l.trim()).join("\n");
}

import { TableSkeleton } from "@/components/Skeleton";

export default function ManageContent({ initialData }: { initialData?: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [activeStatus, setActiveStatus] = useState("전체");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id?: string; count?: number } | null>(null);
  const { showToast } = useToast();

  const fetchCustomers = useCallback(async (isInitial = false) => {
    if (isInitial && initialData && activeStatus === "전체" && !search) {
      setCustomers(initialData);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "전체") params.set("status", activeStatus);
      if (search) params.set("search", search);
      // Removed _t for ISR caching to work properly on the API route
      
      const res = await fetch(`/api/customers?${params}`);
      const result = await res.json();
      if (result.success) {
        setCustomers(result.data);
      }
    } catch {
      showToast("고객 목록을 불러올 수 없습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search, showToast, initialData]);

  useEffect(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  const handleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const executeBulkDelete = async () => {
    try {
      const res = await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "delete" }),
      });
      const result = await res.json();
      if (res.ok) {
        showToast(result.message, "success");
        setSelectedIds(new Set());
        fetchCustomers();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmAction({ type: "bulkDelete", count: selectedIds.size });
  };

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action: "updateStatus",
          status: "설치완료",
        }),
      });
      const result = await res.json();
      if (res.ok) {
        showToast(result.message, "success");
        setSelectedIds(new Set());
        fetchCustomers();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  const openDetail = (customer: Customer) => {
    const standardPromos = ["반값할인", "타사보상", "결합할인"];
    const promos = customer.promotion || [];
    const standardSelected = promos.filter((p) => standardPromos.includes(p));
    const customSelected = promos.filter((p) => !standardPromos.includes(p)).join(", ");
    setSelectedCustomer(customer);
    setEditData({
      brand: customer.brand || "",
      customerName: customer.customer_name || "",
      ssn: customer.ssn || "",
      phone: customer.phone || "",
      address: customer.address || "",
      account: customer.account || "",
      modelCode: customer.model_code || "",
      color: customer.color || "",
      contractPeriod: customer.contract_period || "",
      serviceType: customer.service_type || "",
      monthlyFee: customer.monthly_fee != null ? formatCurrency(customer.monthly_fee) : "",
      promotion: standardSelected,
      customPromotion: customSelected,
      desiredInstallDate: customer.desired_install_date || "",
      scheduledInstallDate: customer.scheduled_install_date || "",
      status: customer.status,
      memo: customer.memo || "",
    });
  };

  const handleEditChange = (key: string, value: unknown) => {
    const newData = { ...editData, [key]: value };

    // 설치예정일 선택 시 자동 서명완료
    if (key === "scheduledInstallDate" && value && editData.status === "접수완료") {
      newData.status = "서명완료";
    }

    setEditData(newData);
  };

  const handlePromotionToggle = (promo: string) => {
    const current = (editData.promotion as string[]) || [];

    if (promo === "반값할인" && current.includes("타사보상")) {
      handleEditChange("promotion", [...current.filter((p) => p !== "타사보상"), promo]);
      return;
    }
    if (promo === "타사보상" && current.includes("반값할인")) {
      handleEditChange("promotion", [...current.filter((p) => p !== "반값할인"), promo]);
      return;
    }

    if (current.includes(promo)) {
      handleEditChange("promotion", current.filter((p) => p !== promo));
    } else {
      handleEditChange("promotion", [...current, promo]);
    }
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      const allPromo = [...(editData.promotion as string[])];
      const customPromo = (editData.customPromotion as string || "").trim();
      if (customPromo) {
        allPromo.push(customPromo);
      }
      const { customPromotion: _cp, ...dataWithoutCustom } = editData;
      void _cp;
      const payload = {
        ...dataWithoutCustom,
        monthlyFee: editData.monthlyFee ? parseCurrency(String(editData.monthlyFee)) : "",
        promotion: allPromo,
      };
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        showToast("고객 정보가 수정되었습니다.", "success");
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showToast(String(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("고객이 삭제되었습니다.", "success");
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  const handleDelete = () => {
    if (!selectedCustomer) return;
    setConfirmAction({ type: "singleDelete", id: selectedCustomer.id });
  };

  const handleRowDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmAction({ type: "singleDelete", id });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "bulkDelete") {
      executeBulkDelete();
    } else if (confirmAction.type === "singleDelete" && confirmAction.id) {
      handleDeleteSingle(confirmAction.id);
    }
    setConfirmAction(null);
  };

  const handleCopy = async () => {
    if (!selectedCustomer) return;
    const merged: Customer = {
      ...selectedCustomer,
      brand: (editData.brand as string) || selectedCustomer.brand,
      customer_name: (editData.customerName as string) || selectedCustomer.customer_name,
      ssn: (editData.ssn as string) || selectedCustomer.ssn,
      phone: (editData.phone as string) || selectedCustomer.phone,
      address: (editData.address as string) || selectedCustomer.address,
      account: (editData.account as string) || selectedCustomer.account,
      model_code: (editData.modelCode as string) || selectedCustomer.model_code,
      color: (editData.color as string) || selectedCustomer.color,
      contract_period: (editData.contractPeriod as string) || selectedCustomer.contract_period,
      service_type: (editData.serviceType as string) || selectedCustomer.service_type,
      monthly_fee: editData.monthlyFee ? Number(editData.monthlyFee) : selectedCustomer.monthly_fee,
      promotion: [...((editData.promotion as string[]) || []), ...((editData.customPromotion as string || "").trim() ? [(editData.customPromotion as string).trim()] : [])],
      desired_install_date: (editData.desiredInstallDate as string) || selectedCustomer.desired_install_date,
      memo: (editData.memo as string) || selectedCustomer.memo,
    };
    const copyText = generateCopyText(merged);
    try {
      await navigator.clipboard.writeText(copyText);
      showToast("클립보드에 복사되었습니다!", "success");
    } catch {
      showToast("복사에 실패했습니다.", "error");
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">고객관리</h1>
      <p className="page-subtitle">등록된 고객 목록을 관리하고 진행 상태를 업데이트합니다.</p>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {statusList.map((s) => (
              <button
                key={s}
                className={`filter-tab ${activeStatus === s ? "active" : ""}`}
                onClick={() => setActiveStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {selectedIds.size > 0 && (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                🗑 선택삭제 ({selectedIds.size})
              </button>
              <button className="btn btn-success btn-sm" onClick={handleBulkComplete}>
                ✅ 설치완료 ({selectedIds.size})
              </button>
            </>
          )}
        </div>
        <div className="toolbar-right">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="이름 또는 전화번호 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={customers.length > 0 && selectedIds.size === customers.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>접수일</th>
              <th>브랜드</th>
              <th>고객명</th>
              <th>휴대폰</th>
              <th>모델코드</th>
              <th>진행상태</th>
              <th style={{ width: 120 }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 0 }}>
                  <TableSkeleton rows={10} cols={8} />
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <p>등록된 고객이 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} onClick={() => openDetail(c)}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => handleSelect(c.id)}
                    />
                  </td>
                  <td>{formatDate(c.received_at)}</td>
                  <td>{c.brand || "-"}</td>
                  <td style={{ fontWeight: 600 }}>{c.customer_name || "-"}</td>
                  <td>{c.phone || "-"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.model_code || "-"}</td>
                  <td>
                    <span className={`badge badge-${c.status}`}>
                      <span className="badge-dot" />
                      {c.status}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(c)}>수정</button>
                      <button className="btn btn-danger btn-sm" onClick={(e) => handleRowDelete(e, c.id)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Confirm Modal */}
      {confirmAction && (
        <>
          <div className="panel-overlay" onClick={() => setConfirmAction(null)} />
          <div className="confirm-modal">
            <div className="confirm-modal-icon">⚠️</div>
            <p className="confirm-modal-text">
              {confirmAction.type === "bulkDelete"
                ? `선택한 ${confirmAction.count}건을 삭제하시겠습니까?`
                : "이 고객을 삭제하시겠습니까?"}
            </p>
            <p className="confirm-modal-subtext">삭제된 데이터는 복구할 수 없습니다.</p>
            <div className="confirm-modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>취소</button>
              <button className="btn btn-danger" onClick={executeConfirmAction}>삭제</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Slide Panel */}
      {selectedCustomer && (
        <>
          <div className="panel-overlay" onClick={() => setSelectedCustomer(null)} />
          <div className="slide-panel">
            <div className="panel-header">
              <h2>고객 상세</h2>
              <button className="btn-icon" onClick={() => setSelectedCustomer(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="panel-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span className={`badge badge-${editData.status}`}>
                  <span className="badge-dot" />
                  {editData.status as string}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {selectedCustomer.order_id}
                </span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label className="input-label">접수일시</label>
                  <input className="input-field" value={formatDate(selectedCustomer.received_at)} readOnly style={{ opacity: 0.6 }} />
                </div>
                <div className="detail-item">
                  <label className="input-label">브랜드</label>
                  <input className="input-field" value={editData.brand as string} onChange={(e) => handleEditChange("brand", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">고객명</label>
                  <input className="input-field" value={editData.customerName as string} onChange={(e) => handleEditChange("customerName", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">주민번호</label>
                  <input className="input-field" value={editData.ssn as string} onChange={(e) => handleEditChange("ssn", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">휴대폰</label>
                  <input className="input-field" value={editData.phone as string} onChange={(e) => handleEditChange("phone", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">모델코드</label>
                  <input className="input-field" value={editData.modelCode as string} onChange={(e) => handleEditChange("modelCode", e.target.value)} />
                </div>
                <div className="detail-item full-width">
                  <label className="input-label">설치주소</label>
                  <textarea className="input-field" style={{ minHeight: 56 }} value={editData.address as string} onChange={(e) => handleEditChange("address", e.target.value)} />
                </div>
                <div className="detail-item full-width">
                  <label className="input-label">계좌/카드</label>
                  <input className="input-field" value={editData.account as string} onChange={(e) => handleEditChange("account", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">색상</label>
                  <input className="input-field" value={editData.color as string} onChange={(e) => handleEditChange("color", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">의무기간</label>
                  <input className="input-field" value={editData.contractPeriod as string} onChange={(e) => handleEditChange("contractPeriod", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">관리유형</label>
                  <input className="input-field" value={editData.serviceType as string} onChange={(e) => handleEditChange("serviceType", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">월 렌탈료</label>
                  <input
                    className="input-field"
                    type="text"
                    inputMode="numeric"
                    value={editData.monthlyFee as string}
                    onChange={(e) => {
                      const raw = parseCurrency(e.target.value);
                      if (raw === "" || /^\d+$/.test(raw)) {
                        handleEditChange("monthlyFee", raw ? formatCurrency(raw) : "");
                      }
                    }}
                    placeholder="예: 38,610"
                  />
                </div>

                <div className="detail-item full-width">
                  <label className="input-label">프로모션</label>
                  <div className="toggle-group" style={{ alignItems: "center" }}>
                    {["반값할인", "타사보상", "결합할인"].map((promo) => (
                      <button
                        key={promo}
                        className={`toggle-btn ${((editData.promotion as string[]) || []).includes(promo) ? "active" : ""}`}
                        onClick={() => handlePromotionToggle(promo)}
                      >
                        {promo}
                      </button>
                    ))}
                    <input
                      className="input-field"
                      style={{ flex: 1, minWidth: 120, margin: 0 }}
                      placeholder="추가 프로모션 입력"
                      value={(editData.customPromotion as string) || ""}
                      onChange={(e) => handleEditChange("customPromotion", e.target.value)}
                    />
                  </div>
                </div>

                <div className="detail-item">
                  <label className="input-label">설치희망일</label>
                  <input className="input-field" value={editData.desiredInstallDate as string} onChange={(e) => handleEditChange("desiredInstallDate", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">설치예정일</label>
                  <input className="input-field" type="date" value={editData.scheduledInstallDate as string} onChange={(e) => handleEditChange("scheduledInstallDate", e.target.value)} />
                </div>
                <div className="detail-item">
                  <label className="input-label">진행상태</label>
                  <select className="select-field" value={editData.status as string} onChange={(e) => handleEditChange("status", e.target.value)}>
                    <option value="접수완료">접수완료</option>
                    <option value="서명완료">서명완료</option>
                    <option value="설치완료">설치완료</option>
                  </select>
                </div>
                <div className="detail-item">
                  <label className="input-label">&nbsp;</label>
                </div>
                <div className="detail-item full-width">
                  <label className="input-label">메모</label>
                  <textarea className="input-field" style={{ minHeight: 70, resize: "vertical" }} value={editData.memo as string} onChange={(e) => handleEditChange("memo", e.target.value)} />
                </div>
              </div>

              {/* Copy text box */}
              <div style={{ marginTop: 24 }}>

                <div className="copy-box">
                  {generateCopyText({
                    ...selectedCustomer,
                    brand: (editData.brand as string) || selectedCustomer.brand,
                    customer_name: (editData.customerName as string) || selectedCustomer.customer_name,
                    ssn: (editData.ssn as string) || selectedCustomer.ssn,
                    phone: (editData.phone as string) || selectedCustomer.phone,
                    address: (editData.address as string) || selectedCustomer.address,
                    account: (editData.account as string) || selectedCustomer.account,
                    model_code: (editData.modelCode as string) || selectedCustomer.model_code,
                    color: (editData.color as string) || selectedCustomer.color,
                    contract_period: (editData.contractPeriod as string) || selectedCustomer.contract_period,
                    service_type: (editData.serviceType as string) || selectedCustomer.service_type,
                    monthly_fee: editData.monthlyFee ? Number(editData.monthlyFee) : selectedCustomer.monthly_fee,
                    promotion: [...((editData.promotion as string[]) || []), ...((editData.customPromotion as string || "").trim() ? [(editData.customPromotion as string).trim()] : [])],
                    desired_install_date: (editData.desiredInstallDate as string) || selectedCustomer.desired_install_date,
                    memo: (editData.memo as string) || selectedCustomer.memo,
                  })}
                  <button className="btn btn-secondary btn-sm copy-btn" onClick={handleCopy}>
                    📋 복사
                  </button>
                </div>
              </div>
            </div>

            <div className="panel-footer">
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                삭제
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" /> 저장 중...</> : "저장"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
