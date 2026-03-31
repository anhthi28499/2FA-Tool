# Authenticator (TOTP) — Vue

Ứng dụng web tạo mã TOTP 6 số (30 giây), chạy hoàn toàn trên trình duyệt. Chuỗi secret được lưu trong `localStorage` của trình duyệt bạn.

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

1. Đẩy mã lên GitHub/GitLab/Bitbucket (khuyến nghị).
2. Vào [Vercel](https://vercel.com) → **Add New Project** → import repository.
3. **Framework Preset**: Vite (hoặc Other).
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Không cần biến môi trường cho bản này.

Hoặc dùng Vercel CLI:

```bash
npx vercel
```

## CI/CD (GitHub Actions)

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): mỗi push/PR lên `main` hoặc `master` chạy `npm ci` và `npm run build`, đồng thời lưu artifact `dist` (7 ngày).
- **CD** ([`.github/workflows/deploy-vercel.yml`](.github/workflows/deploy-vercel.yml)): sau khi build, deploy thư mục `dist` lên Vercel production khi push lên `main`/`master` (và có thể chạy tay bằng **Actions → Deploy (Vercel) → Run workflow**).

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
