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

export const DEFAULT_PLANS = [
  {
    id: "plan_basic",
    code: "BASIC",
    name: "בסיסי (Basic)",
    priceMonth: 350,
    priceYear: 3500,
    description: "מתאים למוסדות קטנים ומחלקות בודדות",
    maxInspectors: 1,
    maxTeams: 2,
    features: [
      "עד 2 צוותי עבודה",
      "מפקח 1 מורשה",
      "הפקת דוחות וכרטיסי עבודה",
      "הדפסה ושליחה ל-Worker App",
      "גיבוי וייצוא נתונים (CSV)"
    ],
    isPopular: false
  },
  {
    id: "plan_pro",
    code: "PRO",
    name: "מקצועי (Pro)",
    priceMonth: 550,
    priceYear: 5500,
    description: "הפתרון המומלץ לבתי מלון, בתי חולים וארגונים",
    maxInspectors: 3,
    maxTeams: 10,
    features: [
      "ללא הגבלת צוותי עבודה",
      "עד 3 מפקחים מורשים",
      "אינטגרציה לטלגרם ו-WhatsApp",
      "דוחות מנהל ופחת מתקדמים",
      "עדיפות בתמיכה טכנית 24/7"
    ],
    isPopular: true
  },
  {
    id: "plan_enterprise",
    code: "ENTERPRISE",
    name: "ארגוני (Enterprise)",
    priceMonth: 850,
    priceYear: 8500,
    description: "לחברות ניהול רשתות ומתחמים מרובים",
    maxInspectors: 10,
    maxTeams: 999,
    features: [
      "ללא הגבלת מפקחים וצוותים",
      "חיבורי API ומערכות צד ג'",
      "התאמה אישית של תבניות דוח",
      "ליווי ומנהל לקוח אישי ייעודי",
      "SLA והתחייבות לזמינות 99.9%"
    ],
    isPopular: false
  }
];

export const DEFAULT_PAYMENT_CONFIG = {
  provider: "CARDCOM", // CARDCOM | TRANZILA | MESHULAM | STRIPE | TEST
  terminalNumber: "",
  apiKey: "",
  apiSecret: "",
  isLive: false,
  currency: "ILS",
  webhookUrl: "",
  description: "מערכת סליקה מאובטחת"
};

export async function getGlobalConfig() {
  try {
    let sys = await prisma.tenant.findFirst({ where: { name: '__SYSTEM_GLOBAL_CONFIG__' } });
    if (!sys) {
      sys = await prisma.tenant.create({
        data: {
          name: '__SYSTEM_GLOBAL_CONFIG__',
          plan: 'SYSTEM',
          status: 'ACTIVE',
          qrSettings: {
            plans: DEFAULT_PLANS,
            paymentConfig: DEFAULT_PAYMENT_CONFIG
          }
        }
      });
    }
    const settings = (sys.qrSettings as any) || {};
    return {
      plans: settings.plans || DEFAULT_PLANS,
      paymentConfig: settings.paymentConfig || DEFAULT_PAYMENT_CONFIG
    };
  } catch (e) {
    console.error('Error fetching global config:', e);
    return { plans: DEFAULT_PLANS, paymentConfig: DEFAULT_PAYMENT_CONFIG };
  }
}

