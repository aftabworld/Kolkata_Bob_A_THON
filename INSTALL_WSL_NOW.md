# 🚨 URGENT: Install WSL 2 to Fix Docker Desktop

## ⚠️ Current Problem
Docker Desktop cannot start because WSL 2 is not installed on your Windows system.

---

## ✅ SOLUTION: Follow These Steps RIGHT NOW

### Step 1: Open PowerShell as Administrator

**Method 1 (Recommended):**
1. Press `Windows Key` on your keyboard
2. Type: `PowerShell`
3. **RIGHT-CLICK** on "Windows PowerShell"
4. Click "Run as administrator"
5. Click "Yes" when prompted

**Method 2:**
1. Press `Windows Key + X`
2. Click "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted

### Step 2: Install WSL 2

In the Administrator PowerShell window, copy and paste this command:

```powershell
wsl --install
```

Press `Enter` and wait (this takes 2-5 minutes).

### Step 3: Restart Your Computer

**IMPORTANT:** You MUST restart your computer for WSL to work.

```powershell
Restart-Computer
```

Or manually restart Windows.

### Step 4: After Restart - Complete Ubuntu Setup

1. Ubuntu will automatically open after restart
2. Wait for installation to complete (1-2 minutes)
3. When prompted, create a username:
   - Use lowercase letters only
   - No spaces
   - Example: `john` or `myuser`
4. Create a password:
   - You won't see it as you type (this is normal)
   - Type it carefully
   - Press Enter
5. Retype the password to confirm
6. Wait for "Installation successful" message

### Step 5: Start Docker Desktop

1. Find Docker Desktop icon on your desktop or Start menu
2. Double-click to launch
3. Wait 1-2 minutes for Docker to start
4. Look for green whale icon in system tray (bottom-right)

### Step 6: Verify Everything Works

Open PowerShell (normal, not admin) and run:

```powershell
# Check WSL
wsl --status

# Check Docker
docker --version

# Test Docker
docker run hello-world
```

If all commands work, you're ready!

### Step 7: Start Medical Claim System

```powershell
cd c:\Users\04248D744\Desktop\Kolkata_Demo\Kolkata_Bob_A_THON\medical-claim-system
docker-compose up -d
```

---

## 🆘 If You Get Errors

### Error: "This operation requires elevation"
- You didn't run PowerShell as Administrator
- Go back to Step 1 and make sure to RIGHT-CLICK and select "Run as administrator"

### Error: "WSL 2 requires an update to its kernel component"
Run this in Administrator PowerShell:
```powershell
wsl --update
```

### Error: "Virtualization is not enabled"
1. Restart your computer
2. Press F2, F10, Del, or Esc during boot (depends on your PC)
3. Find "Virtualization Technology" or "Intel VT-x" or "AMD-V"
4. Enable it
5. Save and exit BIOS
6. Boot into Windows
7. Try Step 2 again

---

## 📞 Still Having Issues?

Run the automated fix script:

```powershell
# Open PowerShell as Administrator
cd c:\Users\04248D744\Desktop\Kolkata_Demo\Kolkata_Bob_A_THON\medical-claim-system
.\fix-docker-desktop.ps1
```

Or check the detailed guide:
- `docs/DOCKER_DESKTOP_TROUBLESHOOTING.md`

---

## ⏱️ Time Required

- WSL Installation: 2-5 minutes
- Computer Restart: 2-3 minutes
- Ubuntu Setup: 2-3 minutes
- Docker Desktop Start: 1-2 minutes

**Total: About 10-15 minutes**

---

## ✅ Quick Checklist

- [ ] Opened PowerShell as Administrator
- [ ] Ran `wsl --install`
- [ ] Restarted computer
- [ ] Completed Ubuntu setup (username/password)
- [ ] Started Docker Desktop
- [ ] Verified with `docker --version`
- [ ] Tested with `docker run hello-world`
- [ ] Started Medical Claim System with `docker-compose up -d`

---

**🎯 Bottom Line:** You MUST install WSL 2 and restart your computer before Docker Desktop will work. There is no way around this requirement on Windows.