# 🔧 Docker Desktop Troubleshooting Guide

## ⚠️ Current Issue: Docker Desktop Unable to Start

**Error Message:** `unable to get image 'postgres:14-alpine': Error response from daemon: Docker Desktop is unable to start`

**Root Cause:** Windows Subsystem for Linux (WSL) is not installed on your system.

---

## 🎯 Solution: Install WSL 2

Docker Desktop on Windows requires WSL 2 to function. Follow these steps to install it:

### Step 1: Install WSL 2 (REQUIRED)

Open **PowerShell as Administrator** and run:

```powershell
# Install WSL with default Ubuntu distribution
wsl --install

# This command will:
# - Enable WSL feature
# - Enable Virtual Machine Platform
# - Download and install Ubuntu
# - Set WSL 2 as default version
```

**Important:** After running this command, you **MUST restart your computer**.

### Step 2: Restart Your Computer

```powershell
# Restart from PowerShell
Restart-Computer

# Or manually restart Windows
```

### Step 3: Complete Ubuntu Setup (After Restart)

1. After restart, Ubuntu will automatically launch
2. Create a username (lowercase, no spaces)
3. Create a password (you won't see it as you type)
4. Wait for installation to complete

### Step 4: Verify WSL Installation

Open PowerShell and run:

```powershell
# Check WSL status
wsl --status

# Expected output:
# Default Distribution: Ubuntu
# Default Version: 2

# List installed distributions
wsl --list --verbose

# Expected output:
# NAME      STATE           VERSION
# Ubuntu    Running         2
```

---

## 🚀 Alternative: Manual WSL Installation

If `wsl --install` doesn't work, use manual installation:

### Method 1: Enable WSL Features

Open **PowerShell as Administrator**:

```powershell
# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart computer
Restart-Computer
```

### Method 2: Set WSL 2 as Default (After Restart)

Open **PowerShell as Administrator**:

```powershell
# Download and install WSL 2 kernel update
# Visit: https://aka.ms/wsl2kernel
# Or run:
wsl --update

# Set WSL 2 as default version
wsl --set-default-version 2

# Install Ubuntu
wsl --install -d Ubuntu
```

---

## 🐳 Start Docker Desktop After WSL Installation

### Step 1: Verify WSL is Running

```powershell
# Check WSL status
wsl --status

# Start WSL if needed
wsl
```

### Step 2: Start Docker Desktop

**Option A: Using GUI**
1. Find Docker Desktop icon on desktop or Start menu
2. Double-click to launch
3. Wait 1-2 minutes for Docker to start
4. Look for green whale icon in system tray

**Option B: Using PowerShell**
```powershell
# Start Docker Desktop service
Start-Service -Name "com.docker.service"

# Or launch Docker Desktop application
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Step 3: Verify Docker is Running

```powershell
# Check Docker service status
Get-Service -Name "com.docker.service"

# Expected output: Status = Running

# Check Docker version
docker --version

# Expected output: Docker version 24.x.x

# Test Docker
docker run hello-world

# Expected output: Hello from Docker!
```

---

## 🔍 Additional Troubleshooting Steps

### Issue 1: Docker Desktop Still Won't Start

**Solution A: Reset WSL**
```powershell
# Shutdown WSL
wsl --shutdown

# Wait 10 seconds, then start Docker Desktop
Start-Sleep -Seconds 10
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

**Solution B: Reset Docker Desktop**
1. Close Docker Desktop completely
2. Open PowerShell as Administrator:
```powershell
# Stop Docker service
Stop-Service -Name "com.docker.service"

# Shutdown WSL
wsl --shutdown

# Clear Docker data (CAUTION: This removes all containers and images)
Remove-Item -Path "$env:APPDATA\Docker" -Recurse -Force -ErrorAction SilentlyContinue

# Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Issue 2: "Hardware Virtualization Not Enabled"

**Solution:**
1. Restart computer and enter BIOS/UEFI
   - Press F2, F10, Del, or Esc during boot (varies by manufacturer)
2. Find virtualization settings:
   - Intel: "Intel VT-x" or "Virtualization Technology"
   - AMD: "AMD-V" or "SVM Mode"
3. Enable the setting
4. Save and exit BIOS
5. Boot into Windows

### Issue 3: "WSL 2 Kernel Update Required"

**Solution:**
```powershell
# Update WSL kernel
wsl --update

# Or download manually from:
# https://aka.ms/wsl2kernel
```

### Issue 4: Docker Commands Not Working

**Solution:**
```powershell
# Ensure Docker Desktop is running
Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue

# If not running, start it
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait for Docker to fully start (check system tray for green icon)
Start-Sleep -Seconds 60

# Try Docker command again
docker ps
```

---

## ✅ Verification Checklist

Before running the Medical Claim System, verify:

- [ ] WSL 2 is installed: `wsl --status`
- [ ] Ubuntu distribution is installed: `wsl --list`
- [ ] Docker Desktop is running (green icon in system tray)
- [ ] Docker service is running: `Get-Service -Name "com.docker.service"`
- [ ] Docker commands work: `docker --version`
- [ ] Test container runs: `docker run hello-world`

---

## 🚀 Start Medical Claim System

Once Docker is working, start the system:

```powershell
# Navigate to project directory
cd c:\Users\04248D744\Desktop\Kolkata_Demo\Kolkata_Bob_A_THON\medical-claim-system

# Start all services
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Health Check: http://localhost:5000/health
```

---

## 📊 System Requirements Check

Run this PowerShell script to check your system:

```powershell
# Check Windows version
$os = Get-WmiObject -Class Win32_OperatingSystem
Write-Host "Windows Version: $($os.Caption) Build $($os.BuildNumber)"

# Check RAM
$ram = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
Write-Host "Total RAM: $ram GB"

# Check if virtualization is enabled
$virt = (Get-WmiObject -Class Win32_Processor).VirtualizationFirmwareEnabled
Write-Host "Virtualization Enabled: $virt"

# Check WSL
try {
    $wslStatus = wsl --status 2>&1
    Write-Host "WSL Status: Installed"
} catch {
    Write-Host "WSL Status: Not Installed"
}

# Check Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "Docker: $dockerVersion"
} catch {
    Write-Host "Docker: Not Installed or Not Running"
}
```

---

## 🆘 Quick Reference Commands

### WSL Commands
```powershell
wsl --install              # Install WSL with Ubuntu
wsl --status               # Check WSL status
wsl --list --verbose       # List distributions
wsl --shutdown             # Shutdown WSL
wsl --update               # Update WSL kernel
wsl --set-default-version 2 # Set WSL 2 as default
```

### Docker Desktop Commands
```powershell
# Start Docker service
Start-Service -Name "com.docker.service"

