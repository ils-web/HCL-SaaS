'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  MapPin, 
  Plus, 
  Trash2, 
  Camera, 
  Upload,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../../store/store';

export default function InspectorApp() {
  const { areas, systems, fetchDictionaries, createBulkTasks } = useStore();

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);

  const [step, setStep] = useState(1); // 1: Room Info, 2: Add Defects
  const [department, setDepartment] = useState('');
  const [room, setRoom] = useState('');

  // Cart for multiple defects
  const [defectsCart, setDefectsCart] = useState([]);
  
  // Current defect form state
  const [currentArea, setCurrentArea] = useState('');
  const [currentSystem, setCurrentSystem] = useState('');
  const [actionType, setActionType] = useState('REPAIR'); // REPAIR = 2, REPLACE = 1
  const [notes, setNotes] = useState('');

  const handleStartInspection = () => {
    if (department && room) setStep(2);
  };

  const handleAddDefect = () => {
    if (!currentArea || !currentSystem) return;
    
    setDefectsCart([...defectsCart, {
      id: Date.now(),
      areaId: currentArea,
      areaName: areas.find(a => a.id === currentArea)?.name,
      systemId: currentSystem,
      systemName: systems.find(s => s.id === currentSystem)?.name,
      actionType,
      notes,
    }]);

    // Reset current form
    setCurrentArea('');
    setCurrentSystem('');
    setActionType('REPAIR');
    setNotes('');
  };

  const removeDefect = (id) => {
    setDefectsCart(defectsCart.filter(d => d.id !== id));
  };

  const handleSubmitAll = async () => {
    // Map defects to the format expected by the backend
    const tasksToSubmit = defectsCart.map(d => ({
      departmentId: department, // Since we don't have department selection yet, just pass the string (or we could map to a real UUID later)
      room: room,
      areaId: d.areaId,
      systemId: d.systemId,
      actionType: d.actionType,
      notes: d.notes,
      photoUrl: null, // We haven't implemented real photo upload yet
      teamId: systems.find(s => s.id === d.systemId)?.autoAssignTeamId, // Auto-routing based on system
      inspectorName: 'Инспектор'
    }));

    await createBulkTasks(tasksToSubmit);

    alert(`Успешно отправлено ${defectsCart.length} дефектов для комнаты ${room}!`);
    setDefectsCart([]);
    setStep(1);
    setRoom('');
  };

  const handleAllOk = () => {
    // Here we will record that the room was inspected and is OK
    alert(`Помещение ${room} проверено: ВСЁ В ПОРЯДКЕ! ✅`);
    setDefectsCart([]);
    setStep(1);
    setRoom('');
  };

  const filteredSystems = systems.filter(s => s.areaId === currentArea);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      
      {/* App Bar */}
      <header className="bg-indigo-600 text-white p-4 flex items-center gap-3 shadow-md">
        <ClipboardCheck className="w-6 h-6" />
        <h1 className="text-xl font-bold">HCL Инспектор</h1>
      </header>

      <main className="p-4 max-w-md mx-auto pb-32">
        
        {/* Step 1: Room Entry */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="text-indigo-500" />
              Проверка помещений
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Отделение (מחלקה)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Например: ג 3"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Номер или название помещения</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg font-bold"
                  placeholder="800"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>

              <button 
                onClick={handleStartInspection}
                disabled={!department || !room}
                className="w-full bg-indigo-600 disabled:bg-slate-300 text-white font-bold text-lg rounded-xl py-4 mt-4 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
              >
                Начать обход <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Adding Defects */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* Header Status */}
            <div className="bg-indigo-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
              <div className="font-bold text-lg">Помещение: {room}</div>
              <div className="text-indigo-200 text-sm">{department}</div>
            </div>

            {/* New Defect Form */}
            <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2 text-indigo-800 font-semibold">
                <Plus className="w-4 h-4" /> Новая неисправность...
              </div>
              
              <div className="p-4 space-y-5">
                {/* Area Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Где (אזור)?</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={currentArea}
                    onChange={(e) => { setCurrentArea(e.target.value); setCurrentSystem(''); }}
                  >
                    <option value="">Выберите зону...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                {/* System Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Что неисправно?</label>
                  <select 
                    disabled={!currentArea}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    value={currentSystem}
                    onChange={(e) => setCurrentSystem(e.target.value)}
                  >
                    <option value="">Выберите систему...</option>
                    {filteredSystems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Action Toggle (Repair / Replace) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Действие:</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActionType('REPAIR')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${actionType === 'REPAIR' ? 'bg-[#f97316] text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      🛠️ Ремонт
                    </button>
                    <button 
                      onClick={() => setActionType('REPLACE')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${actionType === 'REPLACE' ? 'bg-[#dc2626] text-white shadow-lg shadow-red-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      🔄 Замена
                    </button>
                  </div>
                </div>

                {/* Description & Photo */}
                <div className="flex gap-3">
                  <textarea 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none h-24"
                    placeholder="Описание поломки (обязательно)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="w-20 shrink-0 flex flex-col gap-2">
                    <button className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-colors">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">ФОТО</span>
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button 
                  onClick={handleAddDefect}
                  disabled={!currentArea || !currentSystem}
                  className="w-full py-3 rounded-xl font-bold border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 disabled:opacity-50 disabled:hover:bg-transparent transition-all flex justify-center items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Добавить неисправность
                </button>
              </div>
            </div>

            {/* Cart Preview */}
            {defectsCart.length > 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Уже добавлено ({defectsCart.length}):</h3>
                <div className="space-y-3">
                  {defectsCart.map(defect => (
                    <div key={defect.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${defect.actionType === 'REPAIR' ? 'bg-orange-500' : 'bg-red-500'}`}>
                            {defect.actionType === 'REPAIR' ? 'РЕМОНТ' : 'ЗАМЕНА'}
                          </span>
                          <span className="font-bold text-sm text-slate-800">{defect.systemName}</span>
                        </div>
                        <div className="text-xs text-slate-500">{defect.areaName} • {defect.notes || 'Без описания'}</div>
                      </div>
                      <button onClick={() => removeDefect(defect.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button 
                onClick={handleAllOk}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl py-6 flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 border-2 border-emerald-400"
              >
                <ShieldCheck className="w-10 h-10 mb-1" />
                <span>В помещении всё в порядке!</span>
                <span className="text-sm font-normal text-emerald-100">Завершить проверку и перейти к следующему</span>
              </button>
            )}
            
            {/* Submit All */}
            {defectsCart.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
                <button 
                  onClick={handleSubmitAll}
                  className="w-full max-w-md mx-auto bg-indigo-800 hover:bg-indigo-900 text-white font-bold text-lg rounded-xl py-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-900/20"
                >
                  Отправить неисправности ({defectsCart.length})
                </button>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
