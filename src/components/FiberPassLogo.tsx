/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface FiberPassLogoProps {
  showTagline?: boolean;
  className?: string;
}

export default function FiberPassLogo({ showTagline = false, className = '' }: FiberPassLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-secondary shadow-[0_8px_22px_rgba(0,45,111,0.13)]">
        <Zap className="h-[21px] w-[21px] fill-current text-on-primary" />
      </span>
      <span className="min-w-0">
        <span className="block text-[22px] font-extrabold leading-none tracking-normal text-on-surface">
          Fiber<span className="text-primary">Pass</span>
        </span>
        {showTagline && (
          <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            CKB prepaid payment sessions
          </span>
        )}
      </span>
    </span>
  );
}
