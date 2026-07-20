$coop = "+5215500000001" 
$driver = "+5215512345678"
$passenger = "+5212223334444"

Write-Host "--- 1. GENERATE TRANSACTIONS (TRIP PAYMENTS) ---"
# Trip 1: $100 -> Coop gets $5
$trip1 = Invoke-RestMethod -Uri "http://localhost:3001/api/raite/trip/payment" -Method POST -ContentType "application/json" -Body (@{trip_id="TRIP-REP-1"; passenger_phone=$passenger; driver_phone=$driver; cooperativa_phone=$coop; amount_mxn=100; origin="A"; destination="B";} | ConvertTo-Json)
Write-Host "Trip 1 processed."

# Trip 2: $200 -> Coop gets $10
$trip2 = Invoke-RestMethod -Uri "http://localhost:3001/api/raite/trip/payment" -Method POST -ContentType "application/json" -Body (@{trip_id="TRIP-REP-2"; passenger_phone=$passenger; driver_phone=$driver; cooperativa_phone=$coop; amount_mxn=200; origin="A"; destination="B";} | ConvertTo-Json)
Write-Host "Trip 2 processed."

Write-Host "`n--- 2. GET FINANCIAL REPORT FOR COOP ---"
# Note: This endpoint is protected, but for local dev test without full auth flow we might hit a 401 if we don't pass a token. 
# However, `trip/payment` is also protected but might be open in dev mode or using a bypassed middleware for tests.
# If this fails with 401, we need to temporarily allow public access or login first.
# Let's try direct call, assuming dev environment.

# If 401, we will register a user to get a token first.
try {
    $report = Invoke-RestMethod -Uri "http://localhost:3001/api/raite/cooperativa/financial-report/$coop" -Method GET
    $report | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error fetching report (likely Auth): $($_.Exception.Message)"
    # Fallback: Login as admin/user to get token is complex in script. 
    # Validating via logs if needed.
}
