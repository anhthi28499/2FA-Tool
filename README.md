# Authenticator (TOTP) — Vue

Ứng dụng web tạo mã TOTP 6 số (30 giây), chạy hoàn toàn trên trình duyệt. Chuỗi secret được lưu trong `localStorage` của trình duyệt bạn.

**Tài liệu chi tiết:** [Hoạt động, request, tương thích Google, Vercel & traffic](docs/HOAT-DONG-VA-KIEN-TRUC.md).

## Chạy local

```bash
npm install
npm run dev
```

Hoặc dùng script (tự `npm ci` nếu chưa có `node_modules`, bật `--host` để truy cập từ LAN):

```bash
./scripts/runserver.sh
```

Các lệnh tương đương trong `package.json`:

- `npm run dev` — Vite mặc định (chỉ localhost).
- `npm run runserver` hoặc `npm start` — Vite với `--host` (cùng ý với script).

Mở URL hiển thị trong terminal (thường là `http://localhost:5173`).

## Build

```bash
npm run build
```

Thư mục output: `dist/`.

## Deploy lên Vercel

### Cách 1 — Qua trang Vercel (khuyến nghị, không cần token CLI)

1. Đẩy mã lên GitHub (hoặc GitLab/Bitbucket).
2. [vercel.com](https://vercel.com) → **Add New Project** → **Import** repository.
3. **Framework Preset**: Vite (hoặc Other).
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Deploy** — mỗi lần push lên nhánh production, Vercel tự build và deploy.

Không cần `VERCEL_TOKEN` trên máy bạn nếu chỉ dùng cách này.

### Cách 2 — Từ máy bằng Vercel CLI

Lỗi `No existing credentials found` / `pass "--token"` nghĩa là CLI chưa có quyền. Làm **một trong hai**:

**A. Đăng nhập tương tác (máy cá nhân):**

```bash
cd "/đường/dẫn/tới/2fa-tool"
npx vercel@latest login
npm run build
npx vercel@latest deploy dist --prod
```

Lần đầu CLI sẽ hỏi **link project** — chọn team / tạo project. Sau đó có thể dùng lại lệnh deploy.

**B. Deploy bằng token (máy/CI, không mở trình duyệt):**

1. Tạo token: [Vercel → Account → Tokens](https://vercel.com/account/tokens).
2. Lấy **Org ID** và **Project ID**: sau khi `vercel link` xem file `.vercel/project.json`, hoặc Vercel → Project → **Settings → General**.
3. Chạy (thay giá trị thật):

```bash
export VERCEL_TOKEN="..."   # token vừa tạo
export VERCEL_ORG_ID="..."
export VERCEL_PROJECT_ID="..."
npm run build
npx vercel@latest deploy dist --prod --yes --token "$VERCEL_TOKEN"
```

Nếu thiếu `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`, CLI có thể hỏi link hoặc báo lỗi — nên `vercel link` một lần trên máy trước, hoặc set đủ 3 biến như trên.

Cảnh báo `npm warn deprecated tar` khi cài Vercel CLI tạm thời có thể bỏ qua; không chặn deploy.

## CI/CD (GitHub Actions)

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): mỗi push/PR lên `main` hoặc `master` chạy `npm ci` và `npm run build`, đồng thời lưu artifact `dist` (7 ngày).
- **CD** ([`.github/workflows/deploy-vercel.yml`](.github/workflows/deploy-vercel.yml)): sau khi build, deploy thư mục `dist` lên Vercel production khi push lên `main`/`master` (và có thể chạy tay bằng **Actions → Deploy (Vercel) → Run workflow**).

**Nếu workflow báo giống lỗi CLI:** `No existing credentials` / thiếu token — workflow **bắt buộc** có secret `VERCEL_TOKEN` (và nên có `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`). Nếu chưa thêm secret, bước deploy sẽ fail giống chạy tay khi `$VERCEL_TOKEN` rỗng.

Để CD hoạt động, thêm **Repository secrets** trên GitHub (**Settings → Secrets and variables → Actions**):

| Secret | Lấy ở đâu |
|--------|-----------|
| `VERCEL_TOKEN` | [Vercel → Account → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Project → Settings → General, hoặc file `.vercel/project.json` sau `npx vercel link` |
| `VERCEL_PROJECT_ID` | Giống trên |

Nếu chỉ cần Vercel tự build khi push (không dùng workflow deploy), có thể xóa hoặc vô hiệu hóa file `deploy-vercel.yml` và kết nối repo trong dashboard Vercel như mục trên.

## Công nghệ

- Vue 3 + Vite
- [otplib](https://github.com/yeojz/otplib) (`generateSync`, TOTP)

## Bảo mật

Secret chỉ tồn tại trên máy bạn (localStorage). Không gửi lên server. Không dùng chung máy công cộng cho tài khoản nhạy cảm.
