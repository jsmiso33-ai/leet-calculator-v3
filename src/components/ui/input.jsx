import { cn } from '@/lib/utils.js';

// shadcn/ui Input — 사이트 토큰(.field input / .log-* )과 동일한 룩으로 매핑.
// 숫자 입력은 mono, 그 외는 sans. 포커스 링은 사이트 액센트와 일치.
const base =
  'sx-focus flex w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--bg-card)] ' +
  'px-3 py-2.5 text-[14px] text-[var(--ink)] outline-none ' +
  'transition-[border-color,box-shadow] duration-150 ease-out ' +
  'placeholder:text-[var(--ink-tertiary)] ' +
  'hover:border-[rgba(24,24,27,0.18)] ' +
  'focus:border-[var(--accent)] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'file:border-0 file:bg-transparent file:text-sm file:font-medium';

export function Input({ className, type = 'text', ...props }) {
  const mono = type === 'number';
  return (
    <input
      type={type}
      className={cn(base, mono && 'font-[var(--font-mono)]', className)}
      {...props}
    />
  );
}
