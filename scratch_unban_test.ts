import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function test() {
  console.log('Fetching users...')
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  const bannedUser = users.users.find(u => u.banned_until && new Date(u.banned_until) > new Date())
  if (!bannedUser) {
    console.log('No banned users found.')
    return
  }

  console.log(`Found banned user: ${bannedUser.email} (banned until ${bannedUser.banned_until})`)
  
  console.log('Attempting to unban...')
  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(bannedUser.id, {
    ban_duration: 'none'
  })

  if (updateError) {
    console.error('Error unbanning user:', updateError)
    return
  }

  console.log('Unban result:', updateData.user.banned_until)
}

test()
