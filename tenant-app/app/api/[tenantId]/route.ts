import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, props: { params: Promise<{ tenantId: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const tenantId = params.tenantId;

  if (tenantId === 'default' || !tenantId) {
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

    return NextResponse.json({ workers, categories, teams, systemTeams });
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

    const tasks = tasksDb.map(t => ({
      id: t.id,
      sheet: t.department?.name || 'כללי',
      department: t.department?.name || 'כללי',
      room: t.room,
      system: t.system?.name || 'אחר',
      defect: t.system?.name || 'אחר',
      action: t.actionType === 'REPAIR' ? 'Ремонт' : (t.actionType === 'REPLACE' ? 'Замена' : ''),
      notes: t.notes || '',
      comment: t.notes || '',
      photo: t.photoUrl || '',
      afterPhoto: t.afterPhotoUrl || '',
      status: t.status === 'IN_PROGRESS' ? 'В работе' : 'Новая',
      worker: t.worker?.name || '',
      team: t.team?.name || '',
      timestamp: t.createdAt.getTime(),
      dateStr: t.createdAt.toLocaleString('ru-RU')
    }));

    return NextResponse.json({ tasks });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(request: Request, props: { params: Promise<{ tenantId: string }> }) {
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

    // Auto-create/find Area (Room)
    let area = await prisma.area.findFirst({ where: { tenantId, name: String(room) } });
    if (!area) {
      area = await prisma.area.create({ data: { tenantId, name: String(room) } });
    }

    // Create Tasks
    for (const item of items) {
      const { name, score, comment, photoBase64 } = item;
      
      // Auto-create/find System (linked to Area)
      let sys = await prisma.system.findFirst({ where: { tenantId, areaId: area.id, name } });
      if (!sys) {
        sys = await prisma.system.create({ data: { tenantId, areaId: area.id, name } });
      }

      await prisma.task.create({
        data: {
          tenantId,
          departmentId: dept.id,
          systemId: sys.id,
          room: String(room),
          actionType: score == 1 ? 'REPLACE' : 'REPAIR',
          status: 'NEW',
          notes: comment || '',
          photoUrl: photoBase64 || null,
          teamId: sys.autoAssignTeamId || null
        }
      });
    }

    return NextResponse.json({ status: 'success' });
  }

  if (action === 'ADD_PERSONNEL_TASK') {
    const { reporterName, department, room, sheetName, defect, comment, photoBase64 } = body;
    
    // Auto-create/find Department
    let dept = await prisma.department.findFirst({ where: { tenantId, name: department } });
    if (!dept) {
      dept = await prisma.department.create({ data: { tenantId, name: department } });
    }

    // Auto-create/find Area (Room)
    let area = await prisma.area.findFirst({ where: { tenantId, name: String(room) } });
    if (!area) {
      area = await prisma.area.create({ data: { tenantId, name: String(room) } });
    }

    // Team (category/sheetName)
    let teamId = null;
    if (sheetName) {
      let team = await prisma.team.findFirst({ where: { tenantId, name: sheetName } });
      if (!team) {
        team = await prisma.team.create({ data: { tenantId, name: sheetName } });
      }
      teamId = team.id;
    }

    // System
    let sys = await prisma.system.findFirst({ where: { tenantId, areaId: area.id, name: defect || 'אחר' } });
    if (!sys) {
      sys = await prisma.system.create({ data: { tenantId, areaId: area.id, name: defect || 'אחר', autoAssignTeamId: teamId } });
    }

    await prisma.task.create({
      data: {
        tenantId,
        departmentId: dept.id,
        systemId: sys.id,
        room: String(room),
        actionType: 'REPAIR', // Default for personnel reports
        status: 'NEW',
        notes: (reporterName ? `От: ${reporterName}\n` : '') + (comment || ''),
        photoUrl: photoBase64 || null,
        teamId: teamId
      }
    });

    return NextResponse.json({ status: 'success' });
  }

  if (action === 'FINISH_DEPT') {
    // const { reportText } = body;
    // TODO: Send reportText to Telegram here
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_TEAMS') {
    const teamsList: string[] = body.teams || [];
    for (const tName of teamsList) {
      await prisma.team.upsert({
        where: { id: 'temp' },
        create: { name: tName, tenantId },
        update: {}
      }).catch(async () => {
        const ext = await prisma.team.findFirst({ where: { tenantId, name: tName }});
        if(!ext) await prisma.team.create({ data: { tenantId, name: tName } });
      });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_WORKERS') {
    const workersList: string[] = body.workers || [];
    for (const wName of workersList) {
      const ext = await prisma.user.findFirst({ where: { tenantId, name: wName, role: 'WORKER' }});
      if(!ext) await prisma.user.create({ data: { tenantId, name: wName, role: 'WORKER' } });
    }
    return NextResponse.json({ status: 'success' });
  }

  if (action === 'SAVE_CATEGORIES') {
    const categories: Record<string, string[]> = body.categories || {};
    const systemTeams: Record<string, string> = body.systemTeams || {};
    
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

  if (action === 'UNMARK_PRINTED') {
    const tasks = body.tasks || [];
    for (const t of tasks) {
      const dbTask = await prisma.task.findFirst({
        where: {
          tenantId,
          room: String(t.room),
          status: 'IN_PROGRESS'
        }
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
