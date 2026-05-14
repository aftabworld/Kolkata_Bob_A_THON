# 🐳 Docker Desktop Installation Guide for Windows

## 📋 Prerequisites

Before installing Docker Desktop, ensure your system meets these requirements:

### System Requirements
- ✅ Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- ✅ Windows 11 64-bit: Pro, Enterprise, or Education
- ✅ Hardware virtualization enabled in BIOS
- ✅ At least 4GB RAM (8GB recommended)
- ✅ WSL 2 feature enabled

### Check Your Windows Version
1. Press `Win + R`
2. Type `winver` and press Enter
3. Verify you have Build 19041 or higher

---

## 🚀 Installation Steps

### Step 1: Enable WSL 2 (Windows Subsystem for Linux)

Open PowerShell as Administrator and run:

```powershell
# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart your computer
Restart-Computer
```

After restart, open PowerShell as Administrator again:

```powershell
# Set WSL 2 as default
wsl --set-default-version 2

# Install Ubuntu (optional but recommended)
wsl --install -d Ubuntu
```

### Step 2: Download Docker Desktop

**Option 1: Direct Download**
- Visit: https://www.docker.com/products/docker-desktop/
- Click "Download for Windows"
- File: Docker Desktop Installer.exe (~500MB)

**Option 2: Using PowerShell**
```powershell
# Download Docker Desktop installer
Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile "$env:USERPROFILE\Downloads\DockerDesktopInstaller.exe"
```

### Step 3: Install Docker Desktop

1. **Run the Installer**
   - Double-click `Docker Desktop Installer.exe`
   - If prompted by UAC, click "Yes"

2. **Configuration Options**
   - ✅ Check "Use WSL 2 instead of Hyper-V" (recommended)
   - ✅ Check "Add shortcut to desktop"
   - Click "Ok"

3. **Wait for Installation**
   - Installation takes 5-10 minutes
   - Do not close the installer window

4. **Restart Computer**
   - Click "Close and restart" when prompted
   - Your computer will restart

### Step 4: Start Docker Desktop

1. **Launch Docker Desktop**
   - Find Docker Desktop icon on desktop or Start menu
   - Double-click to launch

2. **Accept Terms**
   - Read and accept the Docker Subscription Service Agreement
   - Click "Accept"

3. **Skip Tutorial** (optional)
   - You can skip the tutorial or complete it
   - Click "Skip tutorial" if you want to start immediately

4. **Wait for Docker to Start**
   - Docker engine will start (takes 1-2 minutes)
   - You'll see "Docker Desktop is running" in system tray

---

## ✅ Verify Installation

### Check Docker Version

Open PowerShell or Command Prompt and run:

```powershell
# Check Docker version
docker --version
# Expected output: Docker version 24.x.x, build xxxxx

# Check Docker Compose version
docker-compose --version
# Expected output: Docker Compose version v2.x.x

# Verify Docker is running
docker ps
# Expected output: Empty list (no containers running yet)
```

### Run Test Container

```powershell
# Run hello-world container
docker run hello-world

# Expected output:
# Hello from Docker!
# This message shows that your installation appears to be working correctly.
```

---

## 🔧 Troubleshooting

### Issue 1: "WSL 2 installation is incomplete"

**Solution:**
```powershell
# Download and install WSL 2 kernel update
# Visit: https://aka.ms/wsl2kernel
# Or run:
wsl --update
```

### Issue 2: "Hardware assisted virtualization is not enabled"

**Solution:**
1. Restart computer and enter BIOS (usually F2, F10, or Del key)
2. Find "Virtualization Technology" or "Intel VT-x" or "AMD-V"
3. Enable it
4. Save and exit BIOS

### Issue 3: Docker Desktop won't start

**Solution:**
```powershell
# Reset Docker Desktop
# 1. Close Docker Desktop
# 2. Open PowerShell as Administrator
# 3. Run:
wsl --shutdown
# 4. Start Docker Desktop again
```

### Issue 4: "Docker daemon is not running"

**Solution:**
1. Open Docker Desktop application
2. Wait for it to fully start (green icon in system tray)
3. Try your command again

### Issue 5: Slow Performance

**Solution:**
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Resources → Advanced
4. Increase CPUs to 4 and Memory to 8GB
5. Click "Apply & Restart"

