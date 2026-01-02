"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";

export type StageStatus = "pending" | "in-progress" | "completed" | "failed" | "skipped";

export interface StageCardProps {
  name: string;
  description?: string;
  status: StageStatus;
  duration?: string;
  message?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
  },
  "in-progress": {
    icon: Loader2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/50",
  },
  failed: {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/50",
  },
  skipped: {
    icon: AlertCircle,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
};

export default function StageCard({ name, description, status, duration, message }: StageCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        flex items-start gap-4 p-4 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        transition-all duration-300
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        <Icon
          className={`w-5 h-5 ${config.color} `}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`font-medium ${config.color}`}>
            {name}
          </h4>
          {duration && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {duration}
            </span>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-400 mt-1">
            {description}
          </p>
        )}

        {message && (
          <p className={`text-sm mt-2 ${config.color}`}>
            {message}
          </p>
        )}
      </div>
    </motion.div>
  );
}
