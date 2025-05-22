import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nzxybgawoktxpmtqzxpu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eHliZ2F3b2t0eHBtdHF6eHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDcwNDIsImV4cCI6MjA2MzUyMzA0Mn0.mCr-goxR6k0v893hM-ADsmIX8o1wSriRGHmLOnjcH3o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


