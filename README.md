# Shasthyo Sheba (স্বাস্থ্য সেবা)

A local-first, 100% free healthcare appointment & chamber serial booking platform for Bangladesh. Patients find BM&DC-verified doctors and book chamber appointments (serials), doctors manage their chamber schedules and daily patients, and admins verify doctors.

---

## 1. Prerequisites (Windows PC)

1. **Node.js LTS** (v20+) — [nodejs.org](https://nodejs.org)
2. **Git for Windows** — [git-scm.com](https://git-scm.com)
3. **PostgreSQL 16** — [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (runs automatically as a Windows service)

Verify in Windows PowerShell:

```powershell
node -v
npm.cmd -v
git --version
Test-NetConnection 127.0.0.1 -Port 5432
```

---

## 2. One-Time Setup

1. Double-click **`setup.bat`** (or run `.\setup.bat` in PowerShell inside `C:\dev\shasthyo-sheba`).
2. When Notepad opens `.env`, replace `YOUR_PASSWORD` in `DATABASE_URL` with your local PostgreSQL `postgres` password, save, and close Notepad.
3. `setup.bat` automatically generates a random 32-byte `AUTH_SECRET`, installs packages, generates the Prisma client, applies migrations, and seeds sample Bangladesh healthcare data.

---

## 3. Daily Use

### Option A: Fast Production Mode (`start-fast.bat` — Recommended)
- Double-click **`start-fast.bat`**.
- It runs `npm.cmd run build` only on the first run (if `.next\BUILD_ID` does not exist yet), then launches `npm.cmd run start` and opens `http://localhost:3000`.

### Option B: Development Mode (`start.bat`)
- Double-click **`start.bat`** to start the Next.js development server (`npm.cmd run dev`) and open `http://localhost:3000`.

### Option C: Start Automatically with Windows (`install-autostart.bat`)
- Double-click **`install-autostart.bat`** once.
- This creates a `ShasthyoSheba.lnk` shortcut to `start-fast.bat` inside your Windows `Startup` folder (`shell:startup`).
- After any PC restart, Shasthyo Sheba starts automatically in the background and is immediately reachable at `http://localhost:3000`.

### Option D: Install as a Desktop/App Icon (PWA)
1. With the app running, open `http://localhost:3000` in **Microsoft Edge** or **Google Chrome**.
2. Click the **Install Shasthyo Sheba** icon in the right side of the address bar (or browser menu → **Apps** → **Install Shasthyo Sheba**).
3. Confirm installation. You now have a standalone **Shasthyo Sheba** desktop icon and app window that works offline once running.

### Demo Accounts (Phone + Password)

| Role | Phone Number | Password | Notes |
|---|---|---|---|
| **Admin** | `01700000000` (`+8801700000000`) | `admin123` | Approves doctors, manages clinics/specialties, views `AuditLog` |
| **Patient** | `01711111111` (`+8801711111111`) | `patient123` | Pre-seeded with 1 confirmed sample appointment & payment |
| **Doctors (20)** | `01712000001` to `01712000020` | `doctor123` | BM&DC `A-10001` to `A-10020`, all approved with chambers |

- Stop the app anytime with `Ctrl+C` in its terminal window.

---

## 4. Open on a Phone on the Same Wi-Fi (Optional)

1. Find your PC's local Wi-Fi IPv4 address in PowerShell:
   ```powershell
   ipconfig
   ```
   (Look for `IPv4 Address`, e.g., `192.168.1.105`.)
2. Start the server bound to all interfaces:
   ```powershell
   cd C:\dev\shasthyo-sheba
   npm.cmd run dev -- -H 0.0.0.0
   ```
3. When the **Windows Defender Firewall** prompt appears, check **Private networks** and click **Allow access**.
4. On your phone connected to the same Wi-Fi, open `http://<PC-IP>:3000` (e.g., `http://192.168.1.105:3000`).

---

## 5. Restore on a New PC

To restore your entire project on any Windows PC with Node.js, Git, and PostgreSQL installed:

```powershell
git clone https://github.com/imahmud1ovi-hub/shasthyo-sheba.git C:\dev\shasthyo-sheba
cd C:\dev\shasthyo-sheba
.\setup.bat
```

To pull updates on an existing PC:

```powershell
cd C:\dev\shasthyo-sheba
git pull
npm.cmd install
npm.cmd run db:deploy
```

---

## 6. Useful NPM Scripts

```powershell
npm.cmd run dev          # Start development server at http://localhost:3000
npm.cmd run build        # Create optimized production build
npm.cmd run start        # Start production server
npm.cmd test             # Run all Vitest unit, concurrency & security tests
npm.cmd run db:generate  # Generate Prisma client
npm.cmd run db:migrate   # Create and apply a development migration
npm.cmd run db:deploy    # Apply committed migrations
npm.cmd run db:seed      # Reset and seed sample Bangladesh healthcare data
npm.cmd run db:reset     # Full database reset and re-seed
```

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| `Can't reach database server` (P1001) | PostgreSQL service is not running. Start `postgresql-x64-16` in `services.msc`, or check port (`5432` or `5433`) in `DATABASE_URL` in `.env`. |
| `password authentication failed` | Password in `.env` is wrong. Fix `.env`. |
| `EPERM` on `prisma generate` | Run `Get-Process node -ErrorAction SilentlyContinue \| Stop-Process -Force`, delete `node_modules\.prisma`, and run again. Keep the project in `C:\dev\shasthyo-sheba` (never in a `scratch` folder). |
| Port 3000 in use | `npm.cmd run dev -- -p 3001` |
| Seed fails with "already exists" | Run `npm.cmd run db:reset`. |
| OTP not visible | Look in the terminal window running the app, not the browser console. |
