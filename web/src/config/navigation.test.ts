import { describe, expect, it } from "vitest";
import {
  getRouteTitle,
  getVisibleNavigation,
  navigationGroups,
  PERMISSIONS,
  routePermissions,
} from "./navigation";

describe("navigation", () => {
  it("keeps route permissions aligned with visible items", () => {
    const routes = navigationGroups.flatMap((group) =>
      group.items.map((item) => item.href),
    );

    expect(Object.keys(routePermissions).sort()).toEqual(routes.sort());
  });

  it("filters navigation by permissions", () => {
    const visible = getVisibleNavigation([PERMISSIONS.DASHBOARD_VIEW]);

    expect(visible).toHaveLength(2);
    expect(visible[0]?.items.map((item) => item.href)).toEqual(["/dashboard"]);
    expect(visible[1]?.items.map((item) => item.href)).toEqual([
      "/family-tree",
      "/people",
    ]);
  });

  it("resolves titles for known and unknown routes", () => {
    expect(getRouteTitle("/users")).toBe("Người dùng");
    expect(getRouteTitle("/unknown")).toBe("Không tìm thấy");
  });
});
