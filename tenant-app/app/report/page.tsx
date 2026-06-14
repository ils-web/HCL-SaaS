import { useState, useEffect } from 'react';
import { Camera, MapPin, AlertTriangle, CheckCircle2, Upload, Globe } from 'lucide-react';
import { useStore } from '../../store/store';

const TRANSLATIONS = {
  en: {
    title: 'Report Issue',
    subtitle: 'HCL Facility Maintenance',
    location: 'Location',
    locationDetected: 'Location detected from QR Code.',
    category: 'Issue Category',
    desc: 'Description',
    descPlaceholder: 'What seems to be the problem?',
    photo: 'Photo (BEFORE)',
    photoBtn: 'Take a Photo',
    photoSub: 'or upload from gallery',
    submit: 'Submit Report',
    successTitle: 'Report Submitted!',
    successDesc: 'Thank you. The maintenance team has been notified and a task card has been generated.',
    reportAnother: 'Report Another Issue',
    catPlumbing: 'Plumbing',
    catElectrical: 'Electrical',
    catHVAC: 'HVAC',
    catOther: 'Other',
    validationError: 'Unfortunately, we cannot process your request if you do not fill in all the fields (Description and Photo are required).'
  },
  ru: {
    title: 'Сообщить о поломке',
    subtitle: 'Техническое обслуживание HCL',
    location: 'Местоположение',
    locationDetected: 'Определено по QR-коду.',
    category: 'Категория',
    desc: 'Описание',
    descPlaceholder: 'Опишите проблему...',
    photo: 'Фотография (ДО)',
    photoBtn: 'Сделать фото',
    photoSub: 'или выбрать из галереи',
    submit: 'Отправить',
    successTitle: 'Отправлено!',
    successDesc: 'Спасибо. Инженерная служба уведомлена, карточка задания создана.',
    reportAnother: 'Отправить еще',
    catPlumbing: 'Сантехника',
    catElectrical: 'Электрика',
    catHVAC: 'Кондиционер',
    catOther: 'Другое',
    validationError: 'К сожалению, мы не сможем обработать вашу заявку, если вы не заполните все поля (описание и фото обязательны).'
  },
  he: {
    title: 'דיווח על תקלה',
    subtitle: 'תחזוקת מבנים HCL',
    location: 'מיקום',
    locationDetected: 'המיקום זוהה מקוד ה-QR.',
    category: 'סוג התקלה',
    desc: 'תיאור',
    descPlaceholder: 'מה הבעיה?',
    photo: 'תמונה (לפני)',
    photoBtn: 'צלם תמונה',
    photoSub: 'או העלה מהגלריה',
    submit: 'שלח דיווח',
    successTitle: 'הדיווח נשלח!',
    successDesc: 'תודה רבה. צוות התחזוקה עודכן ונוצרה כרטיסיית משימה.',
    reportAnother: 'דווח על תקלה נוספת',
    catPlumbing: 'אינסטלציה',
    catElectrical: 'חשמל',
    catHVAC: 'מיזוג אוויר',
    catOther: 'אחר',
    validationError: 'לצערנו, לא נוכל לעבד את בקשתך אם לא תמלא את כל השדות (חובה להוסיף תיאור ותמונה).'
  }
};

// Values that will ALWAYS be sent to admin in Hebrew regardless of UI language
const CATEGORY_HEBREW_VALUES = {
  Plumbing: 'אינסטלציה',
  Electrical: 'חשמל',
  HVAC: 'מיזוג אוויר',
  Other: 'אחר'
};

export default function InspectorReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [lang, setLang] = useState<'en' | 'ru' | 'he'>('he'); // default
  const [description, setDescription] = useState('');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');

  const { createTask } = useStore();

  useEffect(() => {
    // Auto-detect browser language
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === 'ru' || browserLang === 'he' || browserLang === 'en') {
      setLang(browserLang);
    }
  }, []);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'he';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !photoAdded) {
      setErrorMsg(t.validationError);
      return;
    }
    
    setErrorMsg('');
    
    // MOCK TRANSLATION: In a real app we would call Google Translate API.
    // For demonstration, we just show that it will be translated to Hebrew.
    const mockHebrewTranslation = 'תורגם אוטומטית לעברית: ' + description;
    setTranslatedDesc(mockHebrewTranslation);
    
    // Call the Zustand store to actually create the task
    const form = e.target as HTMLFormElement;
    const category = (form.elements.namedItem('category') as HTMLInputElement)?.value || 'אחר';
    
    createTask({
      room: '201', // Example hardcoded room for the QR code
      systemId: null, // Since this is a freeform text, system is unknown initially
      actionType: 'REPAIR',
      notes: mockHebrewTranslation,
      photoUrl: 'https://example.com/mock-photo.jpg'
    }).then(() => {
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0b131e] text-slate-200 flex flex-col items-center justify-center p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">{t.successTitle}</h1>
        <p className="text-slate-400 text-center max-w-sm mb-8">
          {t.successDesc}
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
        >
          {t.reportAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b131e] text-slate-200 p-4 md:p-8 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto relative">
        
        {/* Language Selector */}
        <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} flex items-center bg-white/5 rounded-lg p-1 border border-white/10`}>
          <Globe className="w-4 h-4 text-slate-400 mx-2" />
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="he" className="text-black">עברית</option>
            <option value="en" className="text-black">English</option>
            <option value="ru" className="text-black">Русский</option>
          </select>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
            <AlertTriangle className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.title}</h1>
            <p className="text-sm text-slate-400 font-medium">{t.subtitle}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Location */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
            <label className={`block text-sm font-medium text-slate-400 mb-2 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.location}</label>
            <div className="flex items-center gap-3 text-white bg-[#0b131e] px-4 py-3 rounded-xl border border-white/5">
              <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">חדר 201</span>
                <span className="text-xs text-slate-500">בניין מרכזי, קומה 2</span>
              </div>
            </div>
            <p className={`text-xs text-slate-500 mt-2 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.locationDetected}</p>
          </div>

          {/* Issue Category */}
          <div>
            <label className={`block text-sm font-medium text-slate-400 mb-2 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.category}</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                {/* Always sends Hebrew value to backend! */}
                <input type="radio" name="category" value={CATEGORY_HEBREW_VALUES.Plumbing} className="peer sr-only" defaultChecked />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-blue-500/20 peer-checked:border-blue-500/50 peer-checked:text-blue-400 transition-all font-medium">
                  {t.catPlumbing}
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="category" value={CATEGORY_HEBREW_VALUES.Electrical} className="peer sr-only" />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-amber-500/20 peer-checked:border-amber-500/50 peer-checked:text-amber-400 transition-all font-medium">
                  {t.catElectrical}
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="category" value={CATEGORY_HEBREW_VALUES.HVAC} className="peer sr-only" />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500/50 peer-checked:text-emerald-400 transition-all font-medium">
                  {t.catHVAC}
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="category" value={CATEGORY_HEBREW_VALUES.Other} className="peer sr-only" />
                <div className="text-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 peer-checked:bg-purple-500/20 peer-checked:border-purple-500/50 peer-checked:text-purple-400 transition-all font-medium">
                  {t.catOther}
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium text-slate-400 mb-2 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.desc}</label>
            <textarea 
              rows={4}
              placeholder={t.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            ></textarea>
          </div>

          {/* Photo Upload */}
          <div>
            <label className={`block text-sm font-medium text-slate-400 mb-2 ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.photo}</label>
            <div 
              onClick={() => setPhotoAdded(!photoAdded)}
              className={`border-2 border-dashed ${photoAdded ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/20 bg-white/5'} rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer group`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${photoAdded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400 group-hover:scale-110'}`}>
                {photoAdded ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              </div>
              <span className={`font-medium mb-1 ${photoAdded ? 'text-emerald-400' : 'text-white'}`}>
                {photoAdded ? 'Фото добавлено!' : t.photoBtn}
              </span>
              {!photoAdded && <span className="text-xs text-slate-500">{t.photoSub}</span>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all mt-4"
          >
            <Upload className="w-5 h-5" />
            {t.submit}
          </button>

        </form>
      </div>
    </div>
  );
}
