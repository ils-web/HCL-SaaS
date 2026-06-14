'use client';

import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Users,
  Plus,
  Printer,
  Settings,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useStore } from '../../store/store';

export default function AdminDashboard() {
  const [activeTeamFilter, setActiveTeamFilter] = useState('ALL');
  const { tasks, fetchTasks, updateTask } = useStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0b131e] print:bg-white text-slate-200 print:text-black font-sans selection:bg-blue-500/30">
      
      {/* Top Navbar */}
      <header className="print:hidden bg-white/5 border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
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
          <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all print:hidden">
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </Link>
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
      <main className="print:hidden p-8 max-w-7xl mx-auto">
        
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
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-white">Task Board</h2>
            
            {/* Team Filters */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTeamFilter('ALL')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTeamFilter === 'ALL' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Все (All)
              </button>
              <button 
                onClick={() => setActiveTeamFilter('PLUMBING')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTeamFilter === 'PLUMBING' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                אינסטלציה (Plumbing)
              </button>
              <button 
                onClick={() => setActiveTeamFilter('ELECTRIC')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTeamFilter === 'ELECTRIC' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                חשמל (Electric)
              </button>
              <button 
                onClick={() => setActiveTeamFilter('CLEANING')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTeamFilter === 'CLEANING' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ניקיון (Cleaning)
              </button>
            </div>
          </div>
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
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                    <button className="flex-1 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 rounded transition-colors">Transfer Team</button>
                    <button className="flex-1 text-[11px] font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-1.5 rounded transition-colors">Assign Worker</button>
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
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                    <button className="flex-1 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 rounded transition-colors">Transfer Team</button>
                    <button className="flex-1 text-[11px] font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-1.5 rounded transition-colors">Assign Worker</button>
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
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                    <button className="flex-1 text-[11px] font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 rounded transition-colors">Close Task</button>
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
      <div className="hidden print:block print:bg-white print:text-black w-full min-h-screen absolute top-0 left-0 z-50 m-0 p-0" dir="rtl">
        {/* Print Header */}
        <div className="text-center font-bold text-lg mb-6 flex justify-center items-center gap-2">
          <span>צוות: ליקויים |</span>
          <span>מחלקה: test |</span>
          <span>תאריך: 12/06/2026</span>
        </div>
        
        {/* 2x2 Grid for A4 Page */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 max-w-[210mm] mx-auto">
          
          {/* Card 1 */}
          <div className="break-inside-avoid border-[3px] border-black rounded-xl p-4 flex flex-col h-[125mm] relative bg-white">
            {/* Top Bar */}
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
              <div className="border-2 border-black px-4 py-1 font-bold">תוקן</div>
              <div className="text-xl font-black">חדר: 201</div>
            </div>
            
            {/* Description */}
            <div className="text-center font-bold text-lg mb-2">
              אסלה<br/>
              <span className="text-sm font-normal text-gray-600">מים נוזלים</span>
            </div>

            {/* Photo Placeholder */}
            <div className="flex-grow flex items-center justify-center bg-gray-100 border border-gray-300 mb-4 overflow-hidden rounded-md">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" alt="Toilet" className="object-cover h-full w-full" />
            </div>
            
            {/* Footer Signatures */}
            <div className="mt-auto pt-2 flex justify-between items-end text-sm font-bold border-t-2 border-dashed border-black pt-4">
              <div>שם עובד: ________________</div>
              <div>חתימה: ________________</div>
              <div>תאריך: ________________</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="break-inside-avoid border-[3px] border-black rounded-xl p-4 flex flex-col h-[125mm] relative bg-white">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
              <div className="border-2 border-black px-4 py-1 font-bold">תוקן</div>
              <div className="text-xl font-black">חדר: 201</div>
            </div>
            <div className="text-center font-bold text-lg mb-2">
              כיור<br/>
              <span className="text-sm font-normal text-gray-600">סתימה בכיור</span>
            </div>
            <div className="flex-grow flex items-center justify-center bg-gray-100 border border-gray-300 mb-4 overflow-hidden rounded-md">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" alt="Sink" className="object-cover h-full w-full" />
            </div>
            <div className="mt-auto pt-2 flex justify-between items-end text-sm font-bold border-t-2 border-dashed border-black pt-4">
              <div>שם עובד: ________________</div>
              <div>חתימה: ________________</div>
              <div>תאריך: ________________</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="break-inside-avoid border-[3px] border-black rounded-xl p-4 flex flex-col h-[125mm] relative bg-white">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
              <div className="border-2 border-black px-4 py-1 font-bold">תוקן</div>
              <div className="text-xl font-black">חדר: 201</div>
            </div>
            <div className="text-center font-bold text-lg mb-2">
              ארונות<br/>
              <span className="text-sm font-normal text-gray-600">דלת שבורה</span>
            </div>
            <div className="flex-grow flex items-center justify-center bg-gray-100 border border-gray-300 mb-4 overflow-hidden rounded-md">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" alt="Cabinet" className="object-cover h-full w-full" />
            </div>
            <div className="mt-auto pt-2 flex justify-between items-end text-sm font-bold border-t-2 border-dashed border-black pt-4">
              <div>שם עובד: ________________</div>
              <div>חתימה: ________________</div>
              <div>תאריך: ________________</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="break-inside-avoid border-[3px] border-black rounded-xl p-4 flex flex-col h-[125mm] relative bg-white">
            <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
              <div className="border-2 border-black px-4 py-1 font-bold">תוקן</div>
              <div className="text-xl font-black">חדר: 201</div>
            </div>
            <div className="text-center font-bold text-lg mb-2">
              מזגן<br/>
              <span className="text-sm font-normal text-gray-600">לא מקרר</span>
            </div>
            <div className="flex-grow flex items-center justify-center bg-gray-100 border border-gray-300 mb-4 overflow-hidden rounded-md">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" alt="AC" className="object-cover h-full w-full" />
            </div>
            <div className="mt-auto pt-2 flex justify-between items-end text-sm font-bold border-t-2 border-dashed border-black pt-4">
              <div>שם עובד: ________________</div>
              <div>חתימה: ________________</div>
              <div>תאריך: ________________</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
