import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getMyOperatorProfile } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [operator, setOperator] = useState(null) // full operator + mine profile
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // Load existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadOperator()
      else setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) loadOperator()
      else { setOperator(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadOperator() {
    try {
      const profile = await getMyOperatorProfile()
      setOperator(profile)
    } catch (err) {
      console.error('Failed to load operator profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    session,
    operator,         // { id, name, role, machine_id, status, mines: { name, code, plan } }
    loading,
    isActive: operator?.status === 'active',
    isPending: operator?.status === 'pending',
    mineName: operator?.mines?.name,
    mineId: operator?.mine_id,
    refreshOperator: loadOperator,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
