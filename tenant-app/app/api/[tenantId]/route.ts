import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGlobalConfig } from '@/app/api/superadmin/route';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

// Using shared prisma singleton

const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "super123";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-change-me-in-production';
  return new TextEncoder().encode(secret);
};

async function verifyAdminAuth(request: Request, tenantId: string): Promise<boolean> {
  try {
    let token = '';
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    if (!token) return false;
    if (token === SUPERADMIN_PASSWORD) return true;

    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as { role?: string; tenantId?: string };
    if (payload.role === 'SUPERADMIN') return true;
    if (payload.role === 'ADMIN' && payload.tenantId === tenantId) return true;
    return false;
  } catch (e) {
    return false;
  }
}

function deriveDefaultInspectorPin(tenantId: string): string {
  let hash = 0;
  for (let i = 0; i < tenantId.length; i++) {
    hash = (hash * 31 + tenantId.charCodeAt(i)) % 9000;
  }
  return String(Math.abs(hash) + 1000).slice(0, 4);
}

function getNormalizedQrSettings(tenant: any) {
  const raw = (tenant?.qrSettings && typeof tenant.qrSettings === 'object') ? (tenant.qrSettings as any) : {};
  const defaultPin = deriveDefaultInspectorPin(tenant?.id || 'default');
  return {
    mode: raw.mode || '24/7',
    start: raw.start || '08:00',
    end: raw.end || '17:00',
    autoAssignQrToWorker: raw.autoAssignQrToWorker !== undefined ? Boolean(raw.autoAssignQrToWorker) : true,
    qrDutyWorkerIds: Array.isArray(raw.qrDutyWorkerIds) ? raw.qrDutyWorkerIds : [],
    dutyWorkersByTeam: (raw.dutyWorkersByTeam && typeof raw.dutyWorkersByTeam === 'object') ? raw.dutyWorkersByTeam : {},
    inspectorPin: raw.inspectorPin ? String(raw.inspectorPin).trim() : defaultPin,
    requireInspectorPin: raw.requireInspectorPin !== undefined ? Boolean(raw.requireInspectorPin) : true,
    inspectorDevices: Array.isArray(raw.inspectorDevices) ? raw.inspectorDevices : []
  };
}

function matchTeamByQrCategory(categoryName: string, teamsDb: { id: string; name: string }[]) {
  if (!categoryName || !teamsDb.length) return null;
  const cleanCat = categoryName.trim().toLowerCase();
  const cleanCatNoUnderscore = cleanCat.replace(/_/g, ' ');

  // 1. Direct name or substring match
  const direct = teamsDb.find(t => {
    const tn = t.name.trim().toLowerCase();
    return tn === cleanCat || tn === cleanCatNoUnderscore || tn.includes(cleanCatNoUnderscore) || cleanCatNoUnderscore.includes(tn);
  });
  if (direct && direct.name !== 'QR' && direct.name !== 'כללי') return direct;

  // 2. Multilingual semantic keyword groups (Hebrew / English / Russian)
  const keywordGroups: { triggers: string[]; teamMatchers: string[] }[] = [
    {
      triggers: ['חשמל', 'תאורה', 'שקע', 'electr', 'электр', 'свет', 'розетк'],
      teamMatchers: ['חשמל', 'electr', 'אלקטר', 'электр']
    },
    {
      triggers: ['מיזוג', 'מזגן', 'אוורור', 'חימום', 'air', 'ac', 'condit', 'кондиц', 'вентил', 'отопл'],
      teamMatchers: ['מיזוג', 'מזגן', 'air', 'ac', 'condit', 'hvac', 'кондиц']
    },
    {
      triggers: ['בינוי', 'דלת', 'חלון', 'קיר', 'תקרה', 'מיט', 'ריהוט', 'נגר', 'אינסטלצ', 'מים', 'נזיל', 'שירותים', 'renovat', 'build', 'door', 'plumb', 'ремонт', 'двер', 'сантех', 'мебел', 'кроват', 'стен'],
      teamMatchers: ['בינוי', 'שיפוץ', 'אחזק', 'renovat', 'build', 'maint', 'נגר', 'אינסטל', 'ремонт', 'строй', 'сантех']
    },
    {
      triggers: ['ניקיון', 'ניקוי', 'אשפה', 'לכלוך', 'clean', 'уборк', 'клининг', 'чист', 'мусор'],
      teamMatchers: ['ניקיון', 'ניקוי', 'clean', 'משק', 'уборк', 'клининг']
    }
  ];

  for (const group of keywordGroups) {
    if (group.triggers.some(tr => cleanCat.includes(tr) || cleanCatNoUnderscore.includes(tr))) {
      const matched = teamsDb.find(t => {
        const tn = t.name.trim().toLowerCase();
        return group.teamMatchers.some(m => tn.includes(m));
      });
      if (matched) return matched;
    }
  }

  return direct || null;
}

const translationCache = new Map<string, string>();

