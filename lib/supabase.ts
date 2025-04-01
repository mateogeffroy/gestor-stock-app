import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = "https://dixmxwcwkslgugzlbfrp.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeG14d2N3a3NsZ3VnemxiZnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjE4MTQsImV4cCI6MjA1ODY5NzgxNH0.0roa8Hj_bQvkLrP5fMQfPaXlAqNmYQeivhAHBqsqyF8"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

