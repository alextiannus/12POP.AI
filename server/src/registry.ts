/**
 * Shared service registry — singleton instances for all backend services.
 * Import this in routes instead of creating new instances.
 */
import { AIConversationService } from './services/aiConversation';
import { SlotFillingService } from './services/slotFilling';
import { PricingEngine } from './services/pricingEngine';
import { TaskOrchestrator } from './services/taskOrchestrator';
import { WalletService } from './services/walletService';

export const aiService = new AIConversationService();
export const slotService = new SlotFillingService();
export const pricingEngine = new PricingEngine();
export const orchestrator = new TaskOrchestrator();
export const walletService = new WalletService();
