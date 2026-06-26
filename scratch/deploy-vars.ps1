$envs = @("production", "preview", "development")

# DATABASE_URL
foreach ($env in $envs) {
    Write-Output "postgresql://postgres.veqizdwuhcusptesliig:maulyaaa18.@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true" | vercel env add DATABASE_URL $env
}

# DIRECT_URL
foreach ($env in $envs) {
    Write-Output "postgresql://postgres.veqizdwuhcusptesliig:maulyaaa18.@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres" | vercel env add DIRECT_URL $env
}

# GOOGLE_MAPS_API_KEY
foreach ($env in $envs) {
    Write-Output "AIzaSyBqP6zk32XVi8ciWF1aA7qNj1fJMTG-BQI" | vercel env add GOOGLE_MAPS_API_KEY $env
}

# FIRECRAWL_API_KEY
foreach ($env in $envs) {
    Write-Output "fc-35e53dcfd4ef4b6d83a4a2821a4c4af2" | vercel env add FIRECRAWL_API_KEY $env
}
