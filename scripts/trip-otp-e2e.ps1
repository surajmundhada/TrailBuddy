# End-to-end: traveler reads OTP + that booking's guide completes pickup + verify OTP.
# Base URL: http://localhost:8080/api (override with $env:API_BASE_URL).
# Traveler: traveler@trailbuddy.com / Traveler123!
# Seeded guides use password: Guide123!

$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { 'http://localhost:8080/api' }

function SignIn($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/signin" -Method Post -ContentType 'application/json' -Body $body
  return $r.token
}

Write-Host "Signing in traveler..."
$tToken = SignIn 'traveler@trailbuddy.com' 'Traveler123!'
$tHeaders = @{ Authorization = "Bearer $tToken" }

Write-Host "Fetching traveler bookings..."
$tPage = Invoke-RestMethod -Uri ('{0}/bookings/user?page=0&size=50' -f $base) -Headers $tHeaders -Method Get
$tList = @($tPage.content)
if ($tList.Count -eq 0) { throw "No bookings for traveler." }

# Prefer CONFIRMED with Delhi demo host (stable for local seed); else any CONFIRMED.
$booking = $tList | Where-Object {
  $_.status -eq 'CONFIRMED' -and $null -ne $_.guide -and $null -ne $_.guide.user -and $_.guide.user.email -eq 'guide@trailbuddy.com'
} | Select-Object -First 1
if (-not $booking) {
  $booking = $tList | Where-Object { $_.status -eq 'CONFIRMED' } | Select-Object -First 1
}
if (-not $booking) {
  Write-Host "No CONFIRMED booking - mock-paying first suitable PENDING booking..."
  $pend = $tList | Where-Object {
    $_.status -eq 'PENDING' -and $null -ne $_.guide -and $null -ne $_.guide.user -and $_.guide.user.email -eq 'guide@trailbuddy.com'
  } | Select-Object -First 1
  if (-not $pend) {
    $pend = $tList | Where-Object { $_.status -eq 'PENDING' } | Select-Object -First 1
  }
  if (-not $pend) { throw "No PENDING or CONFIRMED booking for traveler to exercise OTP flow." }
  $mockId = $pend.id
  Invoke-RestMethod -Uri "$base/payments/mock-confirm/$mockId" -Headers $tHeaders -Method Post -ContentType 'application/json' -Body '{}' | Out-Null
  $tPage = Invoke-RestMethod -Uri ('{0}/bookings/user?page=0&size=50' -f $base) -Headers $tHeaders -Method Get
  $tList = @($tPage.content)
  $booking = $tList | Where-Object { $_.id -eq $mockId } | Select-Object -First 1
  if (-not $booking -or $booking.status -ne 'CONFIRMED') {
    throw "Mock confirm did not leave booking $mockId as CONFIRMED (got $($booking.status))."
  }
}

$bid = $booking.id
$guideEmail = $booking.guide.user.email
Write-Host "Using bookingId=$bid guide=$guideEmail"

Write-Host "GET trip session (traveler OTP)..."
$ts = Invoke-RestMethod -Uri "$base/trip-sessions/by-booking/$bid" -Headers $tHeaders -Method Get
Write-Host "tripStatus=$($ts.tripStatus) otp=$($ts.otp)"
if (-not $ts.otp) { throw "No OTP on trip session (booking must be CONFIRMED and session provisioned)." }

$otp = [string]$ts.otp

Write-Host "Signing in guide $guideEmail (password Guide123!)..."
$gToken = SignIn $guideEmail 'Guide123!'
$gHeaders = @{ Authorization = "Bearer $gToken" }

Write-Host "POST start-journey..."
Invoke-RestMethod -Uri "$base/trip-sessions/by-booking/$bid/guide/start-journey" -Headers $gHeaders -Method Post -ContentType 'application/json' -Body '{}' | Out-Null

Write-Host "POST arrived..."
Invoke-RestMethod -Uri "$base/trip-sessions/by-booking/$bid/guide/arrived" -Headers $gHeaders -Method Post -ContentType 'application/json' -Body '{}' | Out-Null

Write-Host "POST verify-otp..."
$verifyBody = @{ otp = $otp } | ConvertTo-Json
$after = Invoke-RestMethod -Uri "$base/trip-sessions/by-booking/$bid/guide/verify-otp" -Headers $gHeaders -Method Post -ContentType 'application/json' -Body $verifyBody
Write-Host "tripStatus=$($after.tripStatus)"

if ($after.tripStatus -ne 'TRIP_ONGOING') {
  throw "Expected TRIP_ONGOING after OTP verify, got $($after.tripStatus)"
}

Write-Host "E2E trip OTP flow completed successfully."
