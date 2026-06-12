const prisma = require('../prismaClient');

// Get all tasks for the current Tenant
exports.getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { tenantId: req.tenantId },
      include: {
        category: true,
        reporter: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { categoryId, department, room, defect, comment, priority, photoUrl } = req.body;
    
    if (!department || !room || !defect) {
      return res.status(400).json({ error: 'Department, room and defect are required' });
    }

    const task = await prisma.task.create({
      data: {
        tenantId: req.tenantId,
        reporterId: req.user.userId,
        categoryId,
        department,
        room,
        defect,
        comment,
        priority: priority || 2,
        photoUrl
      }
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update task status / assign worker
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, workerId, afterPhotoUrl, comment } = req.body;

    // Ensure the task belongs to the same tenant
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask || existingTask.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existingTask.status,
        workerId: workerId !== undefined ? workerId : existingTask.workerId,
        afterPhotoUrl: afterPhotoUrl !== undefined ? afterPhotoUrl : existingTask.afterPhotoUrl,
        comment: comment !== undefined ? comment : existingTask.comment
      }
    });

    res.json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
