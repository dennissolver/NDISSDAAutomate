'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { WorkflowStep } from '@/lib/workflow-data';

interface WorkflowDiagramProps {
  steps: WorkflowStep[];
  currentStep?: number;
}

export function WorkflowDiagram({ steps, currentStep }: WorkflowDiagramProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          How this works
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-medium text-gray-600">
            {steps.length}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[1000px]' : 'max-h-0'}`}
      >
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="space-y-0">
            {steps.map((step, i) => {
              const isCurrent = currentStep === step.number;
              const isBeforeCurrent = currentStep != null && step.number <= currentStep;
              const isLast = i === steps.length - 1;

              return (
                <div key={step.number} className="flex gap-3">
                  {/* Vertical line + circle column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : isBeforeCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.number}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-px grow ${
                          currentStep != null && step.number < currentStep
                            ? 'border-l-2 border-blue-300'
                            : 'border-l-2 border-gray-200'
                        }`}
                        style={{ minHeight: '1.5rem' }}
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{step.title}</p>
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          You are here
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
