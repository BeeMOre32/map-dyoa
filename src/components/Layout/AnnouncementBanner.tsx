import { announcements } from '@/config/announcements';
import DismissibleBannerList from './DismissibleBannerList';

export default function AnnouncementBanner() {
  if (announcements.length === 0) return null;
  return <DismissibleBannerList announcements={announcements} />;
}
