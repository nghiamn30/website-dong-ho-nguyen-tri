# Hướng dẫn vận hành backup/restore (G04-M05)

Tài liệu vận hành sao lưu và phục hồi dữ liệu tối thiểu cho website dòng họ.

## 1. Phạm vi và điều kiện

- Backup/restore chỉ áp dụng khi chạy với **PostgreSQL** (`DB_ENABLED=true`).
  Chế độ in-memory (dùng để smoke test nhanh) không có dữ liệu bền vững nên
  không cần backup.
- Cần cài **PostgreSQL client** (`pg_dump`, `pg_restore`) trong PATH.
- Quyền chạy: chỉ tài khoản có quyền `backup.run` / `backup.restore` (vai trò
  `ADMIN`) được phép thực hiện. Thao tác chạy trên máy/máy chủ, không qua UI.

## 2. Cấu hình kết nối

Script đọc cấu hình từ `backend/.env` (hoặc đường dẫn truyền vào). Các biến:

```
DB_ENABLED=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dong_ho_nguyen_tri
# hoặc tách rời:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dong_ho_nguyen_tri
```

## 3. Sao lưu (backup)

```powershell
pnpm db:backup
```

- Script: `scripts/backup-db.ps1`.
- Tạo file `.backups/<db_name>-<yyyyMMdd-HHmmss>.dump` (định dạng custom của
  `pg_dump`, `--no-owner`).
- Kiểm tra file tạo ra tồn tại và có dung lượng > 0.

Tuỳ chọn thư mục đầu ra:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1 -OutputDir D:\sao-luu
```

## 4. Phục hồi (restore)

> Restore ghi đè object trùng tên. **Chỉ chạy trên môi trường không phải
> production** (máy dev, máy staging) trừ khi có kế hoạch rõ ràng.

```powershell
pnpm db:restore -- -BackupFile .backups/dong_ho_nguyen_tri-20260531-101500.dump
```

- Script: `scripts/restore-db.ps1`.
- Mặc định hỏi xác nhận: nhập `RESTORE` để tiếp tục.
- Dùng `-Force` để bỏ xác nhận khi chạy tự động:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-db.ps1 -BackupFile <file> -Force
```

## 5. Quy trình thử restore (nghiệm thu)

1. Bật PostgreSQL local, đặt `DB_ENABLED=true`.
2. Chạy migrate + seed: `pnpm --dir backend prisma:migrate` rồi khởi động backend.
3. `pnpm db:backup` → ghi nhận đường dẫn file.
4. Tạo một DB thử (vd `dong_ho_test`) hoặc dùng DB dev.
5. `pnpm db:restore -- -BackupFile <file>` và xác nhận dữ liệu khôi phục đúng.
6. Đối chiếu số bản ghi các bảng chính (`persons`, `branches`, `events`,
   `change_requests`, `audit_logs`).

## 6. Backup file upload (media)

- File tải lên lưu tại thư mục storage của backend (xem `StorageService`).
- Sao lưu thư mục này song song với dump database (copy/rsync) theo cùng mốc
  thời gian để khôi phục nhất quán.

## 7. Giới hạn và ngoài phạm vi

- Chưa có backup cloud tự động (chờ chốt hạ tầng).
- Chưa có lịch backup định kỳ tự động; thực hiện thủ công hoặc qua cron/Task
  Scheduler nếu cần.
