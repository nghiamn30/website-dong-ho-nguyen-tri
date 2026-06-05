import { PortalIntroPage } from "@/components/portal/portal-intro-page";
import { PAGE_KEYS } from "@/lib/content";

export const metadata = { title: "Từ đường — Dòng họ Nguyễn Trí" };

export default function Page() {
  return (
    <PortalIntroPage
      pageKey={PAGE_KEYS.ANCESTRAL_HOUSE}
      fallbackTitle="Từ đường dòng họ"
    />
  );
}
