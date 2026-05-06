import LocalSession from 'telegraf-session-local';
import { initDb } from './src/database/db.js';
import { UserRepository } from './src/repositories/user.repository.js';
import { ListingRepository } from './src/repositories/listing.repository.js';
import { ProcessedMessageRepository } from './src/repositories/processedMessage.repository.js';
import { PhotoFlushService } from './src/services/photoFlush.service.js';
import { StateService } from './src/services/state.service.js';
import { UserService } from './src/services/user.service.js';
import { ListingService } from './src/services/listing.service.js';
import { SettingsService } from './src/services/settings.service.js';
import { AdminService } from './src/services/admin.service.js';
import { AuthController } from './src/controllers/auth.controller.js';
import { ListingController } from './src/controllers/listing.controller.js';
import { AdminController } from './src/controllers/admin.controller.js';
import { createBot } from './src/bot/bot.js';
import { setupHandlers } from './src/bot/handlers.js';
import { log } from './src/utils/logger.js';

// Bazani ishga tushirish
initDb();

// Sessiya faylini yaratish
const session = new LocalSession({ database: 'session_db.json' });

// Repository va Service-lar
const userRepository = new UserRepository();
const listingRepository = new ListingRepository();
const processedMessageRepository = new ProcessedMessageRepository();
const photoFlushService = new PhotoFlushService();
const stateService = new StateService(userRepository);
const userService = new UserService(userRepository, stateService);
const settingsService = new SettingsService();
const adminService = new AdminService();
const listingService = new ListingService(stateService, listingRepository, photoFlushService);

// Controller-lar
const authController = new AuthController(userService, stateService, settingsService);
const adminController = new AdminController(adminService, settingsService);
const listingController = new ListingController(listingService, stateService, authController, settingsService, adminController);

// Botni yaratish
const bot = createBot();

// MUHIM: Sessiyani handler-lardan OLDIN ulash kerak
bot.use(session.middleware());

// Handler-larni sozlash
setupHandlers(bot, {
  userService,
  stateService,
  processedMessageRepository,
  listingController,
  authController,
  settingsService,
  adminController
});

// Ishga tushirish
(async () => {
  await bot.launch();
  log.info('bot launched');
})();

// Xavfsiz o'chirish (Shutdown)
const shutdown = async (signal) => {
  log.info(`${signal} received, stopping Telegram bot`);
  await bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));