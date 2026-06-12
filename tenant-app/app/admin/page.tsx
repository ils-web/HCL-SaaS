'use client';

import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Users,
  Plus,
  Printer
} from 'lucide-react';

export default function AdminDashboard() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0b131e] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Top Navbar */}
      <header className="bg-white/5 border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <ClipboardList className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Hospital Alpha</h1>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg font-medium transition-all print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Print Cards
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all print:hidden">
            <QrCode className="w-4 h-4 text-blue-400" />
            Generate QR
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-blue-500 overflow-hidden ml-2 cursor-pointer">
            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-24 h-24 text-red-500" />
            </div>
            <span className="text-slate-400 text-sm font-medium mb-1">New / Urgent</span>
            <span className="text-3xl font-bold text-white">12</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-24 h-24 text-amber-500" />
            </div>
            <span className="text-slate-400 text-sm font-medium mb-1">In Progress</span>
            <span className="text-3xl font-bold text-white">8</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </div>
            <span className="text-slate-400 text-sm font-medium mb-1">Completed Today</span>
            <span className="text-3xl font-bold text-white">24</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-blue-500" />
            </div>
            <span className="text-slate-400 text-sm font-medium mb-1">Active Workers</span>
            <span className="text-3xl font-bold text-white">5</span>
          </div>
        </div>

        {/* Kanban Board */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Task Board</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: New */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  New Tasks
                </h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-md">2</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                {/* Task Card */}
                <div className="bg-[#0b131e] border border-white/10 p-4 rounded-xl shadow-lg hover:border-blue-500/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Urgent</span>
                    <span className="text-xs text-slate-500">10 mins ago</span>
                  </div>
                  <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">Broken AC in Room 302</h4>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">The air conditioner is leaking water and making a loud noise. Patients are complaining about the heat.</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3"/> HVAC</span>
                    <span>Unassigned</span>
                  </div>
                </div>

                <div className="bg-[#0b131e] border border-white/10 p-4 rounded-xl shadow-lg hover:border-blue-500/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Normal</span>
                    <span className="text-xs text-slate-500">2 hours ago</span>
                  </div>
                  <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">Lightbulb replacement</h4>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">Hallway B light is flickering.</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3"/> Electrical</span>
                    <span>Unassigned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  In Progress
                </h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-md">1</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                <div className="bg-[#0b131e] border border-blue-500/30 p-4 rounded-xl shadow-lg hover:border-blue-500/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Normal</span>
                    <span className="text-xs text-slate-500">Working</span>
                  </div>
                  <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">Sink clogged</h4>
                  <p className="text-sm text-slate-400 mb-3">Men's restroom on 2nd floor.</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3"/> Plumbing</span>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <div className="w-4 h-4 rounded-full bg-slate-700 overflow-hidden">
                        <img src="https://i.pravatar.cc/150?img=33" alt="Worker" />
                      </div>
                      Mike
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Completed (Need Review)
                </h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-md">1</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                <div className="bg-[#0b131e] border border-white/10 p-4 rounded-xl shadow-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Done</span>
                    <span className="text-xs text-slate-500">10:30 AM</span>
                  </div>
                  <h4 className="text-white font-medium mb-1 line-through text-slate-400 group-hover:text-blue-400 transition-colors">Fix door handle</h4>
                  <p className="text-sm text-slate-500 mb-3">Main entrance door is loose.</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3 h-3"/> Photo Attached</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Hidden Print Layout (Task Cards) */}
      <div className="hidden print:block p-8 bg-white text-black w-full min-h-screen absolute top-0 left-0 z-50">
        <h2 className="text-2xl font-bold text-center mb-8 border-b pb-4">Maintenance Task Cards</h2>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="border-2 border-slate-800 p-6 rounded-lg relative">
            <div className="absolute top-4 right-4 border-2 border-slate-800 w-8 h-8 rounded-md flex items-center justify-center">
              {/* Checkbox */}
            </div>
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Task ID: #1024</div>
            <h3 className="text-xl font-bold mb-2">Broken AC in Room 302</h3>
            <p className="text-sm mb-4">The air conditioner is leaking water and making a loud noise. Patients are complaining about the heat.</p>
            <div className="flex gap-4 text-sm font-bold mb-6">
              <span className="bg-slate-200 px-2 py-1 rounded">Urgent</span>
              <span className="bg-slate-200 px-2 py-1 rounded">HVAC</span>
            </div>
            
            <div className="border-t border-dashed border-slate-400 pt-4 mt-auto">
              <div className="flex justify-between text-sm mb-2">
                <span>Assigned to: _______________</span>
                <span>Date: _______________</span>
              </div>
              <div className="text-sm">
                Worker Signature: _______________
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-2 border-slate-800 p-6 rounded-lg relative">
            <div className="absolute top-4 right-4 border-2 border-slate-800 w-8 h-8 rounded-md flex items-center justify-center"></div>
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Task ID: #1025</div>
            <h3 className="text-xl font-bold mb-2">Lightbulb replacement</h3>
            <p className="text-sm mb-4">Hallway B light is flickering.</p>
            <div className="flex gap-4 text-sm font-bold mb-6">
              <span className="bg-slate-200 px-2 py-1 rounded">Normal</span>
              <span className="bg-slate-200 px-2 py-1 rounded">Electrical</span>
            </div>
            
            <div className="border-t border-dashed border-slate-400 pt-4 mt-auto">
              <div className="flex justify-between text-sm mb-2">
                <span>Assigned to: _______________</span>
                <span>Date: _______________</span>
              </div>
              <div className="text-sm">
                Worker Signature: _______________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
