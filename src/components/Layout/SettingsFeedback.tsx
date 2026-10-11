'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { submitSiteFeedbackAction } from '@/app/site-feedback-action';
import { SITE_FEEDBACK_CATEGORIES, type SiteFeedbackCategory } from '@/lib/site-feedback';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';

export default function SettingsFeedbackModal({ onClose }: { onClose: () => void }) {
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
      setContent('');
      setSent(true);
    } catch {
      setError('지금은 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
      onClick={pending ? undefined : onClose}
    >
      <motion.div
        variants={smoothModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-feedback-title"
        className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6 sm:py-5">
          <h2 id="site-feedback-title" className="flex items-center gap-2 text-base font-black text-slate-800 dark:text-white sm:text-lg">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            의견 보내기
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <p className="px-6 py-10 text-center text-sm font-black text-emerald-600 dark:text-emerald-400">
            의견을 받았습니다.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3 px-4 py-4 sm:px-6">
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
        )}
      </motion.div>
    </motion.div>
  );
}

export function SettingsFeedbackModalPresence({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? <SettingsFeedbackModal onClose={onClose} /> : null}
    </AnimatePresence>
  );
}
