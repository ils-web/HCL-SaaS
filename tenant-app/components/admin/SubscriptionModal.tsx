"use client"

import * as React from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { toast } from "@/components/ui/Toast"

export interface PlanItem {
  id: string
  code: string
  name: string
  priceMonth: number
  priceYear: number
  description?: string
  maxInspectors?: number
  maxTeams?: number
  features?: string[]
  isPopular?: boolean
}

export interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string | null
  tenantName: string
  tenantStatus: string
  currentPlan: string
  currentPrice: number
  subscriptionEndsAt: string | null
  plans: PlanItem[]
  onSuccessRenewal: (newTenantData: any) => void
}

export function SubscriptionModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  tenantStatus,
  currentPlan,
  currentPrice,
  subscriptionEndsAt,
  plans,
  onSuccessRenewal
}: SubscriptionModalProps) {
  const [billingCycle, setBillingCycle] = React.useState<"MONTH" | "YEAR">("MONTH")
  const [selectedPlanCode, setSelectedPlanCode] = React.useState<string>(currentPlan || "PRO")
  const [activeTab, setActiveTab] = React.useState<"CARD" | "SALES">("CARD")
  const [loading, setLoading] = React.useState(false)

  // Card form state
  const [cardHolder, setCardHolder] = React.useState("")
  const [idNumber, setIdNumber] = React.useState("")
  const [cardNumber, setCardNumber] = React.useState("")
  const [cardExp, setCardExp] = React.useState("")
  const [cardCvv, setCardCvv] = React.useState("")

  // Sales form state
  const [salesName, setSalesName] = React.useState("")
  const [salesPhone, setSalesPhone] = React.useState("")
  const [salesNotes, setSalesNotes] = React.useState("")

  // Sync selected plan if plans load
  React.useEffect(() => {
    if (plans && plans.length > 0 && !plans.find(p => p.code === selectedPlanCode)) {
      setSelectedPlanCode(plans[0].code)
    }
  }, [plans, selectedPlanCode])

  const selectedPlan = React.useMemo(() => {
    return (plans || []).find(p => p.code === selectedPlanCode) || (plans && plans[0]) || {
      id: "pro", code: "PRO", name: "מקצועי (Pro)", priceMonth: 550, priceYear: 5500, features: []
    }
  }, [plans, selectedPlanCode])

  const payableAmount = React.useMemo(() => {
    if (billingCycle === "YEAR") {
      return selectedPlan.priceYear || selectedPlan.priceMonth * 10
    }
    return selectedPlan.priceMonth || 0
  }, [selectedPlan, billingCycle])

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
      return toast("נא להזין מספר כרטיס אשראי תקין", "error")
    }
    if (!cardExp || !cardExp.includes('/')) {
      return toast("נא להזין תוקף כרטיס תקין (MM/YY)", "error")
    }
    if (!cardCvv || cardCvv.length < 3) {
      return toast("נא להזין קוד CVV (3 ספרות בגב הכרטיס)", "error")
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROCESS_PAYMENT_RENEWAL",
          planCode: selectedPlan.code,
          billingCycle,
          cardDetails: {
            cardHolder,
            idNumber,
            cardNumber: cardNumber.slice(-4), // Only keep last 4 for security
            cardExp
          }
        })
      })
      const out = await res.json()
      if (out.status === "success" || out.tenant) {
        toast("התשלום בוצע בהצלחה! המנוי חודש והמערכת פעילה", "success")
        onSuccessRenewal(out.tenant)
        onClose()
      } else {
        toast(out.error || out.message || "שגיאה בביצוע התשלום", "error")
      }
    } catch (err) {
      console.error(err)
      toast("שגיאת תקשורת בביצוע התשלום", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    if (!salesPhone && !salesName) {
      return toast("נא להזין לפחות שם ומספר טלפון", "error")
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_SALES_CONTACT",
          contactName: salesName,
          contactPhone: salesPhone,
          notes: salesNotes,
          requestedPlan: `${selectedPlan.name} (${billingCycle === 'YEAR' ? 'שנתי' : 'חודשי'})`
        })
      })
      const out = await res.json()
      if (out.status === "success") {
        toast("פנייתך נשלחה בהצלחה! נציג מכירות יחזור אליך בהקדם", "success")
        onClose()
      } else {
        toast(out.error || "שגיאה בשליחת הפנייה", "error")
      }
    } catch (err) {
      console.error(err)
      toast("שגיאת תקשורת", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="חידוש ושדרוג מנוי HCL SaaS" className="max-w-5xl w-full">
      <div className="space-y-6 max-h-[82vh] overflow-y-auto custom-scrollbar p-1" dir="rtl">
        
        {/* Header Info */}
        <div className="bg-gradient-to-l from-indigo-900 to-blue-900 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold mb-1">
              <i className="fas fa-building"></i>
              <span>{tenantName}</span>
              <span>•</span>
              <span className="text-white bg-indigo-800/60 px-2 py-0.5 rounded-md border border-indigo-700">
                סטטוס: {tenantStatus === 'TRIAL' ? 'גרסת ניסיון' : (tenantStatus === 'ACTIVE' ? 'מנוי פעיל' : 'פג תוקף / לא שולם')}
              </span>
            </div>
            <h2 className="text-2xl font-black">בחר את החבילה המתאימה עבורך</h2>
            <p className="text-sm text-indigo-200 mt-1">פתיחת כל היכולות המתקדמות, ניהול צוותים, דוחות וסנכרון מלא</p>
          </div>

          {/* Billing Cycle Switch */}
          <div className="bg-white/10 p-1.5 rounded-2xl flex items-center gap-1 border border-white/20 shrink-0">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTH")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === "MONTH" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-100 hover:text-white"}`}
            >
              תשלום חודשי
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("YEAR")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${billingCycle === "YEAR" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-100 hover:text-white"}`}
            >
              <span>תשלום שנתי</span>
              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-black animate-pulse">20% הנחה</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {(plans || []).map((p) => {
            const isSelected = selectedPlanCode === p.code
            const price = billingCycle === "YEAR" ? (p.priceYear || p.priceMonth * 10) : p.priceMonth
            const periodLabel = billingCycle === "YEAR" ? "לשנה (כולל הנחה)" : "לחודש"

            return (
              <div
                key={p.code}
                onClick={() => setSelectedPlanCode(p.code)}
                className={`rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between relative ${isSelected ? "border-indigo-600 bg-indigo-50/40 shadow-lg scale-[1.02]" : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"}`}
              >
                {p.isPopular && (
                  <span className="absolute -top-3 left-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                    ⭐ הפופולרי ביותר
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-black text-gray-800">{p.name}</h3>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 min-h-[32px] mb-4">{p.description || "חבילת ניהול מתקדמת"}</p>

                  <div className="mb-6 border-b border-gray-100 pb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900">₪{price}</span>
                      <span className="text-xs text-gray-500 font-bold">/{periodLabel}</span>
                    </div>
                    {billingCycle === "YEAR" && (
                      <div className="text-xs text-emerald-600 font-bold mt-1">
                        חיסכון של ₪{(p.priceMonth * 12) - price} בשנה!
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-6">
                    {(p.features || []).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
                        <i className="fas fa-check-circle text-emerald-500 shrink-0 text-sm"></i>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                >
                  {isSelected ? "תוכנית נבחרת" : "בחר תוכנית"}
                </button>
              </div>
            )
          })}
        </div>

        {/* Payment & Sales Option Tabs */}
        <div className="border border-gray-200 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex border-b border-gray-200 mb-6 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("CARD")}
              className={`pb-3 font-bold text-base transition-all flex items-center gap-2 border-b-2 ${activeTab === "CARD" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              <i className="fas fa-credit-card"></i>
              <span>תשלום מאובטח באשראי (הפעלה מידית)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SALES")}
              className={`pb-3 font-bold text-base transition-all flex items-center gap-2 border-b-2 ${activeTab === "SALES" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              <i className="fas fa-headset"></i>
              <span>פנייה למחלקת מכירות / תמיכה</span>
            </button>
          </div>

          {activeTab === "CARD" ? (
            <form onSubmit={handleCardPayment} className="space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div>
                  <span className="text-xs text-gray-500 font-bold">חבילה נבחרת:</span>
                  <div className="font-black text-indigo-900 text-lg">
                    {selectedPlan.name} • {billingCycle === "YEAR" ? "תשלום שנתי" : "תשלום חודשי"}
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs text-gray-500 font-bold">סה"כ לחיוב:</span>
                  <div className="text-2xl font-black text-emerald-600">₪{payableAmount}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">שם מלא (בעל הכרטיס)</label>
                  <Input
                    required
                    placeholder="ישראל ישראלי"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="bg-gray-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">מספר תעודת זהות</label>
                  <Input
                    required
                    placeholder="012345678"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="bg-gray-50 font-bold font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">מספר כרטיס אשראי</label>
                <div className="relative">
                  <Input
                    required
                    placeholder="4580 •••• •••• 1234"
                    value={cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                    maxLength={19}
                    className="bg-gray-50 font-bold font-mono text-left tracking-wider pl-12"
                    dir="ltr"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 gap-1.5 text-lg">
                    <i className="fab fa-cc-visa text-blue-700"></i>
                    <i className="fab fa-cc-mastercard text-red-500"></i>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">תוקף (MM/YY)</label>
                  <Input
                    required
                    placeholder="12/28"
                    value={cardExp}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                      setCardExp(val);
                    }}
                    maxLength={5}
                    className="bg-gray-50 font-bold font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">קוד אבטחה (CVV)</label>
                  <Input
                    required
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    className="bg-gray-50 font-bold font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-lock text-emerald-600"></i>
                  חיוב מאובטח בתקן מחמיר SSL / PCI-DSS
                </span>
                <span>פתיחת מערכת מידית ללא צורך בהמתנה</span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-md transition-all mt-4"
              >
                {loading ? "מעבד תשלום מאובטח..." : `שלם ₪${payableAmount} ושחרר מנוי עכשיו`}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSalesSubmit} className="space-y-4">
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-900 text-sm mb-1">מעדיפים לשוחח עם נציג או לקבל הצעת מחיר מותאמת?</h4>
                <p className="text-xs text-blue-700">השאירו פרטים או חייגו ישירות, ונציג מוסמך יחזור אליכם עם מענה מיידי.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">שם מלא</label>
                  <Input
                    required
                    placeholder="שם איש קשר"
                    value={salesName}
                    onChange={(e) => setSalesName(e.target.value)}
                    className="bg-gray-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">מספר טלפון לחזרה</label>
                  <Input
                    required
                    placeholder="050-1234567"
                    value={salesPhone}
                    onChange={(e) => setSalesPhone(e.target.value)}
                    className="bg-gray-50 font-bold font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">הערות או שאלות מיוחדות</label>
                <textarea
                  rows={3}
                  placeholder="אשמח לפרטים על תוכנית..."
                  value={salesNotes}
                  onChange={(e) => setSalesNotes(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold text-base shadow-sm"
                >
                  <i className="fas fa-paper-plane ml-2"></i>שלח בקשת חזרה
                </Button>

                <a
                  href={`https://wa.me/972500000000?text=${encodeURIComponent(`שלום, אני פונה לגבי חידוש מנוי ${selectedPlan.name} עבור ${tenantName}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold text-base shadow-sm flex items-center justify-center gap-2"
                >
                  <i className="fab fa-whatsapp text-xl"></i>
                  <span>שיחה בוואטסאפ לחידוש מידי</span>
                </a>
              </div>
            </form>
          )}
        </div>

      </div>
    </Modal>
  )
}
