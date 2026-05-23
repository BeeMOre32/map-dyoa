'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import { format, endOfWeek, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Game, Streamer } from '@prisma/client';
import { useHideEndedStreams } from '@/hooks/useHideEndedStreams';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useLegacyCalendarUi } from '@/hooks/useLegacyCalendarUi';
import { useFavoriteStreamers } from '@/hooks/useFavoriteStreamers';
import { useToast } from '@/components/Common/Toaster';
import {
  buildCalendarDays,
  buildSchedulesByDate,
  CALENDAR_PREFERENCES_KEY,
  countSchedulesInPeriod,
  countVisibleSchedules,
  formatWeekRangeLabel,
  shiftCalendarPeriod,
  type CalendarSlideDirection,
  type CalendarViewMode,
} from '@/lib/calendar/calendarViewUtils';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import { markModalSoftNav } from '@/lib/modal-navigation';

interface UseCalendarViewStateOptions {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
}

export function useCalendarViewState({
  initialSchedules,
  streamers,
  games,
}: UseCalendarViewStateOptions) {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();
  const [legacyUi] = useLegacyCalendarUi();
  const { liveIds: liveStreamerIds } = useLiveStatus();
  const [hideEnded] = useHideEndedStreams();
  const {
    favorites,
    favoriteIds,
    toggle: toggleFavorite,
    favoritesOnly,
    setFavoritesOnly,
  } = useFavoriteStreamers();

  const [optimisticSchedules, addOptimisticSchedule] = useOptimistic(
    initialSchedules,
    (state: FlattenedSchedule[], newSchedule: FlattenedSchedule) => [
      ...state,
      newSchedule,
    ],
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<
    FlattenedSchedule | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');
  const [slideDirection, setSlideDirection] =
    useState<CalendarSlideDirection>('left');
  const [selectedStreamers, setSelectedStreamers] = useState<Set<string>>(
    new Set(),
  );
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [isMobileFabOpen, setIsMobileFabOpen] = useState(false);
  const [mobileMonthDay, setMobileMonthDay] = useState<Date | null>(null);
  const todayMobileRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!session;
  const isV2Weekly = viewMode === 'weekly' && !legacyUi;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CALENDAR_PREFERENCES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        viewMode?: CalendarViewMode;
        selectedStreamers?: string[];
        selectedGames?: string[];
      };

      if (parsed.viewMode === 'weekly' || parsed.viewMode === 'monthly') {
        setViewMode(parsed.viewMode);
      }
      if (Array.isArray(parsed.selectedStreamers)) {
        setSelectedStreamers(new Set(parsed.selectedStreamers));
      }
      if (Array.isArray(parsed.selectedGames)) {
        setSelectedGames(new Set(parsed.selectedGames));
      }
    } catch {
      localStorage.removeItem(CALENDAR_PREFERENCES_KEY);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      CALENDAR_PREFERENCES_KEY,
      JSON.stringify({
        viewMode,
        selectedStreamers: [...selectedStreamers],
        selectedGames: [...selectedGames],
      }),
    );
  }, [mounted, viewMode, selectedStreamers, selectedGames]);

  useEffect(() => {
    if (viewMode === 'weekly' && todayMobileRef.current) {
      todayMobileRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [viewMode, currentDate]);

  const applyFavorites = useCallback(() => {
    if (favorites.length === 0) return;
    setSelectedStreamers(new Set(favorites));
  }, [favorites]);

  const handleStreamerToggle = useCallback((id: string) => {
    setSelectedStreamers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleGameToggle = useCallback((id: string) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const nextPeriod = useCallback(() => {
    setSlideDirection('left');
    setCurrentDate((prev) => shiftCalendarPeriod(prev, viewMode, 'left'));
  }, [viewMode]);

  const prevPeriod = useCallback(() => {
    setSlideDirection('right');
    setCurrentDate((prev) => shiftCalendarPeriod(prev, viewMode, 'right'));
  }, [viewMode]);

  const days = useMemo(
    () => buildCalendarDays(currentDate, viewMode),
    [currentDate, viewMode],
  );

  const schedulesByDate = useMemo(
    () =>
      buildSchedulesByDate({
        schedules: optimisticSchedules,
        hideEnded,
        favoritesOnly,
        favoriteIds,
        selectedStreamers,
        selectedGames,
      }),
    [
      optimisticSchedules,
      selectedStreamers,
      selectedGames,
      hideEnded,
      favoritesOnly,
      favoriteIds,
    ],
  );

  const visibleScheduleCount = useMemo(
    () => countVisibleSchedules(schedulesByDate),
    [schedulesByDate],
  );

  const unfilteredScheduleCountInPeriod = useMemo(
    () => countSchedulesInPeriod(optimisticSchedules, days, hideEnded),
    [optimisticSchedules, days, hideEnded],
  );

  const hasActiveFilters =
    selectedStreamers.size > 0 ||
    selectedGames.size > 0 ||
    favoritesOnly;

  const showFilterEmpty =
    hasActiveFilters &&
    visibleScheduleCount === 0 &&
    unfilteredScheduleCountInPeriod > 0;

  const clearAllFilters = useCallback(() => {
    setSelectedStreamers(new Set());
    setSelectedGames(new Set());
    setFavoritesOnly(false);
  }, [setFavoritesOnly]);

  const handleDayClick = useCallback(
    (day: Date) => {
      markModalSoftNav();
      router.push(`/calendar/day/${format(day, 'yyyy-MM-dd')}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleMonthCellClick = useCallback(
    (day: Date) => {
      if (
        viewMode === 'monthly' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 639px)').matches
      ) {
        setMobileMonthDay(day);
        return;
      }
      handleDayClick(day);
    },
    [viewMode, handleDayClick],
  );

  const handleOpenCreateModal = useCallback(() => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.', {
        actionLabel: '로그인하기',
        onAction: () => router.push('/login'),
      });
      return;
    }
    setEditSchedule(undefined);
    setIsFormOpen(true);
  }, [isLoggedIn, toast, router]);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'weekly' ? 'monthly' : 'weekly'));
    setIsMobileFabOpen(false);
  }, []);

  const handleGoToday = useCallback(() => {
    setCurrentDate(new Date());
    setIsMobileFabOpen(false);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditSchedule(undefined);
    router.refresh();
  }, [router]);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const header = {
    weekRangeKey: format(weekStart, 'yyyy-MM-dd'),
    weekRangeLabel: formatWeekRangeLabel(weekStart, weekEnd),
    weekYearLabel:
      format(weekStart, 'yyyy') === format(weekEnd, 'yyyy')
        ? `${format(weekStart, 'yyyy')}년`
        : null,
    monthHeaderKey: format(currentDate, 'yyyy-MM'),
    monthTitle: format(currentDate, 'yyyy년 M월', { locale: ko }),
  };

  return {
    mounted,
    streamers,
    games,
    legacyUi,
    isV2Weekly,
    isLoggedIn,
    liveStreamerIds,
    hideEnded,
    favoriteIds,
    favoritesOnly,
    toggleFavorite,
    applyFavorites,
    selectedStreamers,
    selectedGames,
    handleStreamerToggle,
    handleGameToggle,
    clearAllFilters,
    showFilterEmpty,
    viewMode,
    setViewMode,
    slideDirection,
    currentDate,
    setCurrentDate,
    days,
    schedulesByDate,
    nextPeriod,
    prevPeriod,
    handleDayClick,
    handleMonthCellClick,
    handleOpenCreateModal,
    handleToggleViewMode,
    handleGoToday,
    isFormOpen,
    editSchedule,
    closeForm,
    optimisticSchedules,
    addOptimisticSchedule,
    startTransition,
    isMobileFabOpen,
    setIsMobileFabOpen,
    mobileMonthDay,
    setMobileMonthDay,
    todayMobileRef,
    header,
  };
}

export type CalendarViewState = ReturnType<typeof useCalendarViewState>;
