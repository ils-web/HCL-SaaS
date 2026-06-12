const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

// Create a new Tenant (Client) and their initial Admin user
exports.createTenant = async (req, res) => {
  try {
    const { name, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !adminName || !adminPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash the admin's password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the Tenant and the Admin user in a single transaction
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN'
          }
        }
      },
      include: {
        users: true
      }
    });

    res.status(201).json({ 
      message: 'Tenant created successfully', 
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        adminUser: newTenant.users[0].name
      }
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all tenants (for SuperAdmin Dashboard)
exports.getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
