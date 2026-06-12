'use client';

import { useState } from 'react';
import { Camera, MapPin, AlertTriangle, CheckCircle2, Upload } from 'lucide-react';

export default function InspectorReportPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0b131e] text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Report Submitted!</h1>
        <p className="text-slate-400 text-center max-w-sm mb-8">
          Thank you. The maintenance team has been notified and a task card has been generated.
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
        >
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b131e] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <AlertTriangle className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Report Issue</h1>
            <p className="text-sm text-slate-400 font-medium">HCL Facility Maintenance</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Location (Auto-filled by QR usually, but editable) */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
            <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
            <div className="flex items-center gap-3 text-white bg-[#0b131e] px-4 py-3 rounded-xl border border-white/5">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div className="flex flex-col">
                <span className="font-medium">Room 302</span>
                <span className="text-xs text-slate-500">Main Building, 3rd Floor</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">Location detected from QR Code.</p>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Issue Category</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="category" className="peer sr-only" defaultChecked />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-blue-500/20 peer-checked:border-blue-500/50 peer-checked:text-blue-400 transition-all">
                  Plumbing
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="category" className="peer sr-only" />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-amber-500/20 peer-checked:border-amber-500/50 peer-checked:text-amber-400 transition-all">
                  Electrical
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="category" className="peer sr-only" />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500/50 peer-checked:text-emerald-400 transition-all">
                  HVAC
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="category" className="peer sr-only" />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-purple-500/20 peer-checked:border-purple-500/50 peer-checked:text-purple-400 transition-all">
                  Other
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Description</label>
            <textarea 
              rows={4}
              placeholder="What seems to be the problem?"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            ></textarea>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">Photo (BEFORE)</label>
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-white font-medium mb-1">Take a Photo</span>
              <span className="text-xs text-slate-500">or upload from gallery</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all mt-4"
          >
            <Upload className="w-5 h-5" />
            Submit Report
          </button>

        </form>
      </div>
    </div>
  );
}
