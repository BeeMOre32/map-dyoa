'use client';

import { Button, ListBox, SearchField, Select } from '@heroui/react';
import { X } from 'lucide-react';
import type { Hoi4LeaderboardData } from '@/lib/data-fetching';
import type { Hoi4FilterState } from '@/lib/hoi4/hoi4FormUtils';
import { HOI4_PERIOD_OPTIONS } from '@/lib/hoi4/hoi4FormUtils';

type Hoi4FilterBarProps = {
  filters: Hoi4FilterState;
  members: Hoi4LeaderboardData['leaderboard'];
  onChange: (next: Partial<Hoi4FilterState>) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <Select
      aria-label={label}
      className="!w-full !min-w-0"
      selectedKey={value}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(String(key));
      }}
    >
      <Select.Trigger className="!w-full !min-w-0 !overflow-hidden !pe-7">
        <Select.Value className="!block !max-w-full !truncate" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="!min-w-40 max-h-72 overflow-auto">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export default function Hoi4FilterBar({
  filters,
  members,
  onChange,
  onClear,
  hasActiveFilter,
}: Hoi4FilterBarProps) {
  const memberOptions = [
    { id: 'all', label: '전체 멤버' },
    ...members.map((entry) => ({ id: entry.streamer.id, label: entry.streamer.name })),
  ];
  const periodOptions = HOI4_PERIOD_OPTIONS.map((opt) => ({
    id: opt.value || 'all',
    label: opt.label,
  }));

  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
      <FilterSelect
        label="멤버"
        value={filters.memberId ?? 'all'}
        onChange={(memberId) => onChange({ memberId: memberId === 'all' ? null : memberId })}
        options={memberOptions}
      />
      <SearchField
        aria-label="국가 검색"
        className="w-full"
        value={filters.nationQuery}
        onChange={(nationQuery) => onChange({ nationQuery })}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="국가 검색" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <FilterSelect
        label="기간"
        value={filters.periodMonths?.toString() ?? 'all'}
        onChange={(period) =>
          onChange({ periodMonths: period === 'all' ? null : Number(period) })
        }
        options={periodOptions}
      />
      {hasActiveFilter ? (
        <Button size="sm" variant="ghost" onPress={onClear}>
          <X className="h-3.5 w-3.5" />
          초기화
        </Button>
      ) : null}
    </div>
  );
}
