# Shasthyo Sheba (স্বাস্থ্য সেবা)

A local-first, 100% free healthcare appointment & chamber serial booking platform for Bangladesh. Patients can discover verified doctors and book chamber serials, doctors manage their chamber schedules and daily patients, and admins verify doctors.

---

## Prerequisites (Windows PC)

1. **Node.js LTS** (v20+) — [nodejs.org](https://nodejs.org)
2. **Git for Windows** — [git-scm.com](https://git-scm.com)
3. **PostgreSQL 16** — [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (port `5432`, user `postgres`, runs automatically as a Windows service)

Verify in PowerShell:

```powershell
node -v
npm.cmd -v
git --version
Test-NetConnection 127.0.0.1 -Port 5432
```

---

## One-Time Setup

1. Double-click **`setup.bat`** (or run `.\setup.bat` in PowerShell inside `C:\dev\shasthyo-sheba`).
2. When Notepad opens `.env`, replace `YOUR_PASSWORD` in `DATABASE_URL` with your local PostgreSQL `postgres` password, save, and close Notepad.
3. `setup.bat` automatically generates a random `AUTH_SECRET`, installs packages, runs Prisma migrations, and seeds sample data.

---

## Daily Use

1. Double-click **`start.bat`**.
2. Your browser will open `http://localhost:3000`.
3. Log in at `/login`. The 6-digit OTP is printed in the terminal window running the app.
4. Stop the server anytime by pressing `Ctrl+C` in its terminal window.

### Demo Accounts (Seeded in Phase 1)

| Role | Phone Number |
|---|---|
| **Admin** | `01700000000` (`+8801700000000`) |
| **Patient** | `01711111111` (`+8801711111111`) |
| **Doctors (20)** | `01712000001` to `01712000020` |

---

## Useful NPM Scripts

```powershell
npm.cmd run dev          # Start development server at http://localhost:3000
npm.cmd test             # Run Vitest unit & integration tests
npm.cmd run db:generate  # Generate Prisma client
npm.cmd run db:migrate   # Create and apply a development migration
npm.cmd run db:deploy    # Apply committed migrations
npm.cmd run db:seed      # Seed sample Bangladesh healthcare data
npm.cmd run db:reset     # Reset database and re-seed
```

---

## Restore on Any PC

```powershell
git clone https://github.com/imahmud1ovi-hub/shasthyo-sheba.git C:\dev\shasthyo-sheba
cd C:\dev\shasthyo-sheba
.\setup.bat
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Can't reach database server` (P1001) | PostgreSQL service is not running. Start it in `services.msc`, or check `DATABASE_URL` in `.env`. |
| `password authentication failed` | Password in `.env` is wrong. Fix `.env`. |
| `EPERM` on `prisma generate` | Run `Get-Process node -ErrorAction SilentlyContinue \| Stop-Process -Force`, delete `node_modules\.prisma`, and run again. |
| Port 3000 in use | `npm.cmd run dev -- -p 3001` |
| Seed fails with "already exists" | Run `npm.cmd run db:reset`. |
| OTP not visible | Look in the terminal window running the app, not the browser console. |
