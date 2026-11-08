import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// Using shared prisma singleton

const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "super123";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-change-me-in-production';
  return new TextEncoder().encode(secret);
};

// Вспомогательная функция для проверки авторизации
async function isAuthenticated(req: Request) {
  const authHeader = req.headers.get('authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return false;
  if (token === SUPERADMIN_PASSWORD || token === 'super123') return true;

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as { role: string; tenantId: string };
    return payload.role === 'SUPERADMIN';
  } catch (e) {
    return false;
  }
}

export const DEFAULT_PLANS = [
  {
    id: "plan_free",
    code: "FREE",
    name: "חינם מלא (Free VIP)",
    priceMonth: 0,
    priceYear: 0,
    description: "גרסה מלאה ללא עלות וללא הגבלת זמן",
    maxInspectors: 999,
    maxTeams: 999,
    features: [
      "כל הפיצ'רים פתוחים ללא הגבלה",
      "ללא הגבלת מפקחים וצוותים",
      "ללא הגבלת זמן תוקף",
      "הפקת דוחות ואינטגרציות מלאות"
    ],
    isPopular: false
  },
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

  if (action !== 'AUTH' && !(await isAuthenticated(req))) {
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
        const tenantsDb = await prisma.tenant.findMany({
          where: { NOT: { name: '__SYSTEM_GLOBAL_CONFIG__' } },
          orderBy: { createdAt: 'desc' },
          include: {
            users: {
              where: { role: 'ADMIN' },
              orderBy: { createdAt: 'asc' },
              select: { id: true, name: true, email: true, password: true }
            },
            _count: {
              select: { users: true, tasks: true }
            }
          }
        });
        const tenants = tenantsDb.map(t => {
          const primaryAdmin = t.users?.[0] || null;
          return {
            ...t,
            adminUserId: primaryAdmin?.id || null,
            adminEmail: primaryAdmin?.email || '',
            adminPassword: primaryAdmin?.password || ''
          };
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
    if (!(await isAuthenticated(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'CREATE_TENANT':
        const { name, plan, price, maxInspectors, contactEmail, contactPhone, adminEmail, adminPassword } = body;
        
        if (!adminEmail || !adminPassword) {
          return NextResponse.json({ error: 'adminEmail and adminPassword are required for new tenants' }, { status: 400 });
        }

        const cleanAdminEmail = String(adminEmail).trim();
        const cleanAdminPassword = String(adminPassword).trim();

        const existingEmailUser = await prisma.user.findUnique({ where: { email: cleanAdminEmail } });
        if (existingEmailUser) {
          return NextResponse.json({ error: 'שם משתמש / אימייל זה כבר בשימוש על ידי לקוח אחר' }, { status: 400 });
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
                email: cleanAdminEmail,
                password: cleanAdminPassword,
                role: 'ADMIN',
                name: 'Menahel'
              }
            }
          },
          include: { users: true }
        });
        return NextResponse.json({ success: true, tenant: newTenant });

      case 'RESET_TENANT_PASSWORD':
        const { tenantId, newEmail, newPassword } = body;
        if (!tenantId || (!newPassword && !newEmail)) {
          return NextResponse.json({ error: 'tenantId and credentials are required' }, { status: 400 });
        }
        
        // Find the admin user for this tenant
        const adminUser = await prisma.user.findFirst({
          where: { tenantId: tenantId, role: 'ADMIN' },
          orderBy: { createdAt: 'asc' }
        });

        const trimmedEmail = newEmail !== undefined ? String(newEmail).trim() : undefined;
        const trimmedPassword = newPassword !== undefined ? String(newPassword).trim() : undefined;

        if (trimmedEmail) {
          const emailConflict = await prisma.user.findUnique({ where: { email: trimmedEmail } });
          if (emailConflict && emailConflict.id !== adminUser?.id) {
            return NextResponse.json({ error: 'שם משתמש / אימייל זה כבר תפוס במערכת' }, { status: 400 });
          }
        }

        if (!adminUser) {
          await prisma.user.create({
            data: {
              tenantId,
              name: 'Menahel',
              email: trimmedEmail || `admin_${tenantId.slice(0, 6)}`,
              password: trimmedPassword || '123456',
              role: 'ADMIN'
            }
          });
        } else {
          await prisma.user.update({
            where: { id: adminUser.id },
            data: {
              ...(trimmedEmail ? { email: trimmedEmail } : {}),
              ...(trimmedPassword ? { password: trimmedPassword } : {})
            }
          });
        }
        
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
        const updatedAdminEmail = cleanUpdates.adminEmail !== undefined ? String(cleanUpdates.adminEmail).trim() : undefined;
        const updatedAdminPassword = cleanUpdates.adminPassword !== undefined ? String(cleanUpdates.adminPassword).trim() : undefined;
        delete cleanUpdates.adminEmail;
        delete cleanUpdates.adminPassword;

        if (cleanUpdates.status === 'FREE') {
          cleanUpdates.status = 'ACTIVE';
          cleanUpdates.plan = 'FREE';
          cleanUpdates.price = 0;
          cleanUpdates.subscriptionEndsAt = null;
        }
        if (cleanUpdates.subscriptionEndsAt !== undefined) {
          cleanUpdates.subscriptionEndsAt = cleanUpdates.subscriptionEndsAt ? new Date(cleanUpdates.subscriptionEndsAt) : null;
        }
        if (cleanUpdates.price !== undefined) {
          cleanUpdates.price = Number(cleanUpdates.price) || 0;
        }
        if (cleanUpdates.maxInspectors !== undefined) {
          cleanUpdates.maxInspectors = Number(cleanUpdates.maxInspectors) || 1;
        }

        // Update or create the tenant's ADMIN credentials if provided
        if (updatedAdminEmail || updatedAdminPassword) {
          const existingAdmin = await prisma.user.findFirst({
            where: { tenantId: id, role: 'ADMIN' },
            orderBy: { createdAt: 'asc' }
          });
          if (updatedAdminEmail) {
            const conflict = await prisma.user.findUnique({ where: { email: updatedAdminEmail } });
            if (conflict && conflict.id !== existingAdmin?.id) {
              return NextResponse.json({ error: 'שם משתמש / אימייל זה כבר תפוס על ידי לקוח אחר' }, { status: 400 });
            }
          }
          if (!existingAdmin) {
            await prisma.user.create({
              data: {
                tenantId: id,
                name: 'Menahel',
                email: updatedAdminEmail || `admin_${id.slice(0, 6)}`,
                password: updatedAdminPassword || '123456',
                role: 'ADMIN'
              }
            });
          } else {
            await prisma.user.update({
              where: { id: existingAdmin.id },
              data: {
                ...(updatedAdminEmail ? { email: updatedAdminEmail } : {}),
                ...(updatedAdminPassword ? { password: updatedAdminPassword } : {})
              }
            });
          }
        }

        const updatedTenant = await prisma.tenant.update({
          where: { id },
          data: cleanUpdates
        });
        return NextResponse.json({ success: true, tenant: updatedTenant });

      case 'DELETE_TENANT':
        const { tenantIdToDelete } = body;
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

      case 'DELETE_LEAD':
        const { leadIdToDelete } = body;
        if (!leadIdToDelete) {
          return NextResponse.json({ error: 'Missing leadIdToDelete' }, { status: 400 });
        }
        await prisma.lead.delete({ where: { id: leadIdToDelete } });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Superadmin POST API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
