'use client';

import { useState } from 'react';
import { 
  Wrench, 
  MapPin, 
  Camera, 
  CheckCircle2,
  Clock,
  ArrowLeft
} from 'lucide-react';

import { useStore } from '../../store/store';
import { useEffect, useState } from 'react';

export default function WorkerApp() {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { tasks, fetchTasks, updateTask } = useStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Dummy tasks assigned to this worker (fallback if empty)
  const myTasks = tasks.length > 0 ? tasks.filter(t => t.status !== 'DONE') : [
    {
      id: '1',
      room: '201',
      department: 'test',
      systemName: 'כיור',
      notes: 'fpg',
      actionType: 'REPAIR',
      time: '13:38 12/06/2026',
      status: 'NEW',
      photoBefore: 'https://i.pravatar.cc/150?img=1'
    },
    {
      id: '2',
      room: '201',
      department: 'test',
      systemName: 'אסלה',
      notes: 'jjvh',
      actionType: 'REPAIR',
      time: '13:38 12/06/2026',
      status: 'IN_PROGRESS',
      photoBefore: 'https://i.pravatar.cc/150?img=2'
    }
  ];

  const handleMarkDone = async () => {
    if (selectedTask?.id && selectedTask.id.length > 5) { // If it's a real DB task
      await updateTask(selectedTask.id, { status: 'DONE' });
    }
    alert(`Task ${selectedTask.systemName || selectedTask.system?.name} marked as DONE!`);
    setSelectedTask(null);
  };

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
        <header className="bg-emerald-600 text-white p-4 flex items-center gap-3 shadow-md sticky top-0">
          <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-emerald-700 rounded transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1 text-center">פרטי משימה</h1>
          <div className="w-6 h-6"></div>
        </header>

        <main className="p-4 max-w-md mx-auto space-y-6 pb-32">
          {/* Status badge */}
          <div className="flex justify-center -mt-2">
            <span className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-bold shadow-sm border border-orange-200">
              בטיפול (В работе)
            </span>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">חדר: {selectedTask.room}</h2>
                <p className="text-slate-500">{selectedTask.department}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-lg text-white ${selectedTask.actionType === 'REPAIR' ? 'bg-orange-500' : 'bg-red-500'}`}>
                {selectedTask.actionType === 'REPAIR' ? 'תיקון' : 'החלפה'}
              </span>
            </div>

            <div className="py-4 border-y border-slate-100 my-4 space-y-3">
              <div>
                <span className="text-xs text-slate-400 font-bold">פריט נבדק:</span>
                <p className="text-lg font-bold text-slate-800">{selectedTask.systemName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold">הערות:</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedTask.notes}</p>
              </div>
            </div>

            {/* Photo Before */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold">תמונה לפני (Фото ДО):</span>
              <div className="h-48 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden">
                <img src={selectedTask.photoBefore} alt="Before" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 space-y-3">
            <button className="w-full max-w-md mx-auto bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 font-bold text-lg rounded-xl py-3 flex items-center justify-center gap-2 transition-all">
              <Camera className="w-5 h-5" /> צלם תמונה אחרי (ФОТО ПОСЛЕ)
            </button>
            <button 
              onClick={handleMarkDone}
              className="w-full max-w-md mx-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-6 h-6" /> בוצע (ГОТОВО)
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      
      {/* App Bar */}
      <header className="bg-emerald-600 text-white p-4 flex items-center gap-3 shadow-md">
        <Wrench className="w-6 h-6" />
        <h1 className="text-xl font-bold">WorkerApp - משימות שלי</h1>
      </header>

      <main className="p-4 max-w-md mx-auto">
        
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          משימות פתוחות ({myTasks.length})
        </h2>

        <div className="space-y-4">
          {myTasks.map(task => (
            <button 
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="w-full text-right bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
              
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${task.actionType === 'REPAIR' ? 'bg-orange-500' : 'bg-red-500'}`}>
                  {task.actionType === 'REPAIR' ? 'תיקון' : 'החלפה'}
                </span>
                <span className="text-xs text-slate-400">{task.time}</span>
              </div>
              
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img src={task.photoBefore} alt="thumb" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{task.systemName}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" /> חדר: {task.room} | {task.department}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
