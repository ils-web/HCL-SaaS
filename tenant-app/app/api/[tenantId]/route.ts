import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

async function uploadToImgBB(base64Str: string): Promise<string | null> {
  if (!base64Str || base64Str.startsWith('http')) return base64Str || null;
  try {
    const b64Data = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
    const formData = new FormData();
    formData.append('image', b64Data);
    const res = await fetch('https://api.imgbb.com/1/upload?key=a1e675bb6065e233261327255af41c48&expiration=864000', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    return result?.data?.url || null;
  } catch (e) {
    console.error('ImgBB upload error:', e);
    return null;
  }
}

async function sendTelegram(text: string, customChatId?: string | null) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
  
  if (tenant.status !== 'ACTIVE') {
    return NextResponse.json({ error: `Tenant is ${tenant.status}` }, { status: 403 });
  }

  if (action === 'getSettings') {
    // get workers
    const workersDb = await prisma.user.findMany({ where: { tenantId, role: 'WORKER' } });
    const workers = workersDb.map(w => ({ id: w.id, name: w.name, teamId: w.teamId }));

    // get teams
    const teamsDb = await prisma.team.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    const teams = teamsDb.map(t => t.name);
    const teamsData = teamsDb.map(t => ({ id: t.id, name: t.name }));

    // get categories & systemTeams
    const areas = await prisma.area.findMany({
      where: { tenantId },
      include: { systems: { include: { autoAssignTeam: true } } }
    });
    
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
  
    const qrSettings = (tenant as any).qrSettings || { mode: '24/7', start: '08:00', end: '17:00' };

    return NextResponse.json({ workers, categories, teams, teamsData, systemTeams, qrSettings });
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
      status: t.status === 'IN_PROGRESS' ? 'בעבודה' : 'פתוח',
      worker: t.worker?.name || '',
      team: t.team?.name || '',
      timestamp: t.createdAt.getTime(),
      dateStr: `${String(t.createdAt.getDate()).padStart(2, '0')}/${String(t.createdAt.getMonth() + 1).padStart(2, '0')}/${t.createdAt.getFullYear()} ${String(t.createdAt.getHours()).padStart(2, '0')}:${String(t.createdAt.getMinutes()).padStart(2, '0')}`,
    };
    });

    return NextResponse.json({ tasks });
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
    if (!tenant || tenant.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 403 });
    }

  // Handle Inspector Room Defects (has items array, might not have explicit action)
  if (body.items && Array.isArray(body.items)) {
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
            teamId: teamId
          }
        });
      }
    }

    return NextResponse.json({ status: 'success' });
  }

  if (action === 'ADD_PERSONNEL_TASK') {
    const { reporterName, department, room, sheetName, defect, comment, photoBase64, language } = body;
    
    let translatedComment = comment || '';
    if (translatedComment) {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=he&dt=t&q=${encodeURIComponent(translatedComment)}`);
        const data = await res.json();
        translatedComment = data[0].map((item: any) => item[0]).join('');
      } catch (e) {
        console.error('Translation error:', e);
      }
    }

    let dept = await prisma.department.findFirst({ where: { tenantId, name: "QR" } });
    if (!dept) dept = await prisma.department.create({ data: { tenantId, name: "QR" } });
    
    const originalDept = department || "כללי";
    const newRoomString = `${originalDept} / ${room || ""}`.replace(/ \/ $/, "");

    let finalTeamId = null;
    let qrTeam = await prisma.team.findFirst({ where: { tenantId, name: 'QR' } });
    if (!qrTeam) qrTeam = await prisma.team.create({ data: { tenantId, name: 'QR' } });
    finalTeamId = qrTeam.id;

    let sysName = defect || sheetName || 'אחר';
    let sys = await prisma.system.findFirst({ where: { tenantId, name: sysName } });
    if (!sys) {
      let area = await prisma.area.findFirst({ where: { tenantId, name: 'שונות' } });
      if (!area) area = await prisma.area.create({ data: { tenantId, name: 'שונות' } });
      sys = await prisma.system.create({ data: { tenantId, areaId: area.id, name: sysName } });
    }

    const finalPhotoUrl = await uploadToImgBB(photoBase64);

    await prisma.task.create({
      data: {
        tenantId,
        departmentId: dept.id,
        systemId: sys.id,
        room: newRoomString,
        actionType: 'REPAIR', 
        status: 'NEW',
        notes: translatedComment,
        photoUrl: finalPhotoUrl || null,
        inspectorName: reporterName ? `צוות: ${reporterName}` : 'צוות: לא הוגדר שם',
        teamId: finalTeamId
      }
    });

    let message = "🚨 *דווח על תקלה חדשה מהשטח (QR)!*\n\n";
    if (reporterName) message += `👤 *מדווח:* ${reporterName}\n`;
    message += `🏢 *מחלקה:* ${department || "לא הוגדרה מחלקה"}\n`;
    message += `🚪 *חדר/מיקום:* ${room || "-"}\n`;
    message += `📋 *סיווג:* ${sheetName || "כללי"}\n`;
    message += `💬 *הערות:* ${translatedComment || "-"}\n`;
    if (finalPhotoUrl) message += `\n 📷 [תמונה מצורפת](<${finalPhotoUrl}>)`;
    await sendTelegram(message, tenant.telegramChatId);

    return NextResponse.json({ status: 'success' });
  }

  if (action === 'FINISH_DEPT') {
    // const { reportText } = body;
    // TODO: Send reportText to Telegram here
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_TEAMS') {
    const teams = body.teams || [];
    
    // Fetch all current teams
    const currentTeams = await prisma.team.findMany({ where: { tenantId } });
    const currentTeamNames = currentTeams.map(t => t.name);
    
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

    for (const tName of teams) {
      const ext = await prisma.team.findFirst({ where: { tenantId, name: tName } });
      if(!ext) await prisma.team.create({ data: { tenantId, name: tName } });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_WORKERS') {
    const workersList: { id?: string, name: string, teamId?: string | null }[] = body.workers || [];
    
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

    // Upsert the remaining workers
    for (const wData of workersList) {
      if (wData.id) {
        // Update existing
        await prisma.user.update({
          where: { id: wData.id },
          data: { name: wData.name, teamId: wData.teamId || null }
        });
      } else {
        // Find by name just in case
        const ext = await prisma.user.findFirst({ where: { tenantId, name: wData.name, role: 'WORKER' }});
        if (ext) {
          await prisma.user.update({
            where: { id: ext.id },
            data: { teamId: wData.teamId || null }
          });
        } else {
          // Create new
          await prisma.user.create({
            data: { tenantId, name: wData.name, role: 'WORKER', teamId: wData.teamId || null }
          });
        }
      }
    }
    
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_CATEGORIES') {
    const categories: Record<string, string[]> = body.categories || {};
    const systemTeams: Record<string, string> = body.systemTeams || {};

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
      const qrSettings = body.qrSettings || { mode: '24/7', start: '08:00', end: '17:00' };
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { qrSettings: qrSettings as any }
      });
      return NextResponse.json({ status: 'success' });
    }

  if (action === 'SAVE_TELEGRAM_ID') {
    const { telegramChatId } = body;
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { telegramChatId: telegramChatId || null }
    });
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'UNMARK_PRINTED') {
    const tasks = body.tasks || [];
    for (const t of tasks) {
      const dbTask = await prisma.task.findFirst({
        where: { tenantId, id: t.id }
      });
      if (dbTask) {
        await prisma.task.update({
          where: { id: dbTask.id },
          data: { status: 'NEW', workerId: null }
        });
      }
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'CLOSE_TASK') {
    const { room } = body;
    const dbTask = await prisma.task.findFirst({
      where: { tenantId, room: String(room), status: { in: ['NEW', 'IN_PROGRESS', 'COMPLETED'] } }
    });
    if (dbTask) {
        await prisma.task.update({
          where: { id: dbTask.id },
          data: { 
            status: 'CLOSED'
          }
        });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'MARK_PRINTED') {
    const { tasks, worker } = body;
    let workerId = null;
    if (worker) {
      const w = await prisma.user.findFirst({ where: { tenantId, name: worker, role: 'WORKER' } });
      if (w) workerId = w.id;
    }
    for (const t of tasks || []) {
      const dbTask = await prisma.task.findFirst({
        where: { tenantId, id: t.id }
      });
      if (dbTask) {
        await prisma.task.update({
          where: { id: dbTask.id },
          data: { status: 'IN_PROGRESS', workerId }
        });
      }
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'TRANSLATE_TASKS') {
    const { targetLang, tasks } = body;
    if (!targetLang || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
    }
    
    const translations = [];
    for (const t of tasks) {
      let trDefect = t.defect;
      let trComment = t.comment;
      
      try {
        if (trDefect) {
            const r1 = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=${targetLang}&dt=t&q=${encodeURIComponent(trDefect)}`);
            const d1 = await r1.json();
            trDefect = d1[0].map((item) => item[0]).join('');
        }
        if (trComment) {
            const r2 = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=${targetLang}&dt=t&q=${encodeURIComponent(trComment)}`);
            const d2 = await r2.json();
            trComment = d2[0].map((item) => item[0]).join('');
        }
      } catch(e) {
        console.error('Translation error', e);
      }
      
      translations.push({
        id: t.id,
        defect: trDefect,
        comment: trComment,
        actT: t.actT === 'החלפה' ? (targetLang==='ru'?'Замена':(targetLang==='ar'?'استبدال':'Replace')) : (targetLang==='ru'?'Ремонт':(targetLang==='ar'?'إصلاح':'Repair'))
      });
    }
    
    const labels = {
        'ru': { room: 'Комната: ', name: 'Имя: ', date: 'Дата: ', sign: 'Подпись: ' },
        'en': { room: 'Room: ', name: 'Name: ', date: 'Date: ', sign: 'Signature: ' },
        'ar': { room: 'غرفة: ', name: 'الاسم: ', date: 'تاريخ: ', sign: 'توقيع: ' }
    }[targetLang] || { room: 'חדר: ', name: 'שם: ', date: 'תאריך: ', sign: 'חתימה: ' };
    
    if (translations.length > 0) {
        translations[0].labels = labels;
    }
    
    return NextResponse.json({ status: 'success', translations });
  }

  if (action === 'MOVE_TASK') {
    const { id, targetSheet, newTeam } = body;
    const finalTarget = targetSheet || newTeam;
    
    if (id && finalTarget) {
      let team = await prisma.team.findFirst({ where: { tenantId, name: finalTarget } });
      if (!team) team = await prisma.team.create({ data: { tenantId, name: finalTarget } });
      
      await prisma.task.update({
        where: { id },
        data: { teamId: team.id }
      });
    }
    return NextResponse.json({ status: 'success' });
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
    const { workerId } = body;
    if (!workerId) return NextResponse.json({ error: 'Missing workerId' }, { status: 400 });

    const worker = await prisma.user.findUnique({ where: { id: workerId } });
    if (!worker || worker.tenantId !== tenantId) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

    const whereClause: any = {
      tenantId,
      status: { in: ['NEW', 'IN_PROGRESS'] },
      OR: [
        { workerId: worker.id }
      ]
    };
    
    if (worker.teamId) {
      whereClause.OR.push({ teamId: worker.teamId });
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

    const tasks = tasksDb.map(t => ({
      id: t.id,
      dateStr: new Date(t.createdAt).toLocaleString('ru-RU', { timeZone: 'Asia/Jerusalem' }),
      department: t.department?.name || '',
      room: t.room,
      area: t.area?.name || '',
      system: t.system?.name || '',
      customDefectName: t.customDefectName || '',
      defect: t.system?.name || t.customDefectName || '',
      actionType: t.actionType === 'REPLACE' ? 1 : 2,
      notes: t.notes || '',
      photoUrl: t.photoUrl || '',
      status: t.status,
      team: t.team?.name || '',
      workerId: t.workerId
    }));

    return NextResponse.json({ status: 'success', tasks, worker: { id: worker.id, name: worker.name, teamId: worker.teamId } });
  }

  if (action === 'WORKER_MARK_COMPLETED') {
    const { taskId, workerId, afterPhotoUrl, comment } = body;
    if (!taskId || !workerId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    
    const updateData: any = {
      status: 'COMPLETED',
      workerId: workerId // mark that this worker completed it
    };
    if (afterPhotoUrl) updateData.afterPhotoUrl = afterPhotoUrl;
    
    if (comment) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task) {
        updateData.notes = task.notes ? task.notes + '\n[Рабочий]: ' + comment : '[Рабочий]: ' + comment;
      }
    }

    await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });
    return NextResponse.json({ status: 'success' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Unhandled POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 });
  }
}