export async function saveGlobalConfig(updates: { plans?: any; paymentConfig?: any }) {
  let sys = await prisma.tenant.findFirst({ where: { name: '__SYSTEM_GLOBAL_CONFIG__' } });
  const currentSettings = ((sys?.qrSettings as any) || {});
  const newSettings = {
    ...currentSettings,
    ...(updates.plans ? { plans: updates.plans } : {}),
    ...(updates.paymentConfig ? { paymentConfig: updates.paymentConfig } : {})
  };
  if (!sys) {
    sys = await prisma.tenant.create({
      data: {
        name: '__SYSTEM_GLOBAL_CONFIG__',
        plan: 'SYSTEM',
        status: 'ACTIVE',
        qrSettings: newSettings
      }
    });
  } else {
    sys = await prisma.tenant.update({
      where: { id: sys.id },
      data: { qrSettings: newSettings }
    });
  }
  return sys.qrSettings;
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
        const totalTenants = await prisma.tenant.count({ where: { NOT: { name: '__SYSTEM_GLOBAL_CONFIG__' } } });
        const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE', NOT: { name: '__SYSTEM_GLOBAL_CONFIG__' } } });
        const totalLeads = await prisma.lead.count();
        const newLeads = await prisma.lead.count({ where: { status: 'NEW' } });
        const totalTasks = await prisma.task.count();
        
        return NextResponse.json({
          success: true,
          stats: { totalTenants, activeTenants, totalLeads, newLeads, totalTasks }
        });

      case 'GET_TENANTS':
        const tenants = await prisma.tenant.findMany({
          where: { NOT: { name: '__SYSTEM_GLOBAL_CONFIG__' } },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { users: true, tasks: true }
            }
          }
        });
        return NextResponse.json({ success: true, tenants });

      case 'GET_PLANS':
        const globalConfig = await getGlobalConfig();
        return NextResponse.json({ success: true, plans: globalConfig.plans });

      case 'GET_PAYMENT_CONFIG':
        const paymentCfg = await getGlobalConfig();
        return NextResponse.json({ success: true, paymentConfig: paymentCfg.paymentConfig });

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
        const { name, plan, price, maxInspectors, contactEmail, contactPhone, adminEmail, adminPassword } = body;
        
        if (!adminEmail || !adminPassword) {
          return NextResponse.json({ error: 'adminEmail and adminPassword are required for new tenants' }, { status: 400 });
        }

        const newTenant = await prisma.tenant.create({
          data: {
            name,
            plan: plan || 'FREE',
            price: Number(price) || 0,
            maxInspectors: Number(maxInspectors) || 1,
            contactEmail,
            contactPhone,
            status: 'ACTIVE',
            users: {
              create: {
                email: adminEmail,
                password: adminPassword,
                role: 'ADMIN',
                name: 'Menahel'
              }
            }
          },
          include: { users: true }
        });
        return NextResponse.json({ success: true, tenant: newTenant });

      case 'RESET_TENANT_PASSWORD':
        const { tenantId, newPassword } = body;
        if (!tenantId || !newPassword) {
            return NextResponse.json({ error: 'tenantId and newPassword are required' }, { status: 400 });
        }
        
        // Find the admin user for this tenant
        const adminUser = await prisma.user.findFirst({
            where: { tenantId: tenantId, role: 'ADMIN' }
        });

        if (!adminUser) {
            return NextResponse.json({ error: 'Admin user not found for this tenant' }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: adminUser.id },
            data: { password: newPassword }
        });
        
        return NextResponse.json({ success: true });

      case 'SAVE_PLANS':
        const { plans } = body;
        if (!Array.isArray(plans)) {
          return NextResponse.json({ error: 'Plans must be an array' }, { status: 400 });
        }
        await saveGlobalConfig({ plans });
        return NextResponse.json({ success: true, message: 'התוכניות נשמרו בהצלחה' });

      case 'SAVE_PAYMENT_CONFIG':
        const { paymentConfig } = body;
        if (!paymentConfig || typeof paymentConfig !== 'object') {
          return NextResponse.json({ error: 'Invalid payment configuration' }, { status: 400 });
        }
        await saveGlobalConfig({ paymentConfig });
        return NextResponse.json({ success: true, message: 'הגדרות סליקה נשמרו בהצלחה' });

      case 'UPDATE_TENANT':
        const { id, updates } = body;
        const cleanUpdates: any = { ...updates };
        if (cleanUpdates.subscriptionEndsAt !== undefined) {
          cleanUpdates.subscriptionEndsAt = cleanUpdates.subscriptionEndsAt ? new Date(cleanUpdates.subscriptionEndsAt) : null;
        }
        if (cleanUpdates.price !== undefined) {
          cleanUpdates.price = Number(cleanUpdates.price) || 0;
        }
        if (cleanUpdates.maxInspectors !== undefined) {
          cleanUpdates.maxInspectors = Number(cleanUpdates.maxInspectors) || 1;
        }

        const updatedTenant = await prisma.tenant.update({
          where: { id },
          data: cleanUpdates
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
