import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Простой хардкод пароль для MVP (в будущем заменим на нормальную авторизацию)
const SUPERADMIN_PASSWORD = "super123";

// Вспомогательная функция для проверки авторизации
function isAuthenticated(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  return token === SUPERADMIN_PASSWORD;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action !== 'AUTH' && !isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    switch (action) {
      case 'AUTH':
        const pwd = searchParams.get('pwd');
        if (pwd === SUPERADMIN_PASSWORD) {
          return NextResponse.json({ success: true, token: SUPERADMIN_PASSWORD });
        }
        return NextResponse.json({ success: false }, { status: 401 });

      case 'DASHBOARD_STATS':
        const totalTenants = await prisma.tenant.count();
        const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
        const totalLeads = await prisma.lead.count();
        const newLeads = await prisma.lead.count({ where: { status: 'NEW' } });
        const totalTasks = await prisma.task.count();
        
        return NextResponse.json({
          success: true,
          stats: { totalTenants, activeTenants, totalLeads, newLeads, totalTasks }
        });

      case 'GET_TENANTS':
        const tenants = await prisma.tenant.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { users: true, tasks: true }
            }
          }
        });
        return NextResponse.json({ success: true, tenants });

      case 'GET_LEADS':
        const leads = await prisma.lead.findMany({
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, leads });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Superadmin GET API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // CREATE_LEAD доступно без авторизации (для лендинга)
    if (action === 'CREATE_LEAD') {
      const { name, phone, email, company } = body;
      if (!name || !phone) return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
      
      const newLead = await prisma.lead.create({
        data: { name, phone, email, company }
      });
      return NextResponse.json({ success: true, lead: newLead });
    }

    // Все остальные POST действия требуют авторизации
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'CREATE_TENANT':
        const { name, plan, price, maxInspectors, contactEmail, contactPhone } = body;
        const tenant = await prisma.tenant.create({
          data: {
            name,
            plan: plan || 'FREE',
            price: Number(price) || 0,
            maxInspectors: Number(maxInspectors) || 1,
            contactEmail,
            contactPhone,
            status: 'ACTIVE'
          }
        });
        return NextResponse.json({ success: true, tenant });

      case 'UPDATE_TENANT':
        const { id, updates } = body;
        const updatedTenant = await prisma.tenant.update({
          where: { id },
          data: updates
        });
        return NextResponse.json({ success: true, tenant: updatedTenant });

      case 'DELETE_TENANT':
        const { tenantIdToDelete } = body;
        // Важно: Prisma не удалит связанное каскадно автоматически, если не настроено CASCADE.
        // Для MVP мы можем просто пометить как BLOCKED, либо удалить все связи.
        // Безопаснее просто заблокировать. Но раз просили "Создание, удаление клиента", 
        // попытаемся удалить. Для этого нужно удалять зависимые сущности.
        
        await prisma.$transaction([
          prisma.task.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.system.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.area.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.department.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.user.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.team.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.qrMapping.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.invoice.deleteMany({ where: { tenantId: tenantIdToDelete } }),
          prisma.tenant.delete({ where: { id: tenantIdToDelete } })
        ]);

        return NextResponse.json({ success: true });

      case 'UPDATE_LEAD_STATUS':
        const { leadId, status } = body;
        const updatedLead = await prisma.lead.update({
          where: { id: leadId },
          data: { status }
        });
        return NextResponse.json({ success: true, lead: updatedLead });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Superadmin POST API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
