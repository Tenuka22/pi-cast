/**
 * Category Section Component
 *
 * Collapsible section for block library categories.
 */

'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
} from '@hugeicons/core-free-icons';

import { Button } from '@workspace/ui/components/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';

interface CategorySectionProps {
  title: string;
  icon: import('@hugeicons/react').HugeiconsIconProps['icon'];
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CategorySection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: CategorySectionProps): React.ReactElement {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle} className="mb-2">
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={icon} className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{title}</span>
            </div>
            <HugeiconsIcon
              icon={isExpanded ? ArrowUpIcon : ArrowDownIcon}
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </Button>
        }
      />
      <CollapsibleContent className="border-t border-border px-2 py-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CategorySection;
