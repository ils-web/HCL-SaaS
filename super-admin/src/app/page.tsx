'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, AlertCircle, CheckCircle, Ban, ExternalLink, Settings } from 'lucide-react';

type Tenant = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'UNPAID' | 'BLOCKED';
  createdAt: string;
};

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTenantName, setNewTenantName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) return;
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTenantName, status: 'ACTIVE' })
      });
      if (res.ok) {
        setNewTenantName('');
        setIsModalOpen(false);
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm"><CheckCircle className="w-4 h-4"/> פעיל</span>;
      case 'UNPAID': return <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold text-sm"><AlertCircle className="w-4 h-4"/> ממתין לתשלום</span>;
      case 'BLOCKED': return <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold text-sm"><Ban className="w-4 h-4"/> חסום</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
              <Settings className="w-10 h-10 text-indigo-600" />
              Super Admin SaaS
            </h1>
            <p className="text-gray-500 font-medium mt-2">ניהול לקוחות, מוסדות ומנויים</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-500 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            הוסף מוסד חדש
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-indigo-600 font-bold">טוען נתונים...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(tenant => (
              <div key={tenant.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-500" />
                    {tenant.name}
                  </h3>
                  {getStatusBadge(tenant.status)}
                </div>
                
                <div className="text-sm text-gray-500 font-medium mb-6">
                  מזהה: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{tenant.id}</span>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <select 
                      value={tenant.status}
                      onChange={(e) => handleUpdateStatus(tenant.id, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="ACTIVE">פעיל (Active)</option>
                      <option value="UNPAID">ללא תשלום (Unpaid)</option>
                      <option value="BLOCKED">חסום (Blocked)</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                     {/* Assume the tenant-app runs on port 3000 */}
                    <a 
                      href={`http://localhost:3000/admin.html?tenantId=${tenant.id}`}
                      target="_blank"
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors shadow-sm"
                      title="כניסה למערכת של המוסד"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
            
            {tenants.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500">אין מוסדות במערכת</h3>
                <p className="text-gray-400 mt-2">לחץ על הוסף מוסד חדש כדי להתחיל</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-6">הוספת מוסד חדש</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">שם המוסד (בית חולים, מרפאה)</label>
              <input 
                type="text" 
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="לדוגמה: בית חולים איכילוב"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200"
              >
                ביטול
              </button>
              <button 
                onClick={handleCreateTenant}
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 shadow-md"
              >
                הוסף מוסד
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
