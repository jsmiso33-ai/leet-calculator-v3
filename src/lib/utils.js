import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui 표준 클래스 병합 헬퍼
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
