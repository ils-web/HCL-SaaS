"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface AdminHeaderProps {
  tenantName: string
  tenantStatus?: string
  subscriptionEndsAt?: string | null
  plan?: string
  price?: number
  onOpenSubscriptionModal?: () => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  loading: boolean
  loadTasks: () => void
  setWorkerQrModalOpen: (val: boolean) => void
  setQrModalOpen: (val: boolean) => void
  setWorkersModalOpen: (val: boolean) => void
  setTeamsModalOpen: (val: boolean) => void
  setConfigModalOpen: (val: boolean) => void
  setIntegrationsModalOpen: (val: boolean) => void
}

export function AdminHeader({
  tenantName,
  tenantStatus,
  subscriptionEndsAt,
  plan,
  price,
  onOpenSubscriptionModal,
  searchQuery,
  setSearchQuery,
  loading,
  loadTasks,
  setWorkerQrModalOpen,
  setQrModalOpen,
  setWorkersModalOpen,
  setTeamsModalOpen,
  setConfigModalOpen,
  setIntegrationsModalOpen,
}: AdminHeaderProps) {
  const subscriptionInfo = React.useMemo(() => {
    // If no subscriptionEndsAt date is provided, default to 30 days from now
    const targetDate = subscriptionEndsAt ? new Date(subscriptionEndsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateFormatted = targetDate.toLocaleDateString('he-IL');

    if (tenantStatus === 'TRIAL') {
      const trialDays = Math.max(0, diffDays > 0 ? diffDays : 0);
      return {
        icon: <i className="fas fa-sparkles text-purple-600 text-sm animate-pulse"></i>,
        text: `גרסת ניסיון (TRIAL) • נותרו עוד ${trialDays} ימים (${dateFormatted})`,
        btnText: "שדרג לגרסה מלאה",
        btnIcon: <i className="fas fa-crown text-amber-300"></i>,
        badgeClass: "bg-purple-50 border-purple-300 text-purple-900",
        btnClass: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
      };
    }

    if (tenantStatus === 'UNPAID' || tenantStatus === 'BLOCKED') {
      return {
        icon: <i className="fas fa-exclamation-triangle text-red-500 text-sm"></i>,
        text: "מנוי לא שולם / חסום",
        btnText: "שלם וחדש מנוי",
        btnIcon: <i className="fas fa-credit-card"></i>,
        badgeClass: "bg-red-50 border-red-300 text-red-900",
        btnClass: "bg-red-600 hover:bg-red-700 text-white shadow-sm"
      };
    }

    if (diffDays <= 0) {
      return {
        icon: <i className="fas fa-times-circle text-red-500 text-sm"></i>,
        text: `המנוי פג תוקף (${dateFormatted})`,
        btnText: "חדש מנוי עכשיו",
        btnIcon: <i className="fas fa-sync-alt"></i>,
        badgeClass: "bg-red-50 border-red-300 text-red-900",
        btnClass: "bg-red-600 hover:bg-red-700 text-white shadow-sm"
      };
    }

    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const remDays = diffDays % 30;
      return {
        icon: <i className="fas fa-calendar-check text-emerald-600 text-sm"></i>,
        text: `תוקף מנוי: עוד ${months} חודש${months > 1 ? 'ים' : ''} ו-${remDays} ימים (${dateFormatted})`,
        btnText: "הארך מנוי",
        btnIcon: <i className="fas fa-sync-alt text-xs"></i>,
        badgeClass: "bg-emerald-50 border-emerald-300 text-emerald-950",
        btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
      };
    }

    return {
      icon: <i className="fas fa-clock text-amber-600 text-sm"></i>,
      text: `תוקף מנוי: נותרו עוד ${diffDays} ימים (${dateFormatted})`,
      btnText: "הארך מנוי",
      btnIcon: <i className="fas fa-sync-alt text-xs"></i>,
      badgeClass: "bg-amber-50 border-amber-300 text-amber-950",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
    };
  }, [tenantStatus, subscriptionEndsAt, plan]);

  return (
    <header className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        <h1 className="text-xl sm:text-2xl font-black text-blue-700 bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 whitespace-nowrap">
          <i className="fas fa-building text-blue-500 opacity-80"></i>
          {tenantName}
        </h1>

        {/* Subscription Banner Badge */}
        <div className={`flex items-center justify-between sm:justify-start gap-3 border px-3.5 py-1.5 rounded-xl shadow-xs ${subscriptionInfo.badgeClass}`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            {subscriptionInfo.icon}
            <span>{subscriptionInfo.text}</span>
          </div>
          {onOpenSubscriptionModal && (
            <button
              onClick={onOpenSubscriptionModal}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${subscriptionInfo.btnClass}`}
            >
              {subscriptionInfo.btnIcon}
              <span>{subscriptionInfo.btnText}</span>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap justify-center xl:justify-end">
        <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 font-bold px-4 h-10" onClick={() => setWorkerQrModalOpen(true)}>
          <i className="fas fa-qrcode ml-2"></i>Report QR
        </Button>
        <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50 font-bold px-4 h-10" onClick={() => setQrModalOpen(true)}>
          <i className="fas fa-mobile-alt ml-2"></i>Inspektor QR
        </Button>

        <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100" onClick={() => setWorkersModalOpen(true)} title="ניהול עובדים"><i className="fas fa-user-friends"></i></Button>
        <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" onClick={() => setTeamsModalOpen(true)} title="ניהול צוותים"><i className="fas fa-users-cog"></i></Button>
        <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100" onClick={() => setConfigModalOpen(true)} title="הגדרות"><i className="fas fa-cog"></i></Button>
        <Button variant="outline" className="w-10 h-10 rounded-full p-0 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100" onClick={() => setIntegrationsModalOpen(true)} title="אינטגרציות"><i className="fas fa-plug"></i></Button>

        <div className="w-full sm:w-64">
          <Input 
            placeholder="חפש חדר, תקלה, עובד..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-50 border-gray-200 h-10 w-full"
          />
        </div>
        <Button variant="outline" onClick={() => loadTasks()} disabled={loading} className="h-10">
          <svg className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          רענן נתונים
        </Button>
        <Button variant="danger" className="h-10" onClick={() => { localStorage.clear(); window.location.href = '/' }}>
          התנתק
        </Button>
      </div>
    </header>
  )
}
