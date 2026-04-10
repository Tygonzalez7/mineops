import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signUp({ email, password, name, mineId, role, machineId }) {
  // 1. Create the Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, mine_id: mineId, role } },
  })
  if (authError) throw authError

  // 2. Insert operator record linked to mine
  const { error: opError } = await supabase.from('operators').insert({
    auth_id: authData.user.id,
    mine_id: mineId,
    name,
    role,
    machine_id: machineId || null,
    status: 'pending', // admin must approve
  })
  if (opError) throw opError

  return authData
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

// ── Mine helpers ──────────────────────────────────────────────────────────────

export async function createMine({ name, location, crusherCount, adminName, email }) {
  // Calls a Supabase Edge Function or backend route that:
  // 1. Creates the mine record with auto-generated code
  // 2. Creates the admin operator record
  // 3. Returns the mine code
  const response = await fetch('/api/mines/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, location, crusherCount, adminName, email }),
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

export async function findMineByCode(code) {
  const { data, error } = await supabase
    .from('mines')
    .select('id, name, location, code, plan')
    .eq('code', code.toUpperCase())
    .single()
  if (error) throw error
  return data
}

export async function searchMineByName(query) {
  const { data, error } = await supabase
    .from('mines')
    .select('id, name, location, code, plan')
    .ilike('name', `%${query}%`)
    .limit(5)
  if (error) throw error
  return data
}

// ── Operator helpers ──────────────────────────────────────────────────────────

export async function getMyOperatorProfile() {
  const session = await getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('operators')
    .select('*, mines(id, name, code, plan)')
    .eq('auth_id', session.user.id)
    .single()
  if (error) throw error
  return data
}

export async function getPendingOperators() {
  const { data, error } = await supabase
    .from('operators')
    .select('id, name, role, machine_id, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function approveOperator(operatorId) {
  const { error } = await supabase.rpc('approve_operator', { operator_uuid: operatorId })
  if (error) throw error
}

// ── Shift helpers ─────────────────────────────────────────────────────────────

export async function startShift({ operatorId, mineId, machineIds, truckDriven }) {
  const { data, error } = await supabase
    .from('shifts')
    .insert({
      operator_id: operatorId,
      mine_id: mineId,
      machine_ids: machineIds,
      truck_driven: truckDriven,
      shift_start: new Date().toISOString(),
      status: 'active',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endShift(shiftId) {
  const { error } = await supabase
    .from('shifts')
    .update({ shift_end: new Date().toISOString(), status: 'complete' })
    .eq('id', shiftId)
  if (error) throw error
}

// ── Scoop log helpers ─────────────────────────────────────────────────────────

export async function logScoop({ shiftId, mineId, machineId, size, fillPct, tonnes, cycleTimeMin }) {
  const { error } = await supabase.from('scoop_logs').insert({
    shift_id: shiftId,
    mine_id: mineId,
    machine_id: machineId,
    size,
    fill_pct: fillPct,
    tonnes,
    cycle_time_min: cycleTimeMin,
  })
  if (error) throw error
}

export async function getShiftScoops(shiftId) {
  const { data, error } = await supabase
    .from('scoop_logs')
    .select('*')
    .eq('shift_id', shiftId)
    .order('logged_at', { ascending: true })
  if (error) throw error
  return data
}

// ── VisionLink cache helpers ──────────────────────────────────────────────────

export async function getMachineTelematics(mineId) {
  const { data, error } = await supabase
    .from('visionlink_cache')
    .select('machine_id, payload, fetched_at')
    .eq('mine_id', mineId)
  if (error) throw error
  // Return as { machineId: payload } map
  return Object.fromEntries(data.map(r => [r.machine_id, { ...r.payload, fetchedAt: r.fetched_at }]))
}

// ── Photo storage helpers ─────────────────────────────────────────────────────

export async function uploadCheckPhoto({ mineId, machineType, checkId, file }) {
  const path = `${mineId}/${machineType}/${checkId}.jpg`
  const { error } = await supabase.storage
    .from('check-photos')
    .upload(path, file, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('check-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function getCheckPhotoUrl(mineId, machineType, checkId) {
  const path = `${mineId}/${machineType}/${checkId}.jpg`
  const { data } = supabase.storage.from('check-photos').getPublicUrl(path)
  return data.publicUrl
}
