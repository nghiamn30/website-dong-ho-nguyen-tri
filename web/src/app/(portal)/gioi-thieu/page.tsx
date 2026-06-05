import { PortalIntroPage } from "@/components/portal/portal-intro-page";
import { PAGE_KEYS } from "@/lib/content";

export const metadata = { title: "Giới thiệu — Dòng họ Nguyễn Trí" };

export default function Page() {
  return (
    <PortalIntroPage
      pageKey={PAGE_KEYS.ABOUT}
      fallbackTitle="Giới thiệu dòng họ"
    />
  );
}
