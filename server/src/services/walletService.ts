/**
 * Wallet Service — manages user balances, freezing, and transaction history.
 * In development: uses in-memory store. In production: Prisma + PostgreSQL.
 */

interface WalletTransaction {
    id: string;
    userId: string;
    taskId?: string;
    type: 'freeze' | 'deduct' | 'refund' | 'topup';
    amount: number;
    description: string;
    balanceAfter: number;
    createdAt: string;
}

interface WalletState {
    balance: number;
    frozen: number;
    points: number;
}

export class WalletService {
    private wallets: Map<string, WalletState> = new Map();
    private transactions: Map<string, WalletTransaction[]> = new Map();

    getWallet(userId: string): WalletState {
        if (!this.wallets.has(userId)) {
            // Initialize demo wallet
            this.wallets.set(userId, { balance: 24.50, frozen: 0, points: 580 });
            // Seed demo transactions
            this.seedDemoTransactions(userId);
        }
        return this.wallets.get(userId)!;
    }

    getBalance(userId: string) {
        const wallet = this.getWallet(userId);
        return {
            userId,
            balance: wallet.balance,
            frozenAmount: wallet.frozen,
            availableBalance: wallet.balance - wallet.frozen,
            points: wallet.points,
            currency: 'SGD',
        };
    }

    freeze(userId: string, amount: number, taskId: string, description: string): { success: boolean; error?: string } {
        const wallet = this.getWallet(userId);
        const available = wallet.balance - wallet.frozen;

        if (available < amount) {
            return { success: false, error: `余额不足 (可用: S$${available.toFixed(2)})` };
        }

        wallet.frozen += amount;
        this.addTransaction(userId, {
            taskId,
            type: 'freeze',
            amount: -amount,
            description: `冻结 · ${description}`,
            balanceAfter: wallet.balance - wallet.frozen,
        });

        return { success: true };
    }

    settle(userId: string, frozenAmount: number, actualAmount: number, taskId: string, description: string) {
        const wallet = this.getWallet(userId);
        const refund = frozenAmount - actualAmount;

        wallet.frozen -= frozenAmount;
        wallet.balance -= actualAmount;

        this.addTransaction(userId, {
            taskId,
            type: 'deduct',
            amount: -actualAmount,
            description: `扣款 · ${description}`,
            balanceAfter: wallet.balance,
        });

        if (refund > 0) {
            this.addTransaction(userId, {
                taskId,
                type: 'refund',
                amount: refund,
                description: `退款 · ${description} (多退)`,
                balanceAfter: wallet.balance,
            });
        }

        // Earn POP Coin (1 coin per S$1 spent)
        wallet.points += Math.floor(actualAmount);

        return { deducted: actualAmount, refunded: refund > 0 ? refund : 0, newBalance: wallet.balance };
    }

    topUp(userId: string, amount: number) {
        const wallet = this.getWallet(userId);
        wallet.balance += amount;
        this.addTransaction(userId, {
            type: 'topup',
            amount,
            description: `钱包充值`,
            balanceAfter: wallet.balance,
        });
        return { success: true, newBalance: wallet.balance };
    }

    getTransactions(userId: string): WalletTransaction[] {
        this.getWallet(userId); // ensure seeded
        return this.transactions.get(userId) || [];
    }

    private addTransaction(userId: string, tx: Omit<WalletTransaction, 'id' | 'userId' | 'createdAt'>) {
        const txns = this.transactions.get(userId) || [];
        txns.unshift({
            id: crypto.randomUUID(),
            userId,
            createdAt: new Date().toISOString(),
            ...tx,
        });
        this.transactions.set(userId, txns);
    }

    private seedDemoTransactions(userId: string) {
        const now = Date.now();
        const txns: WalletTransaction[] = [
            { id: '1', userId, type: 'deduct', amount: -8.50, description: '益昌老街 · 奶茶代买', balanceAfter: 24.50, createdAt: new Date(now - 2 * 3600000).toISOString() },
            { id: '2', userId, type: 'deduct', amount: -8.00, description: '公司 → 家 取送', balanceAfter: 33.00, createdAt: new Date(now - 26 * 3600000).toISOString() },
            { id: '3', userId, type: 'topup', amount: 50.00, description: '钱包充值', balanceAfter: 41.00, createdAt: new Date(now - 50 * 3600000).toISOString() },
            { id: '4', userId, type: 'deduct', amount: -60.00, description: '上门清洁 · 3房式', balanceAfter: -9.00, createdAt: new Date(now - 74 * 3600000).toISOString() },
            { id: '5', userId, type: 'refund', amount: 3.50, description: '退款 · 代买多退', balanceAfter: 51.00, createdAt: new Date(now - 74 * 3600000).toISOString() },
        ];
        this.transactions.set(userId, txns);
    }
}
