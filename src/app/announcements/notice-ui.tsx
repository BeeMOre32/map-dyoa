'use client';

import type { ReactNode } from 'react';
import { Alert, Card, Chip, Link, ProgressBar } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';

export function Post({ children }: { children: ReactNode }) {
  return <div className="space-y-4 text-sm leading-relaxed">{children}</div>;
}

export function Notice({
  status = 'default',
  title,
  children,
}: {
  status?: 'default' | 'accent' | 'warning' | 'success' | 'danger';
  title?: string;
  children: ReactNode;
}) {
  const body = (
    <div className="space-y-2 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_ul]:mt-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-4">
      {children}
    </div>
  );

  if (status === 'default') {
    return (
      <section className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
        {body}
      </section>
    );
  }

  return (
    <Alert status={status}>
      <Alert.Indicator />
      <Alert.Content>
        {title ? <Alert.Title>{title}</Alert.Title> : null}
        {body}
      </Alert.Content>
    </Alert>
  );
}

export function Ledger({
  title,
  rows,
  formula,
}: {
  title: string;
  rows: { label: string; hint?: string; value: string }[];
  formula?: string;
}) {
  return (
    <Card variant="secondary">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-0 p-0">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row) => {
            const amount = row.value.trim();
            const isTotal = row.label.startsWith('잔여');
            const amountClass = isTotal
              ? 'text-base font-semibold text-zinc-950 dark:text-zinc-50'
              : amount.startsWith('+')
                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                : amount.startsWith('−') || amount.startsWith('-')
                  ? 'font-medium text-rose-600 dark:text-rose-400'
                  : 'font-medium';
            return (
              <div
                key={row.label}
                className={
                  isTotal
                    ? 'flex items-baseline justify-between gap-4 bg-zinc-100 px-4 py-3 dark:bg-zinc-800'
                    : 'flex items-baseline justify-between gap-4 px-4 py-3'
                }
              >
                <span className={isTotal ? 'text-sm font-semibold' : 'text-sm'}>
                  {row.label}
                  {row.hint ? <span className="ml-1.5 text-xs font-normal text-zinc-500">{row.hint}</span> : null}
                </span>
                <span className={`shrink-0 tabular-nums ${amountClass}`}>{row.value}</span>
              </div>
            );
          })}
        </div>
        {formula ? <p className="px-4 py-3 text-xs text-zinc-500">{formula}</p> : null}
      </Card.Content>
    </Card>
  );
}

export function MailLink() {
  return <Link href="mailto:windowssart01@gmail.com">이메일</Link>;
}

export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: 'secondary', fullWidth: true })}
    >
      {children}
    </a>
  );
}

export function KindChip({ children }: { children: ReactNode }) {
  const label = String(children);
  const color = label === '정산 공개' ? 'success' : label === '업데이트' ? 'accent' : 'default';
  return (
    <Chip size="sm" variant="soft" color={color}>
      {children}
    </Chip>
  );
}

export function SpeedCompare({
  title,
  caption,
  rows,
}: {
  title: string;
  caption?: string;
  rows: { label: string; valueLabel: string; value: number }[];
}) {
  return (
    <Card variant="secondary">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        {caption ? <Card.Description>{caption}</Card.Description> : null}
      </Card.Header>
      <Card.Content className="gap-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{row.label}</span>
              <span className="tabular-nums">{row.valueLabel}</span>
            </div>
            <ProgressBar aria-label={row.label} value={row.value} size="sm">
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