# Stop Docker service
Stop-Service -Name "com.docker.service"

# Check Docker service status
Get-Service -Name "com.docker.service"

# Launch Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Docker Commands
```powershell
docker --version           # Check Docker version
docker ps                  # List running containers
docker ps -a               # List all containers
docker images              # List images
docker run hello-world     # Test Docker
docker system prune -a     # Clean up Docker
```

---

## 📞 Need More Help?

### Resources
- **WSL Documentation**: https://docs.microsoft.com/en-us/windows/wsl/
- **Docker Desktop Docs**: https://docs.docker.com/desktop/windows/
- **Docker Troubleshooting**: https://docs.docker.com/desktop/troubleshoot/overview/

### Common Error Messages
1. **"WSL 2 installation is incomplete"** → Run `wsl --update`
2. **"Docker daemon is not running"** → Start Docker Desktop
3. **"Hardware virtualization is not enabled"** → Enable in BIOS
4. **"Access denied"** → Run PowerShell as Administrator

---

## 🎯 Summary of Steps to Fix Your Issue

1. **Install WSL 2** (REQUIRED - This is your main issue)
   ```powershell
   wsl --install
   ```

2. **Restart Computer** (REQUIRED)
   ```powershell
   Restart-Computer
   ```

3. **Complete Ubuntu Setup** (After restart)
   - Set username and password

4. **Start Docker Desktop**
   - Launch from Start menu or desktop icon

5. **Verify Everything Works**
   ```powershell
   wsl --status
   docker --version
   docker run hello-world
   ```

6. **Start Medical Claim System**
   ```powershell
   cd medical-claim-system
   docker-compose up -d
   ```

---

**🎉 Once WSL 2 is installed and Docker Desktop is running, your Medical Claim System will work perfectly!**

For any issues, refer to the troubleshooting sections above or check the logs:
```powershell
# Docker Desktop logs location
Get-Content "$env:LOCALAPPDATA\Docker\log.txt" -Tail 50