import { cn } from '@/lib/utils.js';

// shadcn/ui Textarea — 사이트 .fb-textarea 룩과 일치(sans, 줄간격 1.6, 세로 리사이즈).
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'sx-focus flex w-full resize-y rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--bg-card)] ' +
          'px-3 py-2.5 text-[14px] leading-[1.6] text-[var(--ink)] outline-none ' +
          'transition-[border-color,box-shadow] duration-150 ease-out ' +
          'placeholder:text-[var(--ink-tertiary)] ' +
          'hover:border-[rgba(24,24,27,0.18)] ' +
          'focus:border-[var(--accent)] ' +
          'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
