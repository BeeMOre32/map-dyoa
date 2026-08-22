'use client';

import { format } from 'date-fns';
import { AnimatePresence } from 'motion/react';
import { calendarGridSlide } from '@/lib/calendarMotion';
import { useCalendarViewState } from '@/hooks/useCalendarViewState';
import ScheduleFormModal from '@/components/Form/CreateScheduleModal';
import FilterBar from '@/components/Calendar/FilterBar';
import CalendarWelcomeBanner from '@/components/Calendar/CalendarWelcomeBanner';
import CalendarFilterEmptyBanner from '@/components/Calendar/CalendarFilterEmptyBanner';
import CalendarMobileDaySheet from '@/components/Calendar/CalendarMobileDaySheet';
import CalendarMobileFab from '@/components/Calendar/CalendarMobileFab';
import CalendarPeriodNav from '@/components/Calendar/atoms/CalendarPeriodNav';
import CalendarPeriodHeader from '@/components/Calendar/atoms/CalendarPeriodHeader';
import CalendarDesktopToolbar from '@/components/Calendar/atoms/CalendarDesktopToolbar';
import CalendarHideEndedBanner from '@/components/Calendar/atoms/CalendarHideEndedBanner';
import CalendarMobileWeeklyList from '@/components/Calendar/grids/CalendarMobileWeeklyList';
import CalendarWeeklyV2Grid from '@/components/Calendar/grids/CalendarWeeklyV2Grid';
import CalendarMonthLegacyGrid from '@/components/Calendar/grids/CalendarMonthLegacyGrid';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { Game, Streamer } from '@prisma/client';

/** 이전 배포 클라이언트 번들 호환 */
void calendarGridSlide;

interface CalendarViewProps {
  initialSchedules: FlattenedSchedule[];
  streamers: Streamer[];
  games: Game[];
}

export default function CalendarView(props: CalendarViewProps) {
  const state = useCalendarViewState(props);

  if (!state.mounted) {
    return <div className="flex-1 bg-slate-50/50 dark:bg-slate-950" />;
  }

  const shellClass = state.isV2Weekly
    ? 'rounded-3xl border border-slate-200/80 bg-slate-100/40 shadow-sm dark:border-slate-800 dark:bg-slate-900/60'
    : 'rounded-4xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

  return (
    <div
      className={`flex flex-col sm:min-h-0 sm:flex-1 sm:overflow-hidden ${
        state.isV2Weekly ? 'px-1.5 py-2.5 md:px-2 md:py-4' : 'p-3 sm:p-4 md:p-6'
      }`}
    >
      <CalendarWelcomeBanner />

      <div className="mb-4 flex shrink-0 flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="flex w-full min-w-0 items-center gap-3 md:w-auto">
          <CalendarPeriodNav
            onPrev={state.prevPeriod}
            onNext={state.nextPeriod}
          />
          <CalendarPeriodHeader
            viewMode={state.viewMode}
            slideDirection={state.slideDirection}
            {...state.header}
          />
        </div>
        <CalendarDesktopToolbar
          viewMode={state.viewMode}
          isLoggedIn={state.isLoggedIn}
          onGoToday={state.handleGoToday}
          onSetViewMode={state.setViewMode}
          onOpenCreateModal={state.handleOpenCreateModal}
        />
      </div>

      <FilterBar
        streamers={state.streamers}
        games={state.games}
        selectedStreamers={state.selectedStreamers}
        selectedGames={state.selectedGames}
        favoriteIds={state.favoriteIds}
        onStreamerToggle={state.handleStreamerToggle}
        onGameToggle={state.handleGameToggle}
        onToggleFavorite={state.toggleFavorite}
        onApplyFavorites={state.applyFavorites}
        onClearAll={state.clearAllFilters}
      />

      {state.showFilterEmpty ? (
        <CalendarFilterEmptyBanner
          favoritesOnly={state.favoritesOnly}
          onClear={state.clearAllFilters}
        />
      ) : null}

      {state.hideEnded ? <CalendarHideEndedBanner /> : null}

      <div className={`flex flex-col sm:min-h-0 sm:flex-1 sm:overflow-hidden ${shellClass}`}>
        {state.viewMode === 'weekly' ? (
          <CalendarMobileWeeklyList
            days={state.days}
            schedulesByDate={state.schedulesByDate}
            slideDirection={state.slideDirection}
            currentDate={state.currentDate}
            legacyUi={state.legacyUi}
            liveStreamerIds={state.liveStreamerIds}
            isLoggedIn={state.isLoggedIn}
            todayMobileRef={state.todayMobileRef}
            onDayClick={state.handleDayClick}
            onOpenCreateModal={state.handleOpenCreateModal}
          />
        ) : null}

        <div
          className={`flex flex-col sm:min-h-0 sm:flex-1 sm:overflow-hidden ${
            state.viewMode === 'weekly' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {state.isV2Weekly ? (
            <CalendarWeeklyV2Grid
              days={state.days}
              schedulesByDate={state.schedulesByDate}
              slideDirection={state.slideDirection}
              currentDate={state.currentDate}
              liveStreamerIds={state.liveStreamerIds}
              isLoggedIn={state.isLoggedIn}
              onDayClick={state.handleDayClick}
              onOpenCreateModal={state.handleOpenCreateModal}
            />
          ) : (
            <CalendarMonthLegacyGrid
              days={state.days}
              schedulesByDate={state.schedulesByDate}
              slideDirection={state.slideDirection}
              currentDate={state.currentDate}
              viewMode={state.viewMode}
              legacyUi={state.legacyUi}
              liveStreamerIds={state.liveStreamerIds}
              onCellClick={state.handleMonthCellClick}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {state.isFormOpen ? (
          <ScheduleFormModal
            streamers={state.streamers}
            games={state.games}
            initialData={state.editSchedule}
            onOptimisticCreate={(schedule) => {
              state.startTransition(() => {
                state.addOptimisticSchedule(schedule);
              });
            }}
            onClose={state.closeForm}
          />
        ) : null}
      </AnimatePresence>

      <CalendarMobileDaySheet
        day={state.mobileMonthDay}
        schedules={
          state.mobileMonthDay
            ? state.schedulesByDate.get(
                format(state.mobileMonthDay, 'yyyy-MM-dd'),
              ) ?? []
            : []
        }
        liveStreamerIds={state.liveStreamerIds}
        isLoggedIn={state.isLoggedIn}
        onClose={() => state.setMobileMonthDay(null)}
        onAdd={state.handleOpenCreateModal}
        onOpenDay={(day) => {
          state.setMobileMonthDay(null);
          state.handleDayClick(day);
        }}
      />

      <CalendarMobileFab
        isOpen={state.isMobileFabOpen}
        viewMode={state.viewMode}
        onToggle={() => state.setIsMobileFabOpen((prev) => !prev)}
        onClose={() => state.setIsMobileFabOpen(false)}
        onGoToday={state.handleGoToday}
        onToggleViewMode={state.handleToggleViewMode}
        onOpenCreateModal={state.handleOpenCreateModal}
      />
    </div>
  );
}
