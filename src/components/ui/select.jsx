import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils.js';

// shadcn/ui Select (Radix 기반) — 네이티브 <select>를 대체.
// 트리거는 사이트 .log-select 룩과 일치, 드롭다운 패널은 접근성·키보드 내비 내장.
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'sx-focus flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--line-strong)] ' +
          'bg-[var(--bg-card)] px-3 py-2.5 text-[14px] text-[var(--ink)] outline-none ' +
          'transition-[border-color,box-shadow] duration-150 ease-out ' +
          'data-[placeholder]:text-[var(--ink-tertiary)] ' +
          'hover:border-[rgba(24,24,27,0.18)] ' +
          'focus:border-[var(--accent)] data-[state=open]:border-[var(--accent)] ' +
          'disabled:cursor-not-allowed disabled:opacity-50 ' +
          '[&>span]:line-clamp-1 [&>span]:text-left',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ink-mute)]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, position = 'popper', ...props }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          'sx-elevated relative z-[1000] max-h-96 min-w-[8rem] overflow-hidden rounded-[var(--radius-md)] ' +
            'border border-[var(--line-strong)] bg-[var(--bg-card)] text-[var(--ink)] ' +
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-[6px] py-2 pl-8 pr-3 text-[14px] outline-none ' +
          'focus:bg-[var(--accent)] focus:text-white ' +
          'data-[state=checked]:font-semibold ' +
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
