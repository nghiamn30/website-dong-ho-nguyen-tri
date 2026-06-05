import { PortalIntroPage } from "@/components/portal/portal-intro-page";
import { PAGE_KEYS } from "@/lib/content";

export const metadata = { title: "Lịch sử dòng họ — Dòng họ Nguyễn Trí" };

export default function Page() {
  return (
    <PortalIntroPage
      pageKey={PAGE_KEYS.HISTORY}
      fallbackTitle="Lịch sử dòng họ"
    />
  );
}
