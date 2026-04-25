"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

function formatCurrency(value: string): string {
  const raw = value.replace(/,/g, "");
  if (!raw || isNaN(Number(raw))) return value;
  return Number(raw).toLocaleString("ko-KR");
}

function parseCurrency(formatted: string): string {
  return formatted.replace(/,/g, "");
}

const emptyForm = {
  brand: "",
  customerName: "",
  ssn: "",
  phone: "",
  address: "",
  account: "",
  modelCode: "",
  color: "",
  contractPeriod: "",
  serviceType: "",
  monthlyFee: "",
  promotion: [] as string[],
  customPromotion: "",
  desiredInstallDate: "",
  memo: "",
};

export default function RegisterPage() {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual form state
  const [manualForm, setManualForm] = useState({ ...emptyForm });
  const [isSavingManual, setIsSavingManual] = useState(false);

  const { showToast } = useToast();

  // === AI 파싱 등록 ===
  const handleRegister = async () => {
    if (!text.trim()) {
      showToast("텍스트를 입력해주세요.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const parseResult = await parseRes.json();

      if (!parseRes.ok) {
        throw new Error(parseResult.error || "파싱 실패");
      }

      const saveRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      });

      const saveResult = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveResult.error || "저장 실패");
      }

      showToast("고객 등록이 완료되었습니다! ✨", "success");
      setText("");
    } catch (err) {
      showToast(String(err), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // === 수동 입력 ===
  const handleManualChange = (key: string, value: string) => {
    setManualForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleManualPromotion = (promo: string) => {
    const current = manualForm.promotion;
    if (promo === "반값할인" && current.includes("타사보상")) {
      setManualForm((prev) => ({
        ...prev,
        promotion: [...current.filter((p) => p !== "타사보상"), promo],
      }));
      return;
    }
    if (promo === "타사보상" && current.includes("반값할인")) {
      setManualForm((prev) => ({
        ...prev,
        promotion: [...current.filter((p) => p !== "반값할인"), promo],
      }));
      return;
    }
    if (current.includes(promo)) {
      setManualForm((prev) => ({
        ...prev,
        promotion: current.filter((p) => p !== promo),
      }));
    } else {
      setManualForm((prev) => ({
        ...prev,
        promotion: [...current, promo],
      }));
    }
  };

  const handleManualSave = async () => {
    if (!manualForm.customerName.trim() && !manualForm.phone.trim()) {
      showToast("고객명 또는 전화번호를 입력해주세요.", "error");
      return;
    }

    setIsSavingManual(true);

    try {
      const allPromo = [...manualForm.promotion];
      if (manualForm.customPromotion.trim()) {
        allPromo.push(manualForm.customPromotion.trim());
      }
      const { customPromotion: _cp, ...formWithoutCustom } = manualForm;
      void _cp;
      const payload = {
        ...formWithoutCustom,
        monthlyFee: manualForm.monthlyFee
          ? Number(parseCurrency(manualForm.monthlyFee))
          : null,
        promotion: allPromo.length > 0 ? allPromo : null,
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "저장 실패");
      }

      showToast("고객 등록이 완료되었습니다! ✨", "success");
      setManualForm({ ...emptyForm });
    } catch (err) {
      showToast(String(err), "error");
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">고객등록</h1>
      <p className="page-subtitle">
        거래처 사이트에서 복사한 텍스트를 붙여넣으면 AI가 자동으로 파싱하여 바로
        등록합니다.
      </p>

      {/* AI 파싱 등록 섹션 */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 20 }}>🤖</span>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>AI 자동 파싱 등록</h2>
        </div>
        <textarea
          className="textarea-main"
          style={{ minHeight: 180 }}
          placeholder={
            "고객 정보 텍스트를 여기에 붙여넣기 하세요...\n\n예시:\n쿠쿠 정수기\n홍길동 990909-1******\n010-1234-5678\n서울시 강남구 ..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
            gap: 8,
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setText("")}
            disabled={!text}
          >
            초기화
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRegister}
            disabled={isProcessing || !text.trim()}
          >
            {isProcessing ? (
              <>
                <span className="spinner" />
                AI 파싱 및 저장 중...
              </>
            ) : (
              "🤖 등록"
            )}
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
          <span>Gemini AI가 텍스트를 분석하고 저장합니다...</span>
        </div>
      )}

      {/* 수동 입력 등록 섹션 */}
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 20 }}>✍️</span>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>직접 입력 등록</h2>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label className="input-label">브랜드</label>
            <input
              className="input-field"
              placeholder="쿠쿠 / 코웨이 / 청호 등"
              value={manualForm.brand}
              onChange={(e) => handleManualChange("brand", e.target.value)}
            />
          </div>
          <div className="detail-item">
            <label className="input-label">고객명</label>
            <input
              className="input-field"
              placeholder="홍길동"
              value={manualForm.customerName}
              onChange={(e) =>
                handleManualChange("customerName", e.target.value)
              }
            />
          </div>
          <div className="detail-item">
            <label className="input-label">주민번호</label>
            <input
              className="input-field"
              placeholder="990909-1"
              value={manualForm.ssn}
              onChange={(e) => handleManualChange("ssn", e.target.value)}
            />
          </div>
          <div className="detail-item">
            <label className="input-label">휴대폰</label>
            <input
              className="input-field"
              placeholder="010-1234-5678"
              value={manualForm.phone}
              onChange={(e) => handleManualChange("phone", e.target.value)}
            />
          </div>
          <div className="detail-item full-width">
            <label className="input-label">설치주소</label>
            <textarea
              className="input-field"
              style={{ minHeight: 56, resize: "vertical" }}
              placeholder="서울시 강남구 ..."
              value={manualForm.address}
              onChange={(e) => handleManualChange("address", e.target.value)}
            />
          </div>
          <div className="detail-item full-width">
            <label className="input-label">계좌/카드</label>
            <input
              className="input-field"
              placeholder="우리은행 1002-xxx-xxxxxx"
              value={manualForm.account}
              onChange={(e) => handleManualChange("account", e.target.value)}
            />
          </div>
          <div className="detail-item">
            <label className="input-label">모델코드</label>
            <input
              className="input-field"
              placeholder="CP-AQS100EWH"
              value={manualForm.modelCode}
              onChange={(e) => handleManualChange("modelCode", e.target.value)}
            />
          </div>
          <div className="detail-item">
            <label className="input-label">색상</label>
            <input
              className="input-field"
              placeholder="화이트"
              value={manualForm.color}
              onChange={(e) => handleManualChange("color", e.target.value)}
            />
          </div>
          <div className="detail-item">
            <label className="input-label">의무기간</label>
            <input
              className="input-field"
              placeholder="7년"
              value={manualForm.contractPeriod}
              onChange={(e) =>
                handleManualChange("contractPeriod", e.target.value)
              }
            />
          </div>
          <div className="detail-item">
            <label className="input-label">관리유형</label>
            <input
              className="input-field"
              placeholder="자가관리"
              value={manualForm.serviceType}
              onChange={(e) =>
                handleManualChange("serviceType", e.target.value)
              }
            />
          </div>
          <div className="detail-item">
            <label className="input-label">월 렌탈료</label>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              placeholder="38,610"
              value={manualForm.monthlyFee}
              onChange={(e) => {
                const raw = parseCurrency(e.target.value);
                if (raw === "" || /^\d+$/.test(raw)) {
                  handleManualChange(
                    "monthlyFee",
                    raw ? formatCurrency(raw) : ""
                  );
                }
              }}
            />
          </div>
          <div className="detail-item">
            <label className="input-label">설치희망일</label>
            <input
              className="input-field"
              placeholder="2026-05-01 또는 텍스트"
              value={manualForm.desiredInstallDate}
              onChange={(e) =>
                handleManualChange("desiredInstallDate", e.target.value)
              }
            />
          </div>

          <div className="detail-item full-width">
            <label className="input-label">프로모션</label>
            <div className="toggle-group" style={{ alignItems: "center" }}>
              {["반값할인", "타사보상", "결합할인"].map((promo) => (
                <button
                  key={promo}
                  className={`toggle-btn ${manualForm.promotion.includes(promo) ? "active" : ""}`}
                  onClick={() => handleManualPromotion(promo)}
                >
                  {promo}
                </button>
              ))}
              <input
                className="input-field"
                style={{ flex: 1, minWidth: 120, margin: 0 }}
                placeholder="추가 프로모션 입력"
                value={manualForm.customPromotion}
                onChange={(e) => handleManualChange("customPromotion", e.target.value)}
              />
            </div>
          </div>

          <div className="detail-item full-width">
            <label className="input-label">메모</label>
            <textarea
              className="input-field"
              style={{ minHeight: 60, resize: "vertical" }}
              placeholder="특이사항 입력"
              value={manualForm.memo}
              onChange={(e) => handleManualChange("memo", e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
            gap: 8,
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setManualForm({ ...emptyForm })}
          >
            초기화
          </button>
          <button
            className="btn btn-primary"
            onClick={handleManualSave}
            disabled={isSavingManual}
          >
            {isSavingManual ? (
              <>
                <span className="spinner" />
                저장 중...
              </>
            ) : (
              "✍️ 직접 등록"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
