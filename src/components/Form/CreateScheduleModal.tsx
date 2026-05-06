'use client';

import { useState } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { motion } from 'framer-motion';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { Streamer, Game } from '@prisma/client';
import { FlattenedSchedule } from '@/lib/schedule-formatters';
import { CreateScheduleModalProps, CreateMode } from './types';
import { useEditScheduleForm } from './hooks/useEditScheduleForm';
import { useBatchScheduleForm } from './hooks/useBatchScheduleForm';
import ModalHeader from './components/ModalHeader';
import ModeTabs from './components/ModeTabs';
import EditScheduleForm from './components/EditScheduleForm';
import BatchScheduleForm from './components/BatchScheduleForm';
import ModalFooter from './components/ModalFooter';
import ScheduleExtractTab from './ScheduleExtractTab';

export default function CreateScheduleModal({
  streamers,
  games,
  onClose,
  initialData,
  isEdit = false,
  onOptimisticCreate,
}: CreateScheduleModalProps) {
  const [createMode, setCreateMode] = useState<CreateMode>('single');

  const editForm = useEditScheduleForm({
    initialData,
    isEdit,
    games,
    streamers,
    onOptimisticCreate,
    onClose,
  });

  const batchForm = useBatchScheduleForm({
    games,
    onClose,
  });

  useEscapeKey(onClose);

  const sortedStreamers = [...streamers].sort((a, b) =>
    a.name.localeCompare(b.name, 'ko-KR'),
  );

  const showEditOrSingle = isEdit || createMode === 'single';
  const showExtract = !isEdit && (createMode === 'image' || createMode === 'text');
  const showBatch = !isEdit && createMode === 'batch' && !showExtract;

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={backdropVariants}
        className="fixed inset-0 z-70 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={smoothModalVariants}
          className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader
            isEdit={isEdit}
            createMode={createMode}
            slotCount={batchForm.slots.length}
            onClose={onClose}
          />

          {!isEdit && (
            <ModeTabs createMode={createMode} setCreateMode={setCreateMode} />
          )}

          {showEditOrSingle && (
            <>
              <EditScheduleForm
                title={editForm.title}
                setTitle={editForm.setTitle}
                startTime={editForm.startTime}
                setStartTime={editForm.setStartTime}
                selectedGameId={editForm.selectedGameId}
                setSelectedGameId={editForm.setSelectedGameId}
                participants={editForm.participants}
                liveUrls={editForm.liveUrls}
                setLiveUrls={editForm.setLiveUrls}
                isTimeTBD={editForm.isTimeTBD}
                setIsTimeTBD={editForm.setIsTimeTBD}
                isNaeJeon={editForm.isNaeJeon}
                setIsNaeJeon={editForm.setIsNaeJeon}
                isLiveEnded={editForm.isLiveEnded}
                setIsLiveEnded={editForm.setIsLiveEnded}
                isEdit={isEdit}
                isHoi4Game={editForm.isHoi4Game}
                editErrors={editForm.editErrors}
                editMetaLoading={editForm.editMetaLoading}
                editAutoFilled={editForm.editAutoFilled}
                setEditAutoFilled={editForm.setEditAutoFilled}
                sortedStreamers={sortedStreamers}
                games={games}
                onToggleStreamer={editForm.toggleStreamer}
                onUpdateParticipant={editForm.updateParticipant}
                onLiveUrlBlur={editForm.handleLiveUrlBlur}
                onSubmit={editForm.handleEditSubmit}
              />

              <ModalFooter
                error={editForm.editErrors.submit}
                isSubmitting={editForm.isSubmitting}
                loadingText="정보 가져오는 중..."
                submittingText={isEdit ? '수정 중...' : '등록 중...'}
                submitText={isEdit ? '수정 완료' : '일정 등록'}
                onClose={onClose}
                formId="schedule-form"
                disabled={editForm.editMetaLoading}
              />
            </>
          )}

          {showBatch && (
            <>
              <BatchScheduleForm
                slots={batchForm.slots}
                expandedKey={batchForm.expandedKey}
                sortedStreamers={sortedStreamers}
                games={games}
                onToggleExpand={(key) => batchForm.setExpandedKey(key)}
                onAddSlot={batchForm.addSlot}
                onRemoveSlot={batchForm.removeSlot}
                onUpdateSlot={batchForm.updateSlot}
                onSlotLiveUrlBlur={batchForm.handleSlotLiveUrlBlur}
                onSubmit={batchForm.handleBatchSubmit}
              />

              <ModalFooter
                error={batchForm.batchSubmitError}
                isSubmitting={batchForm.isSubmitting}
                submittingText="등록 중..."
                submitText={`${batchForm.slots.length}개 일정 등록`}
                onClose={onClose}
                formId="batch-create-form"
                disabled={batchForm.slots.some((s) => s.metaLoading)}
              />
            </>
          )}

          {showExtract && (
            <ScheduleExtractTab
              key={createMode}
              mode={createMode}
              streamers={streamers}
              games={games}
              onClose={onClose}
            />
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
