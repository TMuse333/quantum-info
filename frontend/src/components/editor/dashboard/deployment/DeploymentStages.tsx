"use client";

import { motion } from "framer-motion";
import StageCard, { StageStatus } from "./StageCard";

export interface DeploymentStage {
  id: string;
  name: string;
  description?: string;
  status: StageStatus;
  duration?: string;
  message?: string;
}

export interface DeploymentStagesProps {
  stages: DeploymentStage[];
  currentStage?: number;
}

export default function DeploymentStages({ stages, currentStage }: DeploymentStagesProps) {
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const totalCount = stages.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Progress: {completedCount} / {totalCount} stages
          </span>
          <span className="text-gray-400">{Math.round(progressPercentage)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stages List */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <StageCard
            key={stage.id}
            name={stage.name}
            description={stage.description}
            status={stage.status}
            duration={stage.duration}
            message={stage.message}
          />
        ))}
      </div>
    </div>
  );
}
