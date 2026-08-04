import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    
    // Auto-clean tasks older than 180 days to prevent DB bloat
    const deletedOldTasks = await prisma.task.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        }
      }
    });
    
    // Find all tasks that are IN_PROGRESS, older than 48h, and haven't been warned yet
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: {
          lt: fortyEightHoursAgo
        },
        lastWarnedAt: null
      },
      include: {
        tenant: true,
        worker: true,
        system: true,
        area: true,
        department: true
      }
    });

    if (overdueTasks.length === 0) {
      return NextResponse.json({ status: 'success', message: 'No overdue tasks found' });
    }

    const warnedTaskIds = [];

    for (const task of overdueTasks) {
      const tenant = task.tenant;
      if (tenant.telegramBotToken && tenant.telegramChatId) {
        const text = `🚨 *Внимание! Задача не закрыта > 48 часов!*\n\n`
          + `*Отделение:* ${task.department?.name || task.room}\n`
          + `*Зона:* ${task.area?.name || '-'}\n`
          + `*Дефект:* ${task.system?.name || task.customDefectName || 'Не указано'}\n`
          + `*Проблема:* ${task.notes || 'Нет'}\n`
          + `*Команда/Рабочий:* ${task.worker?.name || 'Не назначен'}\n`
          + `*Дата создания:* ${task.createdAt.toLocaleString('ru-RU')}`;

        try {
          await fetch(`https://api.telegram.org/bot${tenant.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: tenant.telegramChatId,
              text,
              parse_mode: 'Markdown'
            })
          });
          warnedTaskIds.push(task.id);
        } catch(e) {
          console.error("Failed to send TG message for task", task.id, e);
        }
      } else {
        // Even if no TG configured, mark as warned so we don't process it forever
        warnedTaskIds.push(task.id);
      }
    }

    if (warnedTaskIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: warnedTaskIds } },
        data: { lastWarnedAt: new Date() }
      });
    }

    return NextResponse.json({ 
      status: 'success', 
      warnedCount: warnedTaskIds.length,
      deletedOldCount: deletedOldTasks.count 
    });
  } catch(error: any) {
    console.error("Cron error", error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
