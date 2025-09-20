'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthError, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase/client'
import { AuthUser, SignUpData, SignInData } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (data: SignUpData) => Promise<{ error: AuthError | null }>
  signIn: (data: SignInData) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true);
  }, []);

  // username 用のサニタイズとランダム生成
  const sanitizeBaseName = (name: string) => {
    const lowered = (name || '').toLowerCase()
    // 英数字とアンダースコア以外を置換
    const sanitized = lowered.replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '')
    // 長さ制限（3〜24）
    const base = sanitized.slice(0, 24)
    return base.length >= 3 ? base : (base + 'user').slice(0, 8)
  }

  const randomSuffix = (len = 5) => {
    const bytes = new Uint8Array(len)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len)
  }

  const proposeUsernames = (base: string, attempts = 6) => {
    const list: string[] = []
    const sBase = sanitizeBaseName(base) || 'user'
    list.push(sBase)
    for (let i = 0; i < attempts - 1; i++) {
      list.push(`${sBase}_${randomSuffix(4)}`)
    }
    return list
  }

  // サインイン直後・初期化時に usels を用意し、username が空なら補完
  const ensureProfileWithRandomUsername = async (u: AuthUser) => {
    try {
      // 既存行を取得
      const { data: existing, error: selectErr } = await supabase
        .from('usels')
        .select('user_id, username, setID')
        .eq('user_id', u.id)
        .maybeSingle()

      if (selectErr) {
        // 取得エラーはログに残すのみ（認証フローは止めない）
        console.error('ensureProfile: select error', selectErr)
      }

      // すでに username があるなら何もしない
      if (existing && existing.username) return

      // 候補生成
      const metaName = u.user_metadata?.username || u.user_metadata?.displayName || ''
      const emailLocal = (u.email || '').split('@')[0]
      const base = metaName || emailLocal || 'user'
      const candidates = proposeUsernames(base)

      // 重複チェックして一意な username を決定
      let chosen: string | null = null
      for (const c of candidates) {
        const { data: hit, error: checkErr } = await supabase
          .from('usels')
          .select('user_id')
          .eq('username', c)
          .limit(1)
        if (checkErr) {
          console.warn('ensureProfile: uniqueness check error', checkErr)
          continue
        }
        if (!hit || hit.length === 0 || (hit.length === 1 && hit[0].user_id === u.id)) {
          chosen = c
          break
        }
      }
      if (!chosen) {
        chosen = `user_${randomSuffix(6)}`
      }

      // 既存行があるかで update/upsert を分岐
      if (existing) {
        const updatePayload: any = {
          username: chosen,
        }
  if (!existing.setID) updatePayload.setID = chosen

        const { error: updErr } = await supabase
          .from('usels')
          .update(updatePayload)
          .eq('user_id', u.id)

        if (updErr) console.error('ensureProfile: update error', updErr)
        return
      }

      // 行が無ければ作成（user_id 一意想定）。onConflict は user_id を想定
      const insertPayload: any = {
        user_id: u.id,
        username: chosen,
        setID: chosen,
      }
      const { error: insErr } = await supabase
        .from('usels')
        .upsert(insertPayload, { onConflict: 'user_id' })

      if (insErr) console.error('ensureProfile: upsert error', insErr)
    } catch (e) {
      console.error('ensureProfile: unexpected error', e)
    }
  }

  useEffect(() => {
    if (!isClient) return;

    // 初期認証状態を取得
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('[AuthDebug] Session error:', error);
          // エラーが発生しても認証フローを続行
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AuthDebug] initial session', session?.user?.id, 'provider:', session?.user?.app_metadata?.provider)
        }
        
        setUser(session?.user as AuthUser || null)
        if (session?.user) {
          ensureProfileWithRandomUsername(session.user as AuthUser)
        }
      } catch (error) {
        console.error('[AuthDebug] Unexpected error in getInitialSession:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        try {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[AuthDebug] onAuthStateChange', event, 'user:', session?.user?.id, 'provider:', session?.user?.app_metadata?.provider)
          }
          setUser(session?.user as AuthUser || null)
          if (event === 'SIGNED_IN' && session?.user) {
            ensureProfileWithRandomUsername(session.user as AuthUser)
          }
          if (event === 'SIGNED_OUT') {
            // 念のためユーザーを明示的に null
            setUser(null)
          }
        } catch (error) {
          console.error('[AuthDebug] Error in onAuthStateChange:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isClient])

  const signUp = async (data: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          displayName: data.displayName,
        }
      }
    })
    return { error }
  }

  const signIn = async (data: SignInData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}