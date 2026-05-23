export default function CalendarLiveColumnBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-px shadow-sm shadow-red-500/30">
      <span className="h-1 w-1 animate-ping rounded-full bg-white" />
      <span className="text-[8px] font-black tracking-wide text-white">LIVE</span>
    </span>
  );
}
