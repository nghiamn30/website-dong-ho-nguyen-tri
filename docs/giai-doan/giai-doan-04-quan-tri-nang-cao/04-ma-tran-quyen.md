# Giai đoạn 04 - Ma trận quyền chính thức (G04-M01)

Tài liệu chốt quyền cho 4 vai trò nghiệp vụ. Mã quyền được định nghĩa tại
`backend/src/users/user.types.ts` và gán cho vai trò tại
`backend/src/users/seed-data.ts`.

## 1. Bốn vai trò

| Mã role | Tên | Phạm vi |
|---|---|---|
| `ADMIN` | Quản trị viên | Toàn quyền, phân quyền theo chi, backup/restore, cấu hình |
| `TRUONG_HO` | Trưởng họ | Quản trị dữ liệu toàn họ, duyệt đề xuất, xem audit |
| `TRUONG_CHI` | Trưởng chi | Thao tác/đề xuất trong chi phụ trách, cập nhật ngày mất trong chi |
| `NGUOI_BINH_THUONG` | Người bình thường | Xem dữ liệu công bố, gửi đề xuất chỉnh sửa |

## 2. Quyền mới bổ sung ở giai đoạn 4

| Mã quyền | Ý nghĩa | ADMIN | TRUONG_HO | TRUONG_CHI | NGUOI_BINH_THUONG |
|---|---|:---:|:---:|:---:|:---:|
| `roles.manage-branch-scope` | Gán/huỷ phạm vi chi cho user | ✅ | ❌ | ❌ | ❌ |
| `change-requests.create` | Gửi đề xuất chỉnh sửa | ✅ | ✅ | ✅ | ✅ |
| `change-requests.review` | Duyệt/từ chối đề xuất | ✅ | ✅ | ❌ | ❌ |
| `audit-logs.view` | Xem nhật ký kiểm toán | ✅ | ✅ | ❌ | ❌ |
| `deceased-info.update-branch` | Cập nhật ngày mất trong chi | ✅ | ✅ | ✅ | ❌ |
| `backup.run` | Chạy backup dữ liệu | ✅ | ❌ | ❌ | ❌ |
| `backup.restore` | Phục hồi dữ liệu | ✅ | ❌ | ❌ | ❌ |

## 3. Phạm vi chi/nhánh (`branch_id`) cho trưởng chi

- Trưởng chi được gán một hoặc nhiều `branch_id` qua bảng `branch_scoped_roles`
  (model `BranchScopedRole`).
- Phạm vi hiệu lực = các chi được gán **cộng toàn bộ chi con** (đệ quy theo
  `parent_branch_id`).
- Admin và trưởng họ có phạm vi toàn họ (không bị giới hạn `branch_id`).
- Người bình thường không có phạm vi thao tác, chỉ gửi đề xuất.

Quy tắc enforcement:

1. Thao tác ghi (tạo/sửa/xoá) trên `Person` thuộc chi ngoài phạm vi của trưởng
   chi bị chặn `403 BRANCH_SCOPE_FORBIDDEN`.
2. Cập nhật ngày mất qua `PATCH /genealogy/persons/:id/deceased-info` chỉ áp
   dụng cho thành viên **trong** phạm vi chi.
3. Mọi lần chặn được ghi `audit log` với `success=false`, `important=true`.

## 4. Quyền nền tảng giữ nguyên từ giai đoạn trước

Các quyền `clan.manage`, `branches.manage`, `persons.manage`,
`relationships.manage`, `death-anniversaries.manage`, `events.*`, `posts.*`,
`albums.manage`, `media.*`, `pages.manage`, `users.*`,
`notifications.manage-own`, `reminder-settings.manage-own`,
`dashboard.view` giữ nguyên. Trưởng chi vẫn giữ `persons.manage` nhưng bị bao
bởi guard phạm vi chi ở mục 3.
