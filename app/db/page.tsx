"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";

interface Lead {
  id: string;
  phone: string;
  customer_name: string | null;
  memo: string | null;
  status: string;
  created_at: string;
}

const statusList = ["전체", "상담대기", "상담완료", "팔로업", "계약완료"];
const statusOptions = ["상담대기", "상담완료", "팔로업", "계약완료"];

function formatPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export default function DBPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [addStatus, setAddStatus] = useState("상담완료");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeStatus, setActiveStatus] = useState("전체");
  const { showToast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "전체") params.set("status", activeStatus);
      params.set("_t", Date.now().toString());

      const res = await fetch(`/api/leads?${params}`);
      const result = await res.json();
      if (result.success) setLeads(result.data);
    } catch {
      showToast("잠재고객 목록을 불러올 수 없습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, activeStatus]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleAdd = async () => {
    if (!phone.trim()) {
      showToast("전화번호는 필수입니다.", "error");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          customerName: name.trim() || null,
          memo: memo.trim() || null,
          status: addStatus,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        showToast("잠재고객이 등록되었습니다.", "success");
        setPhone("");
        setName("");
        setMemo("");
        setAddStatus("상담완료");
        fetchLeads();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showToast(String(err), "error");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditValues({
      phone: lead.phone,
      customerName: lead.customer_name || "",
      memo: lead.memo || "",
      status: lead.status || "상담대기",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const payload = {
        ...editValues,
        phone: formatPhone(editValues.phone),
      };
      const res = await fetch(`/api/leads/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        showToast("수정되었습니다.", "success");
        setEditingId(null);
        fetchLeads();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("삭제되었습니다.", "success");
        fetchLeads();
      } else {
        const result = await res.json();
        throw new Error(result.error || "삭제 실패");
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast("상태가 변경되었습니다.", "success");
        fetchLeads();
      } else {
        const result = await res.json();
        throw new Error(result.error || "상태 변경 실패");
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  // Checkbox selection
  const handleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}건을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "delete" }),
      });
      const result = await res.json();
      if (res.ok) {
        showToast(result.message, "success");
        setSelectedIds(new Set());
        fetchLeads();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  const colCount = 6; // checkbox + 고객명 + 연락처 + 메모 + 상태 + 액션

  return (
    <div className="page-container">
      <h1 className="page-title">DB</h1>
      <p className="page-subtitle">잠재고객(콜드DB)을 관리합니다. 전화번호만으로 빠르게 등록할 수 있습니다.</p>

      {/* Add new lead */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="lead-input-row">
          <div className="field field-phone">
            <label className="input-label">전화번호 *</label>
            <input
              className="input-field"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field field-name">
            <label className="input-label">이름</label>
            <input
              className="input-field"
              placeholder="선택"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field field-memo">
            <label className="input-label">메모</label>
            <input
              className="input-field"
              placeholder="선택"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <div className="field" style={{ minWidth: 110 }}>
            <label className="input-label">상태</label>
            <select
              className="select-field"
              value={addStatus}
              onChange={(e) => setAddStatus(e.target.value)}
              style={{ height: 40 }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={adding} style={{ height: 40, alignSelf: "flex-end" }}>
            {adding ? <span className="spinner" /> : "➕ 등록"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {statusList.map((status) => (
              <button
                key={status}
                className={`filter-tab ${activeStatus === status ? "active" : ""}`}
                onClick={() => setActiveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
          {selectedIds.size > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              🗑 선택삭제 ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Leads table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={leads.length > 0 && selectedIds.size === leads.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>고객명</th>
              <th>연락처</th>
              <th>메모</th>
              <th>상태</th>
              <th style={{ width: 120 }}>액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="loading-overlay">
                    <div className="spinner spinner-lg" />
                    <span>불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <p>등록된 잠재고객이 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => handleSelect(lead.id)}
                    />
                  </td>
                  {editingId === lead.id ? (
                    <>
                      <td>
                        <input
                          className="input-field"
                          value={editValues.customerName || ""}
                          onChange={(e) => setEditValues({ ...editValues, customerName: e.target.value })}
                          style={{ maxWidth: 120 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input-field"
                          value={editValues.phone}
                          onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                          style={{ maxWidth: 160 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input-field"
                          value={editValues.memo || ""}
                          onChange={(e) => setEditValues({ ...editValues, memo: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="select-field"
                          value={editValues.status || "상담대기"}
                          onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                          style={{ maxWidth: 130 }}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-success btn-sm" onClick={handleSaveEdit}>저장</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>취소</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600 }}>{lead.customer_name || "-"}</td>
                      <td>{lead.phone}</td>
                      <td style={{ color: "var(--text-secondary)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lead.memo || "-"}
                      </td>
                      <td>
                        <select
                          className="select-field"
                          value={lead.status || "상담대기"}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          style={{ maxWidth: 130 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(lead)}>수정</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lead.id)}>삭제</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
