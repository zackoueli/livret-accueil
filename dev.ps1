$stripe = "C:\Users\Enzooo\AppData\Local\Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe\stripe.exe"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$stripe' listen --forward-to localhost:3000/api/stripe/webhook"

npm run dev