---

## ⚙️ Configure Docker Desktop

### Recommended Settings

1. **Open Docker Desktop Settings**
   - Click Docker icon in system tray
   - Click "Settings" (gear icon)

2. **General Settings**
   - ✅ Start Docker Desktop when you log in
   - ✅ Use WSL 2 based engine
   - ✅ Send usage statistics (optional)

3. **Resources**
   - **CPUs**: 4 (or half of your total)
   - **Memory**: 8 GB (or half of your total RAM)
   - **Swap**: 2 GB
   - **Disk image size**: 60 GB

4. **Docker Engine**
   - Keep default settings unless you know what you're doing

5. **Apply Changes**
   - Click "Apply & Restart"

---

## 🚀 Test with Medical Claim System

Now that Docker is installed, test it with our project:

### Navigate to Project
```powershell
cd C:\Users\04248D744\Desktop\Kolkata_Demo\Kolkata_Bob_A_THON\medical-claim-system
```

### Start the System
```powershell
# Start all services
docker-compose up -d

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f
```

### Expected Output
```
Creating network "medical-claim-system_medical-claim-network" ... done
Creating medical-claim-db ... done
Creating medical-claim-redis ... done
Creating medical-claim-backend ... done
Creating medical-claim-frontend ... done
Creating medical-claim-nginx ... done
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Stop the System
```powershell
docker-compose down
```

---

## 📚 Useful Docker Commands

### Container Management
```powershell
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop <container_name>

# Start a container
docker start <container_name>

# Remove a container
docker rm <container_name>

# View container logs
docker logs <container_name>

# Execute command in container
docker exec -it <container_name> bash
```

### Image Management
```powershell
# List images
docker images

# Remove an image
docker rmi <image_name>

# Pull an image
docker pull <image_name>

# Build an image
docker build -t <image_name> .
```

### Docker Compose Commands
```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose build

# Restart services
docker-compose restart

# Remove all containers and volumes
docker-compose down -v
```

### System Cleanup
```powershell
# Remove unused containers, networks, images
docker system prune

# Remove everything (including volumes)
docker system prune -a --volumes

# View disk usage
docker system df
```

---

## 🎓 Learning Resources

### Official Documentation
- Docker Desktop: https://docs.docker.com/desktop/
- Docker CLI: https://docs.docker.com/engine/reference/commandline/cli/
- Docker Compose: https://docs.docker.com/compose/

### Tutorials
- Docker Getting Started: https://docs.docker.com/get-started/
- Docker for Beginners: https://docker-curriculum.com/

### Video Tutorials
- Docker in 100 Seconds: https://www.youtube.com/watch?v=Gjnup-PuquQ
- Docker Tutorial for Beginners: https://www.youtube.com/watch?v=fqMOX6JJhGo

---

## 🆘 Getting Help

### Docker Desktop Support
- Documentation: https://docs.docker.com/desktop/troubleshoot/overview/
- Community Forums: https://forums.docker.com/
- GitHub Issues: https://github.com/docker/for-win/issues

### Medical Claim System Support
- Check README.md in project root
- Review QUICKSTART.md for setup issues
- Check docker-compose logs for errors

---

## ✅ Installation Checklist

Before proceeding, verify:

- [ ] Windows 10/11 Pro, Enterprise, or Education
- [ ] WSL 2 installed and enabled
- [ ] Docker Desktop downloaded
- [ ] Docker Desktop installed
- [ ] Computer restarted
- [ ] Docker Desktop running (green icon in tray)
- [ ] `docker --version` works
- [ ] `docker run hello-world` works
- [ ] Can access Docker Desktop settings
- [ ] Medical Claim System starts with `docker-compose up`

---

## 🎉 Next Steps

Once Docker is installed and verified:

1. **Start the Medical Claim System**
   ```powershell
   cd medical-claim-system
   docker-compose up -d
   ```

2. **Access the Application**
   - Open browser: http://localhost:3000

3. **Follow the Quick Start Guide**
   - See QUICKSTART.md for detailed usage

4. **Explore the System**
   - Create users
   - Submit claims
   - Test workflows

---

**🐳 Happy Dockerizing!**

For any issues, refer to the troubleshooting section or check Docker Desktop logs.