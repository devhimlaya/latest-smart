import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Bell, X } from "lucide-react";
import { gradesApi } from "@/lib/api";

interface DeadlineNotification {
  tier: "reminder" | "warning" | "urgent" | "overdue";
  daysLeft: number;
  quarter: string;
  endDate: string;
  classesWithMissingGrades: number;
}

export default function QuarterDeadlineBanner() {
  const [notification, setNotification] = useState<DeadlineNotification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    gradesApi
      .getDeadlineStatus()
      .then((res) => setNotification(res.data.notification))
      .catch(() => {});
  }, []);

  if (!notification || dismissed) return null;

  const canDismiss = notification.tier === "reminder" || notification.tier === "warning";

  const config = {
    reminder: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Bell className="w-5 h-5 text-blue-600" />,
      title: `Reminder: ${notification.quarter} ends in ${notification.daysLeft} day${notification.daysLeft !== 1 ? "s" : ""}`,
      text:
        notification.classesWithMissingGrades > 0
          ? `You have ${notification.classesWithMissingGrades} class${notification.classesWithMissingGrades !== 1 ? "es" : ""} with incomplete grades. Please finish encoding before the quarter closes.`
          : "All your classes are graded. You're on track!",
      textColor: "text-blue-800",
    },
    warning: {
      bg: "bg-amber-50 border-amber-300",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: `Warning: Only ${notification.daysLeft} day${notification.daysLeft !== 1 ? "s" : ""} left for ${notification.quarter} grade submission`,
      text:
        notification.classesWithMissingGrades > 0
          ? `${notification.classesWithMissingGrades} class${notification.classesWithMissingGrades !== 1 ? "es" : ""} still have missing grades. Unsubmitted grades may be locked after the deadline.`
          : "All grades submitted. Great work!",
      textColor: "text-amber-800",
    },
    urgent: {
      bg: "bg-red-50 border-red-400",
      icon: <Clock className="w-5 h-5 text-red-600 animate-pulse" />,
      title:
        notification.daysLeft === 0
          ? `URGENT: ${notification.quarter} grade deadline is TODAY`
          : `URGENT: ${notification.quarter} grade deadline is TOMORROW`,
      text:
        notification.classesWithMissingGrades > 0
          ? `${notification.classesWithMissingGrades} class${notification.classesWithMissingGrades !== 1 ? "es" : ""} still have missing grades. Submit all grades immediately.`
          : "All grades submitted before the deadline!",
      textColor: "text-red-800",
    },
    overdue: {
      bg: "bg-red-100 border-red-500",
      icon: <AlertTriangle className="w-5 h-5 text-red-700" />,
      title: `Grade submission period for ${notification.quarter} has ended`,
      text: "If you still have missing grades, contact your administrator immediately.",
      textColor: "text-red-900",
    },
  };

  const c = config[notification.tier];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${c.bg} mb-4`}>
      <div className="mt-0.5 shrink-0">{c.icon}</div>
      <div className="flex-1">
        <p className={`font-semibold text-sm ${c.textColor}`}>{c.title}</p>
        <p className={`text-sm mt-0.5 ${c.textColor} opacity-80`}>{c.text}</p>
      </div>
      {canDismiss && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 mt-0.5 opacity-50 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
