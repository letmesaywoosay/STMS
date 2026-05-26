# deploy.ps1
# AIDA Project Git Auto-Deploy Script for Windows (PowerShell)
param (
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      AIDA-Tutor Git Auto-Deploy Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

try {
    # 1. Git 설치 여부 확인
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git이 설치되어 있지 않거나 환경 변수에 등록되지 않았습니다."
    }

    # 2. 로컬 변경 사항 감지
    $status = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "✓ 변경된 파일이 없습니다. 즉시 원격 저장소에 Push를 진행합니다..." -ForegroundColor Yellow
    } else {
        Write-Host "[1/3] 변경 사항 감지됨:" -ForegroundColor Green
        Write-Host $status -ForegroundColor Gray

        # 커밋 메시지 설정
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $defaultMsg = "Auto-update at $timestamp"
        
        if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
            # 대화형 모드 여부 확인
            if ([Environment]::UserInteractive -and $Host.Name -eq "ConsoleHost") {
                Write-Host ""
                $CommitMessage = Read-Host "커밋 메시지를 입력하세요 [기본값: '$defaultMsg']"
            }
            if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
                $CommitMessage = $defaultMsg
            }
        }

        # Git add & commit
        Write-Host "[2/3] 변경 사항 로컬 커밋 중..." -ForegroundColor Blue
        git add .
        git commit -m "$CommitMessage"
        Write-Host "✓ 성공적으로 커밋되었습니다." -ForegroundColor Green
    }

    # 3. 현재 Git 브랜치 확인
    $branch = (git branch --show-current).Trim()
    if ([string]::IsNullOrWhiteSpace($branch)) {
        $branch = "main"
    }
    Write-Host "`n[3/3] '$branch' 브랜치로 원격 저장소에 Push 중..." -ForegroundColor Blue

    # Git Push
    git push origin $branch

    Write-Host "`n==================================================" -ForegroundColor Green
    Write-Host " 🎉 배포 자동화 완료!" -ForegroundColor Green
    Write-Host " GitHub 원격 저장소에 푸시 완료되었습니다." -ForegroundColor Green
    Write-Host " Vercel GitHub 연동을 통해 빌드 및 배포가 진행됩니다." -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green

} catch {
    Write-Host "`n==================================================" -ForegroundColor Red
    Write-Host " ❌ 에러 발생!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    exit 1
}
