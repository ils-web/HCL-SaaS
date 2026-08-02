"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { toast, Toaster } from "react-hot-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("נא להזין אימייל וסיסמה")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Store tenantId for frontend routing/SWR
        if (data.tenantId && data.tenantId !== 'all') {
          localStorage.setItem("hcl_tenantId", data.tenantId)
        }
        
        toast.success("התחברת בהצלחה!")
        
        // Wait a bit for the cookie to settle and toast to show
        setTimeout(() => {
          router.push('/admin-react')
        }, 1000)
      } else {
        toast.error(data.error || "שגיאה בהתחברות")
      }
    } catch (err) {
      toast.error("שגיאת רשת, נסה שוב")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#858d9c] flex items-center justify-center p-4" dir="rtl">
      <Toaster position="top-center" />
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full text-center relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-blue-50 opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-pink-50 opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg transform rotate-3">
            <i className="fas fa-shield-alt -rotate-3"></i>
          </div>
          
          <h2 className="text-3xl font-black text-gray-800 mb-2">כניסת מנהלים</h2>
          <p className="text-gray-500 mb-8 font-medium">ברוכים השבים! נא להזין פרטי התחברות.</p>
          
          <form onSubmit={handleLogin} className="space-y-5 text-right">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">אימייל או שם משתמש</label>
              <Input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 font-mono text-left focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white" 
                placeholder="admin@example.com" 
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">סיסמה</label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 font-mono text-left focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white" 
                placeholder="••••••••" 
                dir="ltr"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-md hover:shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin text-xl"></i>
              ) : (
                "התחבר למערכת"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
