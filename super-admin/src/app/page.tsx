import { Building2, Users, Activity, FileText, Settings, LogOut, ChevronRight, Bell } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans selection:bg-purple-500/30">
      
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 glass-panel border-r border-white/5 p-6 flex flex-col z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Building2 className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            HCL SuperAdmin
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/5 transition-all">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <Building2 className="w-5 h-5" />
            <span>Tenants (Clients)</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <Users className="w-5 h-5" />
            <span>Global Users</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <FileText className="w-5 h-5" />
            <span>Billing & Invoices</span>
          </a>
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 lg:p-12 max-w-7xl">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Overview</h2>
            <p className="text-slate-400 mt-1">Welcome back, Super Admin.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-6 h-6 text-slate-400 hover:text-white" />
              <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0b0f19]"></span>
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border-2 border-slate-800 shadow-inner"></div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
              <Building2 className="w-16 h-16 text-purple-400" />
            </div>
            <p className="text-slate-400 font-medium mb-1">Active Tenants</p>
            <h3 className="text-4xl font-bold text-white mb-4">24</h3>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span className="bg-emerald-400/10 px-2 py-0.5 rounded-md">+3 this month</span>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
              <Activity className="w-16 h-16 text-blue-400" />
            </div>
            <p className="text-slate-400 font-medium mb-1">Total Tasks Processed</p>
            <h3 className="text-4xl font-bold text-white mb-4">12,845</h3>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span className="bg-emerald-400/10 px-2 py-0.5 rounded-md">+15% vs last week</span>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
              <FileText className="w-16 h-16 text-amber-400" />
            </div>
            <p className="text-slate-400 font-medium mb-1">Monthly MRR</p>
            <h3 className="text-4xl font-bold text-white mb-4">$4,200</h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <span>Next billing: Jun 1</span>
            </div>
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="glass-panel rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Recent Clients</h3>
            <button className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-white/5 text-sm uppercase tracking-wider">
                  <th className="pb-4 font-medium">Company Name</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Users</th>
                  <th className="pb-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: "Hospital Alpha", status: "Active", users: 142, color: "emerald" },
                  { name: "Clinic Beta", status: "Onboarding", users: 12, color: "amber" },
                  { name: "MedCenter Gamma", status: "Active", users: 89, color: "emerald" },
                  { name: "Dental Delta", status: "Inactive", users: 0, color: "slate" },
                ].map((tenant, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5">
                        {tenant.name.charAt(0)}
                      </div>
                      {tenant.name}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${tenant.color}-500/10 text-${tenant.color}-400 border border-${tenant.color}-500/20`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{tenant.users} accounts</td>
                    <td className="py-4 text-right">
                      <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 font-medium text-white transition-colors border border-white/5">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
