import cron from 'node-cron';
import { generateRecommendations } from '../ai/recommendation.service.js';
import { calculateInventoryHealth } from '../ai/health.service.js';
import { broadcastAlert } from '../services/notify.js';
import logger from '../utils/logger.js';

export const initCronJobs = () => {
  // Run daily at 02:00 AM server time
  cron.schedule('0 2 * * *', async () => {
    logger.info('[Cron] Starting daily AI analysis job...');
    try {
      const recs = await generateRecommendations();
      const healthScore = await calculateInventoryHealth();

      // Broadcast a dashboard + email alert if health is critical
      if (healthScore < 60) {
        await broadcastAlert({
          title: 'Inventory Health Alert',
          message: `Your inventory health score dropped to ${healthScore}/100. Immediate attention may be required.`,
          type: 'danger',
          link: '/recommendations',
          sendEmail: true
        });
      }

      if (recs.length > 0) {
        await broadcastAlert({
          title: `${recs.length} New AI Recommendation${recs.length > 1 ? 's' : ''}`,
          message: `ShelfWise AI generated ${recs.length} actionable recommendation(s) for your inventory.`,
          type: 'warning',
          link: '/recommendations',
          sendEmail: false
        });
      }

      logger.info('[Cron] Daily AI analysis completed successfully.');
    } catch (error) {
      logger.error('[Cron] Error during AI analysis:', error.message);
    }
  });

  logger.info('[Cron] Jobs initialized.');
};
