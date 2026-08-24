"use client"

import * as React from "react"

interface SubscriptionWidgetProps {
  tenantStatus?: string
  subscriptionEndsAt?: string | null
  plan?: string
  price?: number
  onOpenSubscriptionModal: () => void
}

export function SubscriptionWidget({
  tenantStatus,
  subscriptionEndsAt,
  plan,
  price,
  onOpenSubscriptionModal
}: SubscriptionWidgetProps) {
  const isFree = tenantStatus === 'FREE' || plan === 'FREE';

  const info = React.useMemo(() => {
    if (isFree) {
      return {
        icon: "fa-crown",
        iconColor: "text-amber-500",
        iconBg: "bg-amber-50 border-amber-200",
        title: "גרסה מלאה (FREE)",
        subtitle: "ללא הגבלת זמן • הכל פתוח",
        badge: "VIP ללא הגבלה",
        badgeClass: "bg-amber-100 text-amber-800",
        bg: "bg-[#b0b4be] border-transparent",
        btnText: "פרטי מנוי",
        btnClass: "bg-amber-600 hover:bg-amber-700 text-white"
      };
    }

    if (tenantStatus === 'TRIAL') {
      const targetDate = subscriptionEndsAt ? new Date(subscriptionEndsAt) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const diffDays = Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const dateFormatted = targetDate.toLocaleDateString('he-IL');
      return {
        icon: "fa-sparkles",
        iconColor: "text-purple-600",
        iconBg: "bg-purple-50 border-purple-200",
        title: "תקופת ניסיון (TRIAL)",
        subtitle: `נותרו עוד ${diffDays} ימים (${dateFormatted})`,
        badge: `עוד ${diffDays} ימים`,
        badgeClass: "bg-purple-100 text-purple-800",
        bg: "bg-[#b0b4be] border-transparent",
        btnText: "שדרג למלאה",
        btnClass: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
      };
    }

    if (tenantStatus === 'UNPAID' || tenantStatus === 'BLOCKED') {
      return {
        icon: "fa-exclamation-triangle",
        iconColor: "text-red-600",
        iconBg: "bg-red-50 border-red-200",
        title: "מנוי לא שולם / חסום",
        subtitle: "נדרש חידוש מנוי מיידי",
        badge: "חסום",
        badgeClass: "bg-red-100 text-red-800",
        bg: "bg-[#b0b4be] border-transparent",
        btnText: "שלם וחדש",
        btnClass: "bg-red-600 hover:bg-red-700 text-white"
      };
    }

    const targetDate = subscriptionEndsAt ? new Date(subscriptionEndsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateFormatted = targetDate.toLocaleDateString('he-IL');

    if (diffDays <= 0) {
      return {
        icon: "fa-times-circle",
        iconColor: "text-red-600",
        iconBg: "bg-red-50 border-red-200",
        title: "המנוי פג תוקף",
        subtitle: `הסתיים ב-${dateFormatted}`,
        badge: "פג תוקף",
        badgeClass: "bg-red-100 text-red-800",
        bg: "bg-[#b0b4be] border-transparent",
        btnText: "חדש עכשיו",
        btnClass: "bg-red-600 hover:bg-red-700 text-white"
      };
    }

    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const remDays = diffDays % 30;
      return {
        icon: "fa-calendar-check",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-50 border-emerald-200",
        title: `תוקף מנוי (${plan || 'PRO'})`,
        subtitle: `עוד ${months} חוד' ו-${remDays} ימים (${dateFormatted})`,
        badge: `עוד ${months}m ${remDays}d`,
        badgeClass: "bg-emerald-100 text-emerald-800",
        bg: "bg-[#b0b4be] border-transparent",
        btnText: "הארך מנוי",
        btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white"
      };
    }

    return {
      icon: "fa-clock",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-200",
      title: `תוקף מנוי (${plan || 'BASIC'})`,
      subtitle: `נותרו עוד ${diffDays} ימים (${dateFormatted})`,
      badge: `עוד ${diffDays} ימים`,
      badgeClass: "bg-amber-100 text-amber-800",
      bg: "bg-[#b0b4be] border-transparent",
      btnText: "הארך מנוי",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white"
    };
  }, [isFree, tenantStatus, subscriptionEndsAt, plan]);

  return (
    <div
      className={`p-4 rounded-2xl shadow-sm border ${info.bg} flex flex-col gap-3 transition-all hover:shadow-md`}
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${info.iconColor} ${info.iconBg} shadow-xs border`}>
            <i className={`fas ${info.icon} text-lg`}></i>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-sm leading-tight">{info.title}</span>
            <span className="text-xs text-gray-600 font-medium leading-tight mt-0.5">{info.subtitle}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-300/60 pt-2.5 mt-0.5">
        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md ${info.badgeClass}`}>
          {info.badge}
        </span>
        <button
          type="button"
          onClick={onOpenSubscriptionModal}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${info.btnClass}`}
        >
          <i className="fas fa-sync-alt text-[10px]"></i>
          <span>{info.btnText}</span>
        </button>
      </div>
    </div>
  );
}
