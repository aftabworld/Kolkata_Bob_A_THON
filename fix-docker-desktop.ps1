# Docker Desktop Fix Script for Windows
# This script installs WSL 2 and prepares your system for Docker Desktop

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Desktop Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click on PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Navigate to this directory and run the script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Function to check system requirements
function Test-SystemRequirements {
    Write-Host "Checking system requirements..." -ForegroundColor Cyan
    
    # Check Windows version
    $os = Get-WmiObject -Class Win32_OperatingSystem
    $build = [int]$os.BuildNumber
    
    Write-Host "  Windows Version: $($os.Caption) Build $build" -ForegroundColor White
    
    if ($build -lt 19041) {
        Write-Host "  ✗ Windows build must be 19041 or higher" -ForegroundColor Red
        return $false
    } else {
        Write-Host "  ✓ Windows version is compatible" -ForegroundColor Green
    }
    
    # Check RAM
    $ram = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    Write-Host "  Total RAM: $ram GB" -ForegroundColor White
    
    if ($ram -lt 4) {
        Write-Host "  ⚠ Warning: At least 4GB RAM recommended" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ Sufficient RAM available" -ForegroundColor Green
    }
    
    # Check virtualization
    $virt = (Get-WmiObject -Class Win32_Processor).VirtualizationFirmwareEnabled
    Write-Host "  Virtualization: $virt" -ForegroundColor White
    
    if (-not $virt) {
        Write-Host "  ✗ Hardware virtualization is not enabled" -ForegroundColor Red
        Write-Host "  Please enable it in BIOS/UEFI settings" -ForegroundColor Yellow
        return $false
    } else {
        Write-Host "  ✓ Virtualization is enabled" -ForegroundColor Green
    }
    
    Write-Host ""
    return $true
}

# Function to check WSL status
function Test-WSLInstalled {
    try {
        $wslStatus = wsl --status 2>&1
        return $true
    } catch {
        return $false
    }
}

# Function to install WSL
function Install-WSL {
    Write-Host "Installing WSL 2..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Write-Host "Running: wsl --install" -ForegroundColor Yellow
        wsl --install
        
        Write-Host ""
        Write-Host "✓ WSL installation initiated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: You MUST restart your computer now!" -ForegroundColor Yellow -BackgroundColor Red
        Write-Host ""
        Write-Host "After restart:" -ForegroundColor Cyan
        Write-Host "1. Ubuntu will launch automatically" -ForegroundColor White
        Write-Host "2. Create a username (lowercase, no spaces)" -ForegroundColor White
        Write-Host "3. Create a password" -ForegroundColor White
        Write-Host "4. Wait for setup to complete" -ForegroundColor White
        Write-Host "5. Start Docker Desktop" -ForegroundColor White
        Write-Host ""
        
        $restart = Read-Host "Do you want to restart now? (Y/N)"
        if ($restart -eq "Y" -or $restart -eq "y") {
            Write-Host "Restarting computer in 10 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            Restart-Computer -Force
        } else {
            Write-Host "Please restart your computer manually to complete WSL installation." -ForegroundColor Yellow
        }
        
        return $true
    } catch {
        Write-Host "✗ Error installing WSL: $_" -ForegroundColor Red
        return $false
    }
}

# Function to verify Docker Desktop
function Test-DockerDesktop {
    Write-Host "Checking Docker Desktop..." -ForegroundColor Cyan
    
    # Check if Docker Desktop is installed
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dockerPath)) {
        Write-Host "  ✗ Docker Desktop is not installed" -ForegroundColor Red
        Write-Host "  Please download and install from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        return $false
    } else {
        Write-Host "  ✓ Docker Desktop is installed" -ForegroundColor Green
    }
    
    # Check Docker service
    try {
        $service = Get-Service -Name "com.docker.service" -ErrorAction Stop
        Write-Host "  Docker Service Status: $($service.Status)" -ForegroundColor White
        
        if ($service.Status -ne "Running") {
            Write-Host "  ⚠ Docker service is not running" -ForegroundColor Yellow
            Write-Host "  Starting Docker Desktop..." -ForegroundColor Cyan
            Start-Process $dockerPath
            Write-Host "  Please wait 1-2 minutes for Docker to start" -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ Docker service is running" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠ Docker service not found" -ForegroundColor Yellow
        Write-Host "  Please start Docker Desktop manually" -ForegroundColor Yellow
    }
    
    Write-Host ""
    return $true
}

# Main execution
Write-Host "Starting Docker Desktop troubleshooting..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check system requirements
if (-not (Test-SystemRequirements)) {
    Write-Host ""
    Write-Host "System requirements not met. Please fix the issues above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Check WSL installation
Write-Host "Checking WSL installation..." -ForegroundColor Cyan
$wslInstalled = Test-WSLInstalled

if ($wslInstalled) {
    Write-Host "  ✓ WSL is already installed" -ForegroundColor Green
    Write-Host ""
    
    # Show WSL status
    Write-Host "WSL Status:" -ForegroundColor Cyan
    wsl --status
    Write-Host ""
    
    Write-Host "WSL Distributions:" -ForegroundColor Cyan
    wsl --list --verbose
    Write-Host ""
    
} else {
    Write-Host "  ✗ WSL is not installed" -ForegroundColor Red
    Write-Host ""
    
    $install = Read-Host "Do you want to install WSL 2 now? (Y/N)"
    if ($install -eq "Y" -or $install -eq "y") {
        if (-not (Install-WSL)) {
            Write-Host ""
            Write-Host "WSL installation failed. Please install manually:" -ForegroundColor Red
            Write-Host "1. Open PowerShell as Administrator" -ForegroundColor Yellow
            Write-Host "2. Run: wsl --install" -ForegroundColor Yellow
            Write-Host "3. Restart your computer" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
        exit 0
    } else {
        Write-Host ""
        Write-Host "WSL installation is required for Docker Desktop." -ForegroundColor Yellow
        Write-Host "Please install it manually using: wsl --install" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Step 3: Check Docker Desktop
Test-DockerDesktop

# Step 4: Final verification
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Final Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "  ✓ Docker Version: $dockerVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Running test container..." -ForegroundColor Cyan
    docker run --rm hello-world
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Docker is working correctly!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the Medical Claim System:" -ForegroundColor Cyan
    Write-Host "  cd medical-claim-system" -ForegroundColor White
    Write-Host "  docker-compose up -d" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "  ✗ Docker is not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure Docker Desktop is running (check system tray)" -ForegroundColor White
    Write-Host "2. Wait 1-2 minutes for Docker to fully start" -ForegroundColor White
    Write-Host "3. Try running this script again" -ForegroundColor White
    Write-Host "4. If still failing, restart Docker Desktop" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed troubleshooting, see:" -ForegroundColor Cyan
    Write-Host "  docs/DOCKER_DESKTOP_TROUBLESHOOTING.md" -ForegroundColor White
    Write-Host ""
}

Read-Host "Press Enter to exit"

# Made with Bob
