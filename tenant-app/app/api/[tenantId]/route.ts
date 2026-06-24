import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

async function sendTelegram(text: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
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
    const workers = workersDb.map(w => w.name);

    // get teams
    const teamsDb = await prisma.team.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
    const teams = teamsDb.map(t => t.name);

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

    return NextResponse.json({ workers, categories, teams, systemTeams, qrSettings });
  }

  if (action === 'getOpenTasks') {
    const tasksDb = await prisma.task.findMany({
      where: { 
        tenantId,
        status: { in: ['NEW', 'IN_PROGRESS'] }
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
      sheet: isQr ? 'QR' : (t.team?.name || 'כללי'),
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
      tenantId
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
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
        sheet: isQr ? 'QR' : (t.team?.name || 'כללי'),
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
          status: 'NEW', // Keep it new so it shows up in Open Tasks
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
    await sendTelegram(message);

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
    const workersList: string[] = body.workers || [];
    
    const currentWorkers = await prisma.user.findMany({ where: { tenantId, role: 'WORKER' }});
    for (const cw of currentWorkers) {
      if (!workersList.includes(cw.name)) {
        await prisma.task.updateMany({ where: { workerId: cw.id }, data: { workerId: null } });
        await prisma.user.delete({ where: { id: cw.id } });
      }
    }

    for (const wName of workersList) {
      const ext = await prisma.user.findFirst({ where: { tenantId, name: wName, role: 'WORKER' }});
      if(!ext) await prisma.user.create({ data: { tenantId, name: wName, role: 'WORKER' } });
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Unhandled POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message || String(error) }, { status: 500 });
  }
}
