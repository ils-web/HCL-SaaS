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
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useStore } from '../../store/store';

export default function AdminDashboard() {
  const [activeTeamFilter, setActiveTeamFilter] = useState('ALL');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  
  const { tasks, teams, fetchTasks, updateTask, markTasksAsDone } = useStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePrint = () => {
    window.print();
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const handleCloseSelected = async () => {
    if (selectedTaskIds.size === 0) return;
    await markTasksAsDone(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
  };

  const handleMarkDone = async (taskId: string) => {
    await updateTask(taskId, { status: 'DONE' });
  };

  const handleAssignWorker = async (taskId: string) => {
    // Basic assignment logic simulation
    await updateTask(taskId, { status: 'IN_PROGRESS' });
  };

  const handleTransferTeam = async (taskId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    if (newTeamId) {
      await updateTask(taskId, { teamId: newTeamId });
    }
  };

  // Filter logic
  const filteredTasks = activeTeamFilter === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.teamId === activeTeamFilter);

  const newTasks = filteredTasks.filter(t => t.status === 'NEW' || !t.status);
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter(t => t.status === 'DONE');

  const urgentCount = newTasks.length; // Simplified for MVP

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

        <div className="flex items-center gap-3">
          
          {/* New Logic Buttons from Old System */}
          {selectedTaskIds.size > 0 && (
            <div className="flex items-center gap-2 mr-4 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
              <span className="text-sm text-indigo-300 font-medium px-2">{selectedTaskIds.size} Selected</span>
              <button 
                onClick={handleCloseSelected}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-all text-sm"
              >
                <CheckSquare className="w-4 h-4" />
                Close Selected (סגור נבחרים)
              </button>
              <button 
                onClick={() => setSelectedTaskIds(new Set())}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md font-medium transition-all text-sm"
              >
                <Square className="w-4 h-4" />
                Deselect
              </button>
            </div>
          )}

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg font-medium transition-all print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Print Cards
          </button>
          
          <Link href="/report" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all print:hidden">
            <QrCode className="w-4 h-4 text-blue-400" />
            QR
          </Link>
          
          <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all print:hidden">
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </Link>
          
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
            <span className="text-3xl font-bold text-white">{newTasks.length}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-24 h-24 text-amber-500" />
            </div>
            <span className="text-slate-400 text-sm font-medium mb-1">In Progress</span>
            <span className="text-3xl font-bold text-white">{inProgressTasks.length}</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </div>
            <span className="text-slate-400 text-sm font-medium mb-1">Completed Today</span>
            <span className="text-3xl font-bold text-white">{completedTasks.length}</span>
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
            
            {/* Team Filters (Tabs equivalent) */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto max-w-2xl scrollbar-hide">
              <button 
                onClick={() => setActiveTeamFilter('ALL')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTeamFilter === 'ALL' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Все (All)
              </button>
              {teams.map(team => (
                <button 
                  key={team.id}
                  onClick={() => setActiveTeamFilter(team.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTeamFilter === team.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {team.name.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: New */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[700px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  New Tasks
                </h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-md">{newTasks.length}</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                {newTasks.map(task => (
                  <div key={task.id} className="bg-[#0b131e] border border-white/10 p-4 rounded-xl shadow-lg hover:border-blue-500/50 transition-colors group relative pl-10">
                    
                    {/* Checkbox for Multi-select */}
                    <div className="absolute left-3 top-4">
                      <input 
                        type="checkbox" 
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Urgent</span>
                      <span className="text-xs text-slate-500">Room: {task.room}</span>
                    </div>
                    <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors text-sm">{task.system?.name || task.systemName || 'New Task'}</h4>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.notes}</p>
                    
                    {task.photoUrl && (
                      <div className="w-full h-24 mb-3 rounded-lg overflow-hidden border border-white/10">
                        <img src={task.photoUrl} alt="Task" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3"/> {teams.find(t => t.id === task.teamId)?.name || 'Unassigned'}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
                      
                      {/* Transfer Team Select */}
                      <select 
                        className="w-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium py-1.5 px-2 rounded outline-none"
                        onChange={(e) => handleTransferTeam(task.id, e)}
                        value={task.teamId || ''}
                      >
                        <option value="" disabled>Transfer Team...</option>
                        {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-800 text-white">{t.name}</option>)}
                      </select>

                      <div className="flex gap-2">
                        <button onClick={() => handleAssignWorker(task.id)} className="flex-1 text-[11px] font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-1.5 rounded transition-colors">Assign</button>
                        <button onClick={() => handleMarkDone(task.id)} className="flex-1 text-[11px] font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 rounded transition-colors">Done (בוצע)</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[700px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  In Progress
                </h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-md">{inProgressTasks.length}</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                {inProgressTasks.map(task => (
                  <div key={task.id} className="bg-[#0b131e] border border-blue-500/30 p-4 rounded-xl shadow-lg hover:border-blue-500/50 transition-colors group relative pl-10">
                    
                    {/* Checkbox for Multi-select */}
                    <div className="absolute left-3 top-4">
                      <input 
                        type="checkbox" 
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Working</span>
                      <span className="text-xs text-slate-500">Room: {task.room}</span>
                    </div>
                    <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors text-sm">{task.system?.name || task.systemName || 'Task'}</h4>
                    <p className="text-xs text-slate-400 mb-3">{task.notes}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3"/> {teams.find(t => t.id === task.teamId)?.name}</span>
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <div className="w-4 h-4 rounded-full bg-slate-700 overflow-hidden">
                          <img src="https://i.pravatar.cc/150?img=33" alt="Worker" />
                        </div>
                        Worker
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                      <button onClick={() => handleMarkDone(task.id)} className="flex-1 text-[11px] font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 rounded transition-colors">Done (בוצע)</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[700px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Completed
                </h3>
                <span className="bg-white/10 text-xs px-2 py-1 rounded-md">{completedTasks.length}</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="bg-[#0b131e] border border-white/10 p-4 rounded-xl shadow-lg opacity-70 hover:opacity-100 transition-opacity group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Done</span>
                      <span className="text-xs text-slate-500">Room: {task.room}</span>
                    </div>
                    <h4 className="text-white font-medium mb-1 line-through text-slate-400 group-hover:text-blue-400 transition-colors text-sm">{task.system?.name || task.systemName || 'Task'}</h4>
                    <p className="text-xs text-slate-500 mb-3">{task.notes}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3 h-3"/> Closed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Hidden Print Layout (Task Cards) */}
      <div className="hidden print:block w-full" dir="rtl">
        <div className="text-center font-bold text-lg mb-4 pt-2">
          <span>צוות: כללי | </span>
          <span>תאריך הדפסה: {new Date().toLocaleDateString('he-IL')}</span>
        </div>
        
        {/* Exactly 4 cards per A4 page. A4 is 297mm height, 210mm width. */}
        <div className="flex flex-wrap justify-between gap-y-[10mm] w-[190mm] mx-auto">
          {filteredTasks.filter(t => t.status !== 'DONE').slice(0, 4).map(task => (
            <div key={task.id} className="w-[90mm] break-inside-avoid border-2 border-black rounded-lg p-2 flex flex-col h-[125mm] bg-white relative">
              
              <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                <div className="border border-black px-2 py-0.5 font-bold text-sm">תוקן</div>
                <div className="text-base font-black">חדר: {task.room}</div>
              </div>
              
              <div className="text-center font-bold text-sm mb-2">
                {task.system?.name || task.systemName || 'כללי'}<br/>
                <span className="text-xs font-normal text-slate-700">{task.notes}</span>
              </div>

              <div className="flex-grow flex items-center justify-center bg-slate-50 border border-slate-300 mb-2 overflow-hidden rounded">
                {task.photoUrl ? (
                  <img src={task.photoUrl} alt="Photo" className="object-cover h-full w-full grayscale" />
                ) : (
                  <span className="text-slate-300 text-xs">אין תמונה</span>
                )}
              </div>
              
              <div className="mt-auto pt-1 flex justify-between items-end text-[10px] font-bold border-t-2 border-dashed border-black pt-2">
                <div>עובד: ____________</div>
                <div>חתימה: ____________</div>
                <div>תאריך: ____________</div>
              </div>

            </div>
          ))}
          {/* Fill empty slots with dummy if less than 4, just to show layout */}
          {filteredTasks.filter(t => t.status !== 'DONE').length < 4 && Array.from({ length: 4 - filteredTasks.filter(t => t.status !== 'DONE').length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-[90mm] break-inside-avoid border-2 border-black rounded-lg p-2 flex flex-col h-[125mm] bg-white opacity-40">
              <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-2">
                <div className="border border-black px-2 py-0.5 font-bold text-sm">תוקן</div>
                <div className="text-base font-black">חדר: ____</div>
              </div>
              <div className="flex-grow flex items-center justify-center bg-slate-50 border border-slate-300 mb-2"></div>
              <div className="mt-auto pt-1 flex justify-between items-end text-[10px] font-bold border-t-2 border-dashed border-black pt-2">
                <div>עובד: ____________</div>
                <div>חתימה: ____________</div>
                <div>תאריך: ____________</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