async function translateCached(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim() || !targetLang) return text || '';
  const clean = text.trim();
  // Skip if purely numeric/symbols
  if (/^[0-9\s.,!?:;()\-/"'\[\]#*+]+$/.test(clean)) return clean;
  // Skip if target is Hebrew and text is already purely Hebrew + punctuation/numbers
  if (targetLang === 'he' && /^[\u0590-\u05FF0-9\s.,!?:;()\-/"'\[\]#*+]+$/.test(clean)) return clean;
  // Skip if target is Russian and text is already purely Cyrillic + punctuation/numbers
  if (targetLang === 'ru' && /^[\u0400-\u04FF0-9\s.,!?:;()\-/"'\[\]#*+]+$/.test(clean)) return clean;

  const cacheKey = `${targetLang}:${clean}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(3500) }
    );
    const data = await res.json();
    const translated = data?.[0]?.map((item: any) => item[0])?.join('') || clean;
    if (translationCache.size > 3000) translationCache.clear();
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (e) {
    return clean;
  }
}

async function uploadToImgBB(base64Str: string): Promise<string | null> {
  if (!base64Str) return null;
  if (base64Str.startsWith('http')) return base64Str;
  const b64Data = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
  
  // 1. Primary Host: freeimage.host (Fast global CDN iili.io, 100% reliable)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const form = new URLSearchParams();
      form.append('key', '6d207e02198a847aa98d0a2a901485a5');
      form.append('action', 'upload');
      form.append('source', b64Data);
      form.append('format', 'json');
      const res = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(8000)
      });
      const result = await res.json();
      if (result?.image?.url) return result.image.url;
    } catch (e) {
      console.error(`freeimage.host upload attempt ${attempt} error:`, e);
    }
  }

  // 2. Fallback 1: Imgur
  try {
    const imgurForm = new URLSearchParams();
    imgurForm.append('image', b64Data);
    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: { 'Authorization': 'Client-ID 546c25a59c58ad7' },
      body: imgurForm,
      signal: AbortSignal.timeout(8000)
    });
    const result = await res.json();
    if (result?.data?.link) return result.data.link;
  } catch (e) {
    console.error('Imgur upload error:', e);
  }
  
  // 3. Fallback 2: Preserve compressed Data URI so photos are never lost even if external image hosts are down
  return base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${b64Data}`;
}

async function sendTelegram(text: string, customBotToken?: string | null, customChatId?: string | null) {
  const TELEGRAM_BOT_TOKEN = customBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = customChatId || process.env.TELEGRAM_CHAT_ID;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' })
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }
}

export async function GET(request: Request, props: { params: Promise<{ tenantId: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const tenantId = params.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  // Ensure tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 404 });
  }
  
  if (!['ACTIVE', 'FREE', 'TRIAL', 'UNPAID'].includes(tenant.status)) {
    return NextResponse.json({ error: `Tenant is ${tenant.status}` }, { status: 403 });
  }

  if (action === 'getSettings') {
    const isAdminCaller = await verifyAdminAuth(request, tenantId);
    const [workersDb, teamsDb, areas] = await Promise.all([
      prisma.user.findMany({ where: { tenantId, role: 'WORKER' } }),
      prisma.team.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } }),
      prisma.area.findMany({
        where: { tenantId },
        include: { systems: { include: { autoAssignTeam: true } } }
      })
    ]);

    const normalizedQr = getNormalizedQrSettings(tenant);
    const dutySet = new Set<string>(normalizedQr.qrDutyWorkerIds || []);

    const workers = workersDb.map(w => ({
      id: w.id,
      name: w.name,
      teamId: w.teamId,
      isQrDuty: dutySet.has(w.id)
    }));
    const teams = teamsDb.map(t => t.name);
    const teamsData = teamsDb.map(t => ({ id: t.id, name: t.name }));
    
    const categories: Record<string, string[]> = {};
    const systemTeams: Record<string, string> = {};

    for (const area of areas) {
      categories[area.name] = area.systems.map(s => s.name);
      for (const sys of area.systems) {
        if (sys.autoAssignTeam) {
          systemTeams[sys.name] = sys.autoAssignTeam.name;
        }
      }
    }

    // Public callers (report.html / inspector.html) only receive non-sensitive configuration
    if (!isAdminCaller) {
      return NextResponse.json({
        tenantName: tenant.name,
        tenantStatus: tenant.status,
        categories,
        teams,
        teamsData,
        systemTeams,
        qrSettings: {
          mode: normalizedQr.mode,
          start: normalizedQr.start,
          end: normalizedQr.end,
          requireInspectorPin: normalizedQr.requireInspectorPin
        }
      });
    }

    const globalConfig = await getGlobalConfig();

    let subscriptionEndsAt = tenant.subscriptionEndsAt;
    if (!subscriptionEndsAt) {
      const created = tenant.createdAt ? new Date(tenant.createdAt) : new Date();
      const days = tenant.status === 'TRIAL' ? 14 : 30;
      const defaultEndsAt = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
      subscriptionEndsAt = defaultEndsAt;
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { subscriptionEndsAt: defaultEndsAt }
        });
      } catch (e) {}
    }

    return NextResponse.json({ 
      workers, categories, teams, teamsData, systemTeams,
      qrSettings: normalizedQr,
      maxInspectors: tenant.status === 'FREE' ? 999 : (tenant.maxInspectors || 1),
      tenantName: tenant.name, 
      tenantStatus: tenant.status,
      plan: tenant.plan || 'BASIC',
      price: tenant.price || 0,
      subscriptionEndsAt: subscriptionEndsAt,
      plans: globalConfig.plans,
      paymentConfig: {
        provider: globalConfig.paymentConfig?.provider || 'CARDCOM',
        isLive: !!globalConfig.paymentConfig?.isLive
      },
      telegramChatId: tenant.telegramChatId || "",
      telegramBotToken: tenant.telegramBotToken || "",
      whatsappInstance: tenant.whatsappInstance || "",
      whatsappToken: tenant.whatsappToken || ""
    });
  }

  if (action === 'getOpenTasks') {
    const tasksDb = await prisma.task.findMany({
      where: { 
        tenantId,
        status: { in: ['NEW', 'IN_PROGRESS', 'COMPLETED'] }
      },
      include: {
        department: true,
        system: true,
        team: true,
        worker: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const tasks = tasksDb.map(t => {
      const isQr = Boolean(
        t.team?.name === 'QR' ||
        t.department?.name === 'QR' ||
        t.inspectorName?.includes('(QR)') ||
        t.inspectorName?.includes('צוות') ||
        t.customDefectName?.includes('דיווח') ||
        t.customDefectName?.includes('תקלה חדשה') ||
        t.room?.includes(' / ')
      );

      let resolvedDept = t.department?.name || 'כללי';
      let resolvedRoom = t.room;
      if (resolvedDept === 'QR' && t.room && t.room.includes(' / ')) {
        const parts = t.room.split(' / ');
        resolvedDept = parts[0];
        resolvedRoom = parts.slice(1).join(' / ') || parts[0];
      }

      return {
        id: t.id,
        isQr,
        sheet: t.team?.name || (isQr ? 'QR' : 'כללי'),
        dept: resolvedDept,
        department: resolvedDept,
        room: resolvedRoom,
        system: t.system?.name || t.customDefectName || 'אחר',
        defect: t.system?.name || t.customDefectName || 'אחר',
        action: t.actionType === 'REPAIR' ? 'Ремонт' : (t.actionType === 'REPLACE' ? 'Замена' : ''),
        inspector: t.inspectorName || 'מנהל',
        notes: t.notes || '',
        comment: t.notes || '',
        photo: t.photoUrl || '',
        afterPhoto: t.afterPhotoUrl || '',
        isSentToApp: t.isSentToApp || false,
        status: t.status === 'COMPLETED' ? 'הושלם' : (t.status === 'IN_PROGRESS' ? 'בעבודה' : (t.status === 'CLOSED' ? 'סגור' : 'פתוח')),
        worker: t.worker?.name || '',
        team: t.team?.name || '',
        timestamp: t.createdAt.getTime(),
        dateStr: `${String(t.createdAt.getDate()).padStart(2, '0')}/${String(t.createdAt.getMonth() + 1).padStart(2, '0')}/${t.createdAt.getFullYear()} ${String(t.createdAt.getHours()).padStart(2, '0')}:${String(t.createdAt.getMinutes()).padStart(2, '0')}`,
      };
    });

    const filteredTasks = tasks.filter(t => !t.defect.includes('הכל תקין'));
    return NextResponse.json({ tasks: filteredTasks });
  }

  if (action === 'getReports') {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {
      tenantId,
      status: { in: ['COMPLETED', 'CLOSED'] }
    };

    if (startDate && endDate) {
      let start = new Date(startDate);
      let end = new Date(endDate);
      
      if (start > end) {
        const temp = start;
        start = end;
        end = temp;
      }
      
      end.setHours(23, 59, 59, 999);
      filters.createdAt = {
        gte: start,
        lte: end
      };
    }

    const tasksDb = await prisma.task.findMany({
      where: filters,
      include: {
        department: true,
        system: true,
        team: true,
        worker: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const tasks = tasksDb.map(t => {
      const isQr = t.customDefectName?.includes('דיווח מהמחלקה') || t.customDefectName?.includes('תקלה חדשה') || t.inspectorName?.includes('צוות');
      return {
        id: t.id,
        sheet: t.team?.name || (isQr ? 'QR' : 'כללי'),
        dept: t.department?.name || 'כללי',
        department: t.department?.name || 'כללי',
        room: t.room,
        system: t.system?.name || t.customDefectName || 'אחר',
        defect: t.system?.name || t.customDefectName || 'אחר',
        action: t.actionType === 'REPAIR' ? 'Ремонт' : (t.actionType === 'REPLACE' ? 'Замена' : ''),
        inspector: t.inspectorName || 'מנהל',
        notes: t.notes || '',
        comment: t.notes || '',
        photo: t.photoUrl || '',
        afterPhoto: t.afterPhotoUrl || '',
        status: t.status === 'NEW' ? 'פתוח' : (t.status === 'IN_PROGRESS' ? 'בעבודה' : 'הושלם'),
        worker: t.worker?.name || '',
        team: t.team?.name || '',
        timestamp: t.createdAt.getTime(),
        dateStr: `${String(t.createdAt.getDate()).padStart(2, '0')}/${String(t.createdAt.getMonth() + 1).padStart(2, '0')}/${t.createdAt.getFullYear()} ${String(t.createdAt.getHours()).padStart(2, '0')}:${String(t.createdAt.getMinutes()).padStart(2, '0')}`,
      };
    });

    const filteredTasks = tasks.filter(t => !t.defect.includes('הכל תקין'));
    return NextResponse.json({ tasks: filteredTasks });
  }

  if (action === 'GET_ALL_TASKS') {
    const tasksDb = await prisma.task.findMany({
      where: { tenantId },
      include: {
        department: true,
        system: true,
        team: true,
        worker: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const tasks = tasksDb.map(t => {
      const isQr = Boolean(
        t.team?.name === 'QR' ||
        t.department?.name === 'QR' ||
        t.inspectorName?.includes('(QR)') ||
        t.inspectorName?.includes('צוות') ||
        t.customDefectName?.includes('דיווח') ||
        t.customDefectName?.includes('תקלה חדשה') ||
        t.room?.includes(' / ')
      );

      let resolvedDept = t.department?.name || 'כללי';
      let resolvedRoom = t.room;
      if (resolvedDept === 'QR' && t.room && t.room.includes(' / ')) {
        const parts = t.room.split(' / ');
        resolvedDept = parts[0];
        resolvedRoom = parts.slice(1).join(' / ') || parts[0];
      }

      return {
        id: t.id,
        isQr,
        sheet: t.team?.name || (isQr ? 'QR' : 'כללי'),
        dept: resolvedDept,
        department: resolvedDept,
        room: resolvedRoom,
        system: t.system?.name || t.customDefectName || 'אחר',
        defect: t.system?.name || t.customDefectName || 'אחר',
        inspector: t.inspectorName || 'מנהל',
        comment: t.notes || '',
        status: t.status === 'NEW' ? 'פתוח' : (t.status === 'IN_PROGRESS' ? 'בעבודה' : (t.status === 'CLOSED' ? 'סגור' : 'הושלם')),
        worker: t.worker?.name || '',
        team: t.team?.name || '',
        timestamp: t.createdAt.getTime(),
        dateStr: `${String(t.createdAt.getDate()).padStart(2, '0')}/${String(t.createdAt.getMonth() + 1).padStart(2, '0')}/${t.createdAt.getFullYear()} ${String(t.createdAt.getHours()).padStart(2, '0')}:${String(t.createdAt.getMinutes()).padStart(2, '0')}`,
      };
    });
    return NextResponse.json({ tasks });
  }


  if (action === 'getMonthlyStats') {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start.getTime());
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    const tasksDb = await prisma.task.findMany({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'CLOSED'] },
        createdAt: { gte: start, lte: end },
        OR: [
          { customDefectName: null },
          { customDefectName: { not: 'הכל תקין (אין דיווחי תקלות)' } }
        ]
      },
      include: {
        team: true,
        worker: true
      }
    });

    const teamsMap: Record<string, number> = {};
    const workersMap: Record<string, number> = {};

    tasksDb.forEach(t => {
      if (t.team?.name) {
        teamsMap[t.team.name] = (teamsMap[t.team.name] || 0) + 1;
      }
      if (t.worker?.name) {
        workersMap[t.worker.name] = (workersMap[t.worker.name] || 0) + 1;
      }
    });

    const teamsStats = Object.entries(teamsMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const workersStats = Object.entries(workersMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return NextResponse.json({ teamsStats, workersStats });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(request: Request, props: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await props.params;
    const tenantId = params.tenantId;
    const body = await request.json();
    const { action } = body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || !['ACTIVE', 'FREE', 'TRIAL', 'UNPAID'].includes(tenant.status)) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 403 });
    }

    const normalizedQr = getNormalizedQrSettings(tenant);

    // Security Gate: Require Admin JWT for all administrative POST actions
    const PUBLIC_OR_FIELD_ACTIONS = new Set([
      'ADD_PERSONNEL_TASK',
      'GET_WORKER_TASKS',
      'WORKER_MARK_COMPLETED',
      'VERIFY_INSPECTOR',
      'FINISH_DEPT',
      'REQUEST_SALES_CONTACT'
    ]);
    const isInspectorRoomCheck = Boolean(body.items && Array.isArray(body.items) && !action);

    if (!isInspectorRoomCheck && (!action || !PUBLIC_OR_FIELD_ACTIONS.has(action))) {
      const isAdmin = await verifyAdminAuth(request, tenantId);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized. Admin authentication required.' }, { status: 401 });
      }
    }

    // Inspector PWA Authorization & Device Limit Check
    const verifyInspectorDeviceAndPin = async (pinInput?: string, deviceId?: string, inspectorName?: string) => {
      if (!normalizedQr.requireInspectorPin) {
        return { ok: true };
      }
      const cleanPin = String(pinInput || '').trim();
      if (!cleanPin || cleanPin !== String(normalizedQr.inspectorPin).trim()) {
        return {
          ok: false,
          code: 'INVALID_INSPECTOR_PIN',
          message: 'קוד גישה (PIN) למפקח שגוי או חסר / Неверный код доступа инспектора (PIN)'
        };
      }

      if (deviceId) {
        const maxAllowed = tenant.status === 'FREE' ? 999 : (tenant.maxInspectors || 1);
        const devices: any[] = Array.isArray(normalizedQr.inspectorDevices) ? [...normalizedQr.inspectorDevices] : [];
        const existingIdx = devices.findIndex((d: any) => d.deviceId === deviceId);

        if (existingIdx >= 0) {
          devices[existingIdx] = {
            ...devices[existingIdx],
            inspectorName: inspectorName || devices[existingIdx].inspectorName || 'מפקח',
            lastSeen: new Date().toISOString()
          };
        } else {
          if (devices.length >= maxAllowed) {
            return {
              ok: false,
              code: 'MAX_INSPECTORS_LIMIT',
              message: `הגעת למגבלת המפקחים בחבילה שלך (${maxAllowed}). מנהל המערכת יכול לאפס מכשירים בחלון "Inspektor QR".`
            };
          }
          devices.push({
            deviceId,
            inspectorName: inspectorName || 'מפקח',
            addedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          });
        }

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            qrSettings: {
              ...normalizedQr,
              inspectorDevices: devices
            } as any
          }
        });
      }

      return { ok: true };
    };

    if (action === 'VERIFY_INSPECTOR') {
      const { inspectorPin, deviceId, inspectorName } = body;
      const check = await verifyInspectorDeviceAndPin(inspectorPin, deviceId, inspectorName);
      if (!check.ok) {
        return NextResponse.json({ status: 'error', error: check.code, message: check.message }, { status: 403 });
      }
      return NextResponse.json({ status: 'success', tenantName: tenant.name });
    }

    if (action === 'RESET_INSPECTOR_DEVICES') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          qrSettings: {
            ...normalizedQr,
            inspectorDevices: []
          } as any
        }
      });
      return NextResponse.json({ status: 'success', inspectorDevices: [] });
    }

  // Handle Inspector Room Defects (has items array, might not have explicit action)
  if (body.items && Array.isArray(body.items)) {
    const authCheck = await verifyInspectorDeviceAndPin(body.inspectorPin, body.deviceId, body.inspector);
    if (!authCheck.ok) {
      return NextResponse.json({ error: authCheck.code, message: authCheck.message }, { status: 403 });
    }

    if (tenant.status === 'TRIAL') {
      const taskCount = await prisma.task.count({ where: { tenantId } });
      if (taskCount >= 5) {
        return NextResponse.json({ error: 'TRIAL_LIMIT', message: 'Достигнут лимит в 5 проверок для TRIAL версии.' }, { status: 403 });
      }
    }

    const { inspector, department, room, items } = body;
    
    // Auto-create/find Department
    let dept = await prisma.department.findFirst({ where: { tenantId, name: department } });
    if (!dept) {
      dept = await prisma.department.create({ data: { tenantId, name: department } });
    }

    if (items.length === 0) {
      // Create a dummy task for "All Good" so the dot appears in the calendar
      await prisma.task.create({
        data: {
          tenantId,
          departmentId: dept.id,
          systemId: null,
          customDefectName: 'הכל תקין (אין דיווחי תקלות)',
          room: String(room),
          actionType: 'REPAIR',
          status: 'COMPLETED', // Closed automatically so it doesn't appear in Open Tasks
          notes: '',
          photoUrl: null,
          inspectorName: inspector,
          teamId: null // No specific team
        }
      });
    } else {
      // Create Tasks
      for (const item of items) {
        const { name, score, comment, photoBase64 } = item;
        
        // Find System across the whole tenant template (created by admin)
        let sys = await prisma.system.findFirst({ where: { tenantId, name } });

        let teamId = sys?.autoAssignTeamId;
        if (!teamId) {
          let defTeam = await prisma.team.findFirst({ where: { tenantId, name: 'כללי' } });
          if (!defTeam) defTeam = await prisma.team.create({ data: { tenantId, name: 'כללי' } });
          teamId = defTeam.id;
        }

        const finalPhotoUrl = await uploadToImgBB(photoBase64);

        await prisma.task.create({
          data: {
            tenantId,
            departmentId: dept.id,
            systemId: sys ? sys.id : null,
            customDefectName: sys ? null : name,
            room: String(room),
            actionType: score == 1 ? 'REPLACE' : 'REPAIR',
            status: 'NEW',
            notes: comment || '',
            photoUrl: finalPhotoUrl,
            inspectorName: inspector,
            teamId: teamId
          }
        });
      }
    }

    return NextResponse.json({ status: 'success' });
  }

  if (action === 'ADD_PERSONNEL_TASK') {
    if (tenant.status === 'TRIAL') {
      const taskCount = await prisma.task.count({ where: { tenantId } });
      if (taskCount >= 5) {
        return NextResponse.json({ error: 'TRIAL_LIMIT', message: 'Достигнут лимит в 5 проверок для TRIAL версии.' }, { status: 403 });
      }
    }
    const { reporterName, department, room, sheetName, defect, comment, photoBase64, language } = body;
    
    let translatedComment = comment || '';
    if (translatedComment) {
      translatedComment = await translateCached(translatedComment, 'he');
    }

    const realDeptName = (department && department !== "Unknown" && department !== "לא ידוע") ? department : "כללי";
    let dept = await prisma.department.findFirst({ where: { tenantId, name: realDeptName } });
    if (!dept) dept = await prisma.department.create({ data: { tenantId, name: realDeptName } });
    
    let qrTeam = await prisma.team.findFirst({ where: { tenantId, name: 'QR' } });
    if (!qrTeam) qrTeam = await prisma.team.create({ data: { tenantId, name: 'QR' } });

    const sysName = defect || sheetName || 'אחר';
    const [sys, teamsDb, workersDb] = await Promise.all([
      prisma.system.findFirst({ where: { tenantId, name: sysName } }),
      prisma.team.findMany({ where: { tenantId } }),
      prisma.user.findMany({ where: { tenantId, role: 'WORKER' } })
    ]);

    // Resolve target brigade & automatic QR duty worker assignment
    const matchedBrigade = sys?.autoAssignTeamId
      ? teamsDb.find(t => t.id === sys.autoAssignTeamId)
      : matchTeamByQrCategory(sheetName || sysName, teamsDb);

    let assignedWorker: { id: string; name: string; teamId: string | null } | null = null;
    const dutyIds = new Set<string>(normalizedQr.qrDutyWorkerIds || []);
    const dutyWorkers = workersDb.filter(w => dutyIds.has(w.id));

    if (normalizedQr.autoAssignQrToWorker && dutyWorkers.length > 0) {
      // 1. Check if there is a designated QR duty worker in the matched brigade
      if (matchedBrigade) {
        assignedWorker = dutyWorkers.find(w => w.teamId === matchedBrigade.id) || null;
      }
      // 2. Fallback: Check if there is a designated QR duty worker in the 'QR' or 'כללי' brigade
      if (!assignedWorker) {
        const generalTeamIds = new Set(
          teamsDb.filter(t => t.name === 'QR' || t.name === 'כללי').map(t => t.id)
        );
        assignedWorker = dutyWorkers.find(w => w.teamId && generalTeamIds.has(w.teamId)) || null;
      }
      // 3. Fallback: If the organization designated a single QR duty worker overall, route to them
      if (!assignedWorker && dutyWorkers.length === 1) {
        assignedWorker = dutyWorkers[0];
      }
    }

    const finalTeamId = assignedWorker?.teamId || matchedBrigade?.id || qrTeam.id;
    const finalPhotoUrl = await uploadToImgBB(photoBase64);

    await prisma.task.create({
      data: {
        tenantId,
        departmentId: dept.id,
        systemId: sys ? sys.id : null,
        customDefectName: sys ? null : sysName,
        room: String(room || "כללי"),
        actionType: 'REPAIR', 
        status: assignedWorker ? 'IN_PROGRESS' : 'NEW',
        workerId: assignedWorker ? assignedWorker.id : null,
        isSentToApp: Boolean(assignedWorker),
        notes: translatedComment,
        photoUrl: finalPhotoUrl || null,
        inspectorName: reporterName ? `צוות (QR): ${reporterName}` : 'צוות (QR): דיווח מהשטח',
        teamId: finalTeamId
      }
    });

    let message = "🚨 *דווח על תקלה חדשה מהשטח (QR)!*\n\n";
    if (reporterName) message += `👤 *מדווח:* ${reporterName}\n`;
    message += `🏢 *מחלקה:* ${department || "לא הוגדרה מחלקה"}\n`;
    message += `🚪 *חדר/מיקום:* ${room || "-"}\n`;
    message += `📋 *סיווג:* ${sheetName || "כללי"}\n`;
    if (assignedWorker) {
      message += `⚡ *נותב אוטומטית לעובד אחראי:* ${assignedWorker.name} (WorkerApp)\n`;
    }
    message += `💬 *הערות:* ${translatedComment || "-"}\n`;
    if (finalPhotoUrl) message += `\n 📷 [תמונה מצורפת](<${finalPhotoUrl}>)`;
    await sendTelegram(message, tenant.telegramBotToken, tenant.telegramChatId);

    return NextResponse.json({ status: 'success', assignedWorker: assignedWorker?.name || null });
  }

    if (action === 'DELETE_TASK') {
      const { taskId } = body;
      if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
      
      // Verify task belongs to tenant
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      await prisma.task.delete({ where: { id: taskId } });
      return NextResponse.json({ status: 'success' });
    }

    if (action === 'CLEANUP_TASKS') {
      const { days } = body;
      if (typeof days !== 'number' || days < 1) return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await prisma.task.deleteMany({
        where: {
          tenantId: tenantId,
          status: 'CLOSED',
          updatedAt: {
            lt: cutoffDate
          }
        }
      });
      
      return NextResponse.json({ status: 'success', deletedCount: result.count });
    }

  if (action === 'FINISH_DEPT') {
    const authCheck = await verifyInspectorDeviceAndPin(body.inspectorPin, body.deviceId, body.inspector);
    if (!authCheck.ok) {
      return NextResponse.json({ error: authCheck.code, message: authCheck.message }, { status: 403 });
    }
    const { reportText } = body;
    if (reportText) {
      await sendTelegram(reportText, tenant.telegramBotToken, tenant.telegramChatId);
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_TEAMS') {
    const teams = body.teams || [];
    
    if (tenant.status === 'TRIAL' && teams.length > 2) {
      return NextResponse.json({ error: 'TRIAL_LIMIT', message: 'У вас тестовая версия (TRIAL). Доступно только 2 бригады.' }, { status: 403 });
    }
    
    // Fetch all current teams
    const currentTeams = await prisma.team.findMany({ where: { tenantId } });
    
    for (const ct of currentTeams) {
      if (!teams.includes(ct.name) && ct.name !== 'QR') {
        // Unlink tasks
        await prisma.task.updateMany({ where: { teamId: ct.id }, data: { teamId: null } });
        // Unlink systems
        await prisma.system.updateMany({ where: { autoAssignTeamId: ct.id }, data: { autoAssignTeamId: null } });
        // Delete team
        await prisma.team.delete({ where: { id: ct.id } });
      }
    }

    const baseTime = Date.now();
    for (let i = 0; i < teams.length; i++) {
      const tName = teams[i];
      const ext = await prisma.team.findFirst({ where: { tenantId, name: tName } });
      const sequentialTime = new Date(baseTime + i * 1000);
      if (!ext) {
        await prisma.team.create({ data: { tenantId, name: tName, createdAt: sequentialTime } });
      } else {
        await prisma.team.update({ where: { id: ext.id }, data: { createdAt: sequentialTime } });
      }
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_WORKERS') {
    const workersList: { id?: string, name: string, teamId?: string | null, isQrDuty?: boolean }[] = body.workers || [];
    const autoAssignQrToWorker = body.autoAssignQrToWorker;
    
    if (tenant.status === 'TRIAL' && workersList.length > 1) {
      return NextResponse.json({ error: 'TRIAL_LIMIT', message: 'У вас тестовая версия (TRIAL). Доступен только 1 сотрудник.' }, { status: 403 });
    }
    
    // Find existing workers
    const currentWorkers = await prisma.user.findMany({ where: { tenantId, role: 'WORKER' }});
    
    // Keep a set of IDs/Names we are keeping
    const keepingIds = new Set(workersList.filter(w => w.id).map(w => w.id));
    const keepingNames = new Set(workersList.map(w => w.name)); // fallback for ones without ID

    // For any current worker not in the new list, remove tasks assignment and delete
    for (const cw of currentWorkers) {
      if (!keepingIds.has(cw.id) && !keepingNames.has(cw.name)) {
        await prisma.task.updateMany({ where: { workerId: cw.id }, data: { workerId: null } });
        await prisma.user.delete({ where: { id: cw.id } });
      }
    }

    const savedDutyWorkerIds: string[] = [];
    const savedDutyByTeam: Record<string, string> = {};

    // Upsert the remaining workers
    for (const wData of workersList) {
      let savedWorkerId = wData.id || '';
      const resolvedTeamId = wData.teamId || null;

      if (wData.id) {
        // Update existing
        const updated = await prisma.user.update({
          where: { id: wData.id },
          data: { name: wData.name, teamId: resolvedTeamId }
        });
        savedWorkerId = updated.id;
      } else {
        // Find by name just in case
        const ext = await prisma.user.findFirst({ where: { tenantId, name: wData.name, role: 'WORKER' }});
        if (ext) {
          const updated = await prisma.user.update({
            where: { id: ext.id },
            data: { teamId: resolvedTeamId }
          });
          savedWorkerId = updated.id;
        } else {
          // Create new
          const created = await prisma.user.create({
            data: { tenantId, name: wData.name, role: 'WORKER', teamId: resolvedTeamId }
          });
          savedWorkerId = created.id;
        }
      }

      if (wData.isQrDuty && savedWorkerId) {
        savedDutyWorkerIds.push(savedWorkerId);
        if (resolvedTeamId) {
          savedDutyByTeam[resolvedTeamId] = savedWorkerId;
        }
      }
    }

    // Persist QR duty workers & auto-assign toggle inside tenant.qrSettings
    const updatedQrSettings = {
      ...normalizedQr,
      qrDutyWorkerIds: savedDutyWorkerIds,
      dutyWorkersByTeam: savedDutyByTeam,
      ...(autoAssignQrToWorker !== undefined ? { autoAssignQrToWorker: Boolean(autoAssignQrToWorker) } : {})
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { qrSettings: updatedQrSettings as any }
    });
    
    return NextResponse.json({ status: 'success', qrSettings: updatedQrSettings });
  }

  if (action === 'SAVE_CATEGORIES') {
    const categories: Record<string, string[]> = body.categories || {};
    const systemTeams: Record<string, string> = body.systemTeams || {};

    if (tenant.status === 'TRIAL' && Object.keys(categories).length > 1) {
      return NextResponse.json({ error: 'TRIAL_LIMIT', message: 'У вас тестовая версия (TRIAL). Доступен только 1 отдел.' }, { status: 403 });
    }

    // First, sync Areas (Categories) and Systems
    const activeAreaNames = Object.keys(categories);
    const currentAreas = await prisma.area.findMany({ where: { tenantId }, include: { systems: true } });
    
    for (const ca of currentAreas) {
      if (!activeAreaNames.includes(ca.name)) {
        // Delete systems of this area first
        for (const sys of ca.systems) {
          await prisma.task.updateMany({ where: { systemId: sys.id }, data: { systemId: null } });
          await prisma.system.delete({ where: { id: sys.id } });
        }
        await prisma.task.updateMany({ where: { areaId: ca.id }, data: { areaId: null } });
        await prisma.area.delete({ where: { id: ca.id } });
      } else {
        // Area exists, check its systems
        const activeSystemNames = categories[ca.name] || [];
        for (const sys of ca.systems) {
          if (!activeSystemNames.includes(sys.name)) {
            await prisma.task.updateMany({ where: { systemId: sys.id }, data: { systemId: null } });
            await prisma.system.delete({ where: { id: sys.id } });
          }
        }
      }
    }

    // Now insert/update what's passed
    for (const [areaName, systems] of Object.entries(categories)) {
      let area = await prisma.area.findFirst({ where: { tenantId, name: areaName } });
      if (!area) {
        area = await prisma.area.create({ data: { tenantId, name: areaName } });
      }

      for (const sysName of systems) {
        let sys = await prisma.system.findFirst({ where: { tenantId, areaId: area.id, name: sysName } });

        let teamId = null;
        if (systemTeams[sysName]) {
          const team = await prisma.team.findFirst({ where: { tenantId, name: systemTeams[sysName] } });
          if (team) teamId = team.id;
        }

        if (!sys) {
          await prisma.system.create({ data: { tenantId, areaId: area.id, name: sysName, autoAssignTeamId: teamId } });
        } else {
          await prisma.system.update({ where: { id: sys.id }, data: { autoAssignTeamId: teamId } });
        }
      }
    }
    return NextResponse.json({ status: 'success' });
  }
  
    if (action === 'SAVE_QR_SETTINGS') {
      const incoming = body.qrSettings || {};
      const mergedQrSettings = {
        ...normalizedQr,
        ...incoming
      };
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { qrSettings: mergedQrSettings as any }
      });
      return NextResponse.json({ status: 'success', qrSettings: mergedQrSettings });
    }

  if (action === 'SAVE_INTEGRATIONS') {
    const { telegramBotToken, telegramChatId, whatsappInstance, whatsappToken } = body;
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        telegramBotToken: telegramBotToken || null,
        telegramChatId: telegramChatId || null,
        whatsappInstance: whatsappInstance || null,
        whatsappToken: whatsappToken || null,
      }
    });
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'UNMARK_PRINTED') {
    const ids = (body.tasks || []).map((t: any) => t.id).filter(Boolean);
    if (ids.length > 0) {
      await prisma.task.updateMany({
        where: { tenantId, id: { in: ids } },
        data: { status: 'NEW', workerId: null, isSentToApp: false }
      });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'MOVE_TASK') {
    const { taskId, teamName } = body;
    const dbTask = await prisma.task.findFirst({ where: { tenantId, id: taskId } });
    if (dbTask && teamName) {
      let team = await prisma.team.findFirst({ where: { tenantId, name: teamName } });
      if (!team) team = await prisma.team.create({ data: { tenantId, name: teamName } });
      await prisma.task.update({
        where: { id: taskId },
        data: { teamId: team.id }
      });
    }
    const teamsDb = await prisma.team.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    const teamsData = teamsDb.map(t => ({ id: t.id, name: t.name }));
    return NextResponse.json({ status: 'success', teams: teamsData });
  }

  if (action === 'EDIT_DEFECT') {
    const { taskId, newDefect } = body;
    const dbTask = await prisma.task.findFirst({ where: { tenantId, id: taskId } });
    if (dbTask) {
      await prisma.task.update({
        where: { id: taskId },
        data: { notes: newDefect }
      });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'CLOSE_TASK') {
    const { id, room, tasks } = body;
    
    if (tasks && Array.isArray(tasks)) {
      for (const t of tasks) {
        await prisma.task.updateMany({
          where: { tenantId, id: t.id },
          data: { status: 'CLOSED', photoUrl: null, afterPhotoUrl: null }
        });
      }
      return NextResponse.json({ status: 'success' });
    }

    let dbTask = null;
    if (id) {
      dbTask = await prisma.task.findUnique({ where: { id } });
    } else if (room) {
      dbTask = await prisma.task.findFirst({
        where: { tenantId, room: String(room), status: { in: ['NEW', 'IN_PROGRESS', 'COMPLETED'] } }
      });
    }
    
    if (dbTask) {
        await prisma.task.update({
          where: { id: dbTask.id },
          data: { 
            status: 'CLOSED',
            photoUrl: null,
            afterPhotoUrl: null
          }
        });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'MARK_PRINTED') {
    if (tenant.status === 'UNPAID') {
      return NextResponse.json({ error: 'UNPAID_LIMIT', message: 'Необходимо оплатить сервис для продолжения работы.' }, { status: 403 });
    }
    const { tasks, worker } = body;
    let workerId = null;
    if (worker) {
      const w = await prisma.user.findFirst({ where: { tenantId, name: worker, role: 'WORKER' } });
      if (w) workerId = w.id;
    }
    const ids = (tasks || []).map((t: any) => t.id).filter(Boolean);
    if (ids.length > 0) {
      await prisma.task.updateMany({
        where: { tenantId, id: { in: ids } },
        data: { status: 'IN_PROGRESS', workerId }
      });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'TRANSLATE_TASKS') {
    if (tenant.status === 'UNPAID') {
      return NextResponse.json({ error: 'UNPAID_LIMIT', message: 'Необходимо оплатить сервис для продолжения работы.' }, { status: 403 });
    }
    const { targetLang, tasks } = body;
    if (!targetLang || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
    }
    
    const translateText = async (text: string): Promise<string> => {
      if (!text || !text.trim()) return text || '';
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`, {
          signal: AbortSignal.timeout(3000)
        });
        const data = await res.json();
        return data?.[0]?.map((item: any) => item[0])?.join('') || text;
      } catch (e) {
        return text;
      }
    };

    const translations = await Promise.all(
      tasks.map(async (t: any) => {
        const [trDefect, trComment] = await Promise.all([
          t.defect ? translateText(t.defect) : Promise.resolve(''),
          t.comment ? translateText(t.comment) : Promise.resolve('')
        ]);

        return {
          id: t.id,
          defect: trDefect || t.defect || '',
          comment: trComment || t.comment || '',
          actT: t.actT === 'החלפה' ? (targetLang==='ru'?'Замена':(targetLang==='ar'?'استبدال':'Replace')) : (targetLang==='ru'?'Ремонт':(targetLang==='ar'?'إصلاح':'Repair'))
        };
      })
    );
    
    const labelsMap: Record<string, any> = {
        'ru': { room: 'Комната: ', name: 'Имя: ', date: 'Дата: ', sign: 'Подпись: ' },
        'en': { room: 'Room: ', name: 'Name: ', date: 'Date: ', sign: 'Signature: ' },
        'ar': { room: 'غرفة: ', name: 'الاسم: ', date: 'تاريخ: ', sign: 'توقيع: ' }
    };
    const labels = labelsMap[targetLang] || { room: 'חדר: ', name: 'שם: ', date: 'תאריך: ', sign: 'חתימה: ' };
    
    if (translations.length > 0) {
        (translations[0] as any).labels = labels;
    }
    
    return NextResponse.json({ status: 'success', translations });
  }

  if (action === 'UPDATE_TASK_COMMENT') {
    const { id, comment } = body;
    if (id && comment !== undefined) {
      await prisma.task.update({
        where: { id },
        data: { notes: comment }
      });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'GET_WORKER_TASKS') {
    const { workerId, lang } = body;
    if (!workerId) return NextResponse.json({ error: 'Missing workerId' }, { status: 400 });
    const targetLang = ['he', 'ru', 'ar', 'en'].includes(lang) ? lang : 'he';

    const worker = await prisma.user.findUnique({ 
      where: { id: workerId },
      include: { team: true }
    });
    if (!worker || worker.tenantId !== tenantId) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

    const whereClause: any = {
      tenantId,
      status: { in: ['NEW', 'IN_PROGRESS'] },
      isSentToApp: true,
      OR: [
        { workerId: worker.id }
      ]
    };
    
    if (worker.teamId) {
      whereClause.OR.push({ teamId: worker.teamId, workerId: null });
    }

    const tasksDb = await prisma.task.findMany({
      where: whereClause,
      include: {
        department: true,
        area: true,
        system: true,
        team: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const rawTeamName = worker.team?.name || '';
    const trWorkerTeamName = targetLang !== 'he' && rawTeamName ? await translateCached(rawTeamName, targetLang) : rawTeamName;

    const tasks = await Promise.all(tasksDb.map(async (t) => {
      // 1. Resolve Department and Room (including legacy QR "Dept / Room" format)
      let origDept = t.department?.name || '';
      let origRoom = t.room || '';
      if ((origDept === 'QR' || !origDept) && origRoom.includes(' / ')) {
        const parts = origRoom.split(' / ');
        origDept = parts[0];
        origRoom = parts.slice(1).join(' / ');
      }
      if (!origDept) origDept = 'כללי';

      const origArea = t.area?.name || '';
      const origSystem = t.system?.name || '';
      const origCustomDefect = t.customDefectName || '';
      const origInspector = t.inspectorName || '';

      // Combine system + customDefectName so neither is ever lost
      let combinedDefectOrig = origSystem;
      if (origCustomDefect) {
        if (!combinedDefectOrig) {
          combinedDefectOrig = origCustomDefect;
        } else if (origCustomDefect !== origSystem && !origCustomDefect.includes('דיווח מהמחלקה')) {
          combinedDefectOrig = `${origSystem} — ${origCustomDefect}`;
        }
      }
      if (!combinedDefectOrig) combinedDefectOrig = 'משימת אחזקה';

      const isQr = Boolean(
        origCustomDefect.includes('דיווח מהמחלקה') ||
        origCustomDefect.includes('תקלה חדשה') ||
        origInspector.includes('(QR)') ||
        origInspector.includes('צוות') ||
        t.department?.name === 'QR'
      );

      // 2. Parse notes to separate Manager Rework instructions, Worker history, and Original description
      const rawNotes = t.notes || '';
      const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);
      const reworkLines: string[] = [];
      const generalLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('[הוחזר לתיקון') || line.startsWith('[ДОРАБОТКА')) {
          const cleanRework = line.replace(/^\[.*?\]:\s*/, '').trim();
          if (cleanRework) reworkLines.push(cleanRework);
        } else {
          const cleanGeneral = line
            .replace(/^\[עובד\]:\s*/, '🛠️ ')
            .replace(/^\[מנהל\]:\s*/, '👨‍💼 ');
          generalLines.push(cleanGeneral);
        }
      }

      const isRework = reworkLines.length > 0 || rawNotes.includes('[הוחזר לתיקון');
      const origReworkNote = reworkLines.join('\n');
      const origGeneralNotes = generalLines.join('\n');

      // 3. Translate all fields into the worker's browser language in parallel
      const [
        trDept,
        trRoom,
        trArea,
        trSystem,
        trCustomDefect,
        trDefect,
        trGeneralNotes,
        trReworkNote,
        trInspector
      ] = await Promise.all([
        translateCached(origDept, targetLang),
        translateCached(origRoom, targetLang),
        origArea ? translateCached(origArea, targetLang) : Promise.resolve(''),
        origSystem ? translateCached(origSystem, targetLang) : Promise.resolve(''),
        origCustomDefect ? translateCached(origCustomDefect, targetLang) : Promise.resolve(''),
        translateCached(combinedDefectOrig, targetLang),
        origGeneralNotes ? translateCached(origGeneralNotes, targetLang) : Promise.resolve(''),
        origReworkNote ? translateCached(origReworkNote, targetLang) : Promise.resolve(''),
        origInspector ? translateCached(origInspector, targetLang) : Promise.resolve('')
      ]);

      return {
        id: t.id,
        stateKey: `${t.id}_${t.updatedAt.getTime()}`,
        timestamp: t.createdAt.getTime(),
        updatedAt: t.updatedAt.getTime(),
        dateStr: new Date(t.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Jerusalem' }),
        department: trDept || origDept,
        origDepartment: origDept,
        room: trRoom || origRoom,
        origRoom: origRoom,
        area: trArea || origArea,
        origArea: origArea,
        system: trSystem || origSystem,
        customDefectName: trCustomDefect || origCustomDefect,
        defect: trDefect || combinedDefectOrig,
        origDefect: combinedDefectOrig,
        actionType: t.actionType === 'REPLACE' ? 1 : 2,
        notes: trGeneralNotes,
        origNotes: origGeneralNotes,
        reworkNote: trReworkNote,
        origReworkNote: origReworkNote,
        isRework,
        isQr,
        inspector: trInspector || origInspector,
        photoUrl: t.photoUrl || '',
        status: t.status,
        team: trWorkerTeamName || t.team?.name || '',
        workerId: t.workerId
      };
    }));

    // Sort: 1. Rework tasks at top, 2. Urgent QR tasks next, 3. Newest first
    tasks.sort((a, b) => {
      if (Number(b.isRework) !== Number(a.isRework)) return Number(b.isRework) - Number(a.isRework);
      if (Number(b.isQr) !== Number(a.isQr)) return Number(b.isQr) - Number(a.isQr);
      return b.updatedAt - a.updatedAt;
    });

    return NextResponse.json({ 
      status: 'success', 
      tasks, 
      tenantName: tenant.name,
      worker: { 
        id: worker.id, 
        name: worker.name, 
        teamId: worker.teamId, 
        teamName: trWorkerTeamName || rawTeamName 
      } 
    });
  }

  if (action === 'ADMIN_CREATE_TASK') {
    if (tenant.status === 'UNPAID') {
      return NextResponse.json({ error: 'UNPAID_LIMIT', message: 'Необходимо оплатить сервис для продолжения работы.' }, { status: 403 });
    }
    const { department, room, teamName, defect, actionType, comment, photo, workerName } = body;
    if (!room && !defect && !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanDeptName = (department || 'כללי').trim();
    let deptRecord = await prisma.department.findFirst({ where: { tenantId, name: cleanDeptName } });
    if (!deptRecord) {
      deptRecord = await prisma.department.create({ data: { tenantId, name: cleanDeptName } });
    }

    let workerRecord = null;
    if (workerName && workerName.trim()) {
      workerRecord = await prisma.user.findFirst({ where: { tenantId, name: workerName.trim(), role: 'WORKER' } });
    }

    let teamRecord = null;
    if (teamName && teamName.trim()) {
      teamRecord = await prisma.team.findFirst({ where: { tenantId, name: teamName.trim() } });
      if (!teamRecord) {
        teamRecord = await prisma.team.create({ data: { tenantId, name: teamName.trim() } });
      }
    } else if (workerRecord?.teamId) {
      teamRecord = await prisma.team.findUnique({ where: { id: workerRecord.teamId } });
    }

    const finalPhotoUrl = photo ? await uploadToImgBB(photo) : null;

    // Translate defect & comment to Hebrew if written in Russian/English/Arabic so DB stays consistent
    const rawDefect = (defect || 'משימת מנהל').trim();
    const rawComment = (comment || '').trim();
    const [heDefect, heComment] = await Promise.all([
      translateCached(rawDefect, 'he'),
      rawComment ? translateCached(rawComment, 'he') : Promise.resolve('')
    ]);

    const finalDefect = heDefect && heDefect !== rawDefect ? `${heDefect} (${rawDefect})` : rawDefect;
    const finalNotes = heComment && heComment !== rawComment ? `${heComment}\n(${rawComment})` : rawComment;

    const newTask = await prisma.task.create({
      data: {
        tenantId,
        departmentId: deptRecord.id,
        room: String(room || 'כללי').trim(),
        teamId: teamRecord ? teamRecord.id : null,
        customDefectName: finalDefect,
        actionType: Number(actionType) === 1 ? 'REPLACE' : 'REPAIR',
        inspectorName: 'מנהל מערכת',
        notes: finalNotes,
        photoUrl: finalPhotoUrl,
        status: workerRecord ? 'IN_PROGRESS' : 'NEW',
        workerId: workerRecord ? workerRecord.id : null,
        isSentToApp: Boolean(workerRecord)
      }
    });

    return NextResponse.json({ status: 'success', task: newTask });
  }

  if (action === 'REWORK_TASK') {
    const { taskId, workerName, returnToOpen, comment } = body;
    if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

    const dbTask = await prisma.task.findFirst({ where: { tenantId, id: taskId } });
    if (!dbTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    let updatedNotes = dbTask.notes || '';
    if (comment && comment.trim()) {
      const cleanComment = comment.trim();
      const heComment = await translateCached(cleanComment, 'he');
      const formattedComment = heComment && heComment !== cleanComment ? `${heComment} (${cleanComment})` : cleanComment;
      const reworkLine = `[הוחזר לתיקון ע"י מנהל]: ${formattedComment}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n${reworkLine}` : reworkLine;
    } else if (!updatedNotes.includes('[הוחזר לתיקון')) {
      updatedNotes = updatedNotes ? `${updatedNotes}\n[הוחזר לתיקון ע"י מנהל]: נדרשת השלמה / בדיקה חוזרת` : `[הוחזר לתיקון ע"י מנהל]: נדרשת השלמה / בדיקה חוזרת`;
    }

    if (returnToOpen || !workerName) {
      await prisma.task.update({
        where: { id: dbTask.id },
        data: {
          status: 'NEW',
          workerId: null,
          isSentToApp: false,
          afterPhotoUrl: null,
          notes: updatedNotes
        }
      });
    } else {
      const worker = await prisma.user.findFirst({ where: { tenantId, name: workerName, role: 'WORKER' } });
      await prisma.task.update({
        where: { id: dbTask.id },
        data: {
          status: 'IN_PROGRESS',
          workerId: worker ? worker.id : dbTask.workerId,
          teamId: worker?.teamId || dbTask.teamId,
          isSentToApp: true,
          afterPhotoUrl: null,
          notes: updatedNotes
        }
      });
    }

    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SEND_TO_APP') {
    if (tenant.status === 'UNPAID') {
      return NextResponse.json({ error: 'UNPAID_LIMIT', message: 'Необходимо оплатить сервис для продолжения работы.' }, { status: 403 });
    }
    const { taskIds, workerName } = body;
    if (!taskIds || !Array.isArray(taskIds)) return NextResponse.json({ error: 'Missing taskIds' }, { status: 400 });
    
    let workerId = undefined;
    if (workerName) {
      const worker = await prisma.user.findFirst({ where: { tenantId, name: workerName } });
      if (worker) workerId = worker.id;
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds }, tenantId },
      data: { 
        isSentToApp: true,
        status: 'IN_PROGRESS',
        ...(workerId ? { workerId } : {})
      }
    });
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'WORKER_MARK_COMPLETED') {
    const { taskId, workerId, afterPhotoUrl, comment } = body;
    if (!taskId || !workerId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const [task, worker] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.user.findUnique({ where: { id: workerId } })
    ]);
    if (!task || task.tenantId !== tenantId || !worker || worker.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });
    }
    
    const updateData: any = {
      status: 'COMPLETED',
      workerId: workerId // mark that this worker completed it
    };
    if (afterPhotoUrl) updateData.afterPhotoUrl = await uploadToImgBB(afterPhotoUrl);
    
    if (comment) {
      const cleanComment = comment.trim();
      const heComment = await translateCached(cleanComment, 'he');
      const formattedWorkerComment = heComment && heComment !== cleanComment ? `${heComment} (${cleanComment})` : cleanComment;
      updateData.notes = task.notes ? task.notes + '\n[עובד]: ' + formattedWorkerComment : '[עובד]: ' + formattedWorkerComment;
    }

    await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'GET_ALL_TASKS') {
    const tasksDb = await prisma.task.findMany({
      where: { tenantId },
      include: {
        department: true,
        system: true,
        team: true,
        worker: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const tasks = tasksDb.map(t => {
      const isQr = Boolean(
        t.customDefectName?.includes('דיווח מהמחלקה') ||
        t.customDefectName?.includes('תקלה חדשה') ||
        t.inspectorName?.includes('(QR)') ||
        t.inspectorName?.includes('צוות') ||
        t.department?.name === 'QR'
      );
      let resolvedDept = t.department?.name || 'כללי';
      let resolvedRoom = t.room;
      if (resolvedDept === 'QR' && resolvedRoom.includes(' / ')) {
        const parts = resolvedRoom.split(' / ');
        resolvedDept = parts[0];
        resolvedRoom = parts.slice(1).join(' / ');
      }
      return {
        id: t.id,
        isQr,
        sheet: t.team?.name || (isQr ? 'QR' : 'כללי'),
        dept: resolvedDept,
        room: resolvedRoom,
        system: t.system?.name || t.customDefectName || 'אחר',
        defect: t.system?.name || t.customDefectName || 'אחר',
        inspector: t.inspectorName || 'מנהל',
        comment: t.notes || '',
        status: t.status === 'NEW' ? 'פתוח' : (t.status === 'IN_PROGRESS' ? 'בעבודה' : (t.status === 'CLOSED' ? 'סגור' : 'הושלם')),
        worker: t.worker?.name || '',
        team: t.team?.name || '',
        dateStr: `${String(t.createdAt.getDate()).padStart(2, '0')}/${String(t.createdAt.getMonth() + 1).padStart(2, '0')}/${t.createdAt.getFullYear()} ${String(t.createdAt.getHours()).padStart(2, '0')}:${String(t.createdAt.getMinutes()).padStart(2, '0')}`,
      };
    });
    return NextResponse.json({ status: 'success', tasks });
  }

  if (action === 'PROCESS_PAYMENT_RENEWAL') {
    const { planCode, billingCycle, cardDetails } = body;
    if (!planCode) return NextResponse.json({ error: 'Missing planCode' }, { status: 400 });

    const globalConfig = await getGlobalConfig();
    const selectedPlan = globalConfig.plans.find((p: any) => p.code === planCode) || globalConfig.plans[0];
    const amount = billingCycle === 'YEAR' ? (selectedPlan.priceYear || selectedPlan.priceMonth * 10) : selectedPlan.priceMonth;
    const monthsToAdd = billingCycle === 'YEAR' ? 12 : 1;

    // Compute new subscriptionEndsAt
    const now = new Date();
    let baseDate = now;
    if (tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) > now) {
      baseDate = new Date(tenant.subscriptionEndsAt);
    }
    const newEndsAt = new Date(baseDate);
    newEndsAt.setMonth(newEndsAt.getMonth() + monthsToAdd);

    // Update tenant status to ACTIVE, plan, price and subscriptionEndsAt
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'ACTIVE',
        plan: selectedPlan.code,
        price: Number(amount),
        subscriptionEndsAt: newEndsAt,
        maxInspectors: selectedPlan.maxInspectors || 1
      }
    });

    // Record invoice
    try {
      await prisma.invoice.create({
        data: {
          tenantId,
          type: 'INVOICE',
          amount: Number(amount),
          status: 'PAID',
          extraInspectors: 0
        }
      });
    } catch (invErr) {
      console.error('Failed to create invoice record:', invErr);
    }

    return NextResponse.json({
      status: 'success',
      message: 'המנוי חודש בהצלחה!',
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        status: updatedTenant.status,
        plan: updatedTenant.plan,
        price: updatedTenant.price,
        subscriptionEndsAt: updatedTenant.subscriptionEndsAt
      }
    });
  }

  if (action === 'REQUEST_SALES_CONTACT') {
    const { contactName, contactPhone, notes, requestedPlan } = body;
    await prisma.lead.create({
      data: {
        name: contactName || tenant.name,
        phone: contactPhone || tenant.contactPhone || '050-0000000',
        email: tenant.contactEmail || null,
        company: `${tenant.name} (${requestedPlan || tenant.plan}) - ${notes || 'פנייה לחידוש מנוי'}`,
        status: 'NEW'
      }
    });
    return NextResponse.json({ status: 'success', message: 'פנייתך התקבלה בהצלחה, ניצור קשר בהקדם' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Unhandled POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 });
  }
}
