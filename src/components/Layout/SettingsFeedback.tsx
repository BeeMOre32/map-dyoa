'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { submitSiteFeedbackAction } from '@/app/site-feedback-action';
import { rememberFeedbackReceipt } from '@/lib/feedback-receipt-client';
import { SITE_FEEDBACK_CATEGORIES, type SiteFeedbackCategory } from '@/lib/site-feedback';

export default function SettingsFeedbackForm({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [category, setCategory] = useState<SiteFeedbackCategory>('의견');
  const [content, setContent] = useState('');
  const [company, setCompany] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(onClose, 1200);
    return () => window.clearTimeout(timer);
  }, [sent, onClose]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await submitSiteFeedbackAction({
        category,
        content,
        page: pathname,
        company,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.id && result.receipt) rememberFeedbackReceipt(result.id, result.receipt);
      setContent('');
      setSent(true);
    } catch {
      setError('지금은 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setPending(false);
    }
  };

  return sent ? (
    <p className="px-1 py-8 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
      의견을 받았습니다.
    </p>
  ) : (
    <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label htmlFor="site-feedback-category" className="mb-1.5 block text-xs font-black text-slate-500 dark:text-slate-400">
                분류
              </label>
              <select
                id="site-feedback-category"
                value={category}
                disabled={pending}
                onChange={(event) => setCategory(event.target.value as SiteFeedbackCategory)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {SITE_FEEDBACK_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="site-feedback-content" className="mb-1.5 block text-xs font-black text-slate-500 dark:text-slate-400">
                내용
              </label>
              <textarea
                id="site-feedback-content"
                value={content}
                maxLength={800}
                rows={4}
                disabled={pending}
                placeholder="달력, 오류, 바라는 점을 짧게 적어주세요."
                onChange={(event) => {
                  setContent(event.target.value);
                  if (error) setError(null);
                }}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="hidden"
              name="fax_number"
            />
            {error ? (
              <p role="alert" className="text-xs font-bold text-red-500">
                {error}
              </p>
            ) : null}
            <motion.button
              type="submit"
              disabled={pending}
              initial="rest"
              whileHover={pending ? undefined : 'hover'}
              whileTap={pending ? undefined : 'tap'}
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.02 },
                tap: { scale: 0.98 },
              }}
              transition={{ type: 'spring', visualDuration: 0.2, bounce: 0.18 }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-black text-white hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <motion.span
                  className="inline-flex"
                  variants={{
                    rest: { x: 0 },
                    hover: { x: 2 },
                    tap: { x: 4 },
                  }}
                  transition={{ type: 'spring', visualDuration: 0.2, bounce: 0.2 }}
                >
                  <Send className="h-4 w-4" />
                </motion.span>
              )}
              보내기
            </motion.button>
    </form>
  );
}
