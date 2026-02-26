import { Router, Request, Response } from 'express';

const router = Router();

// In-memory favorites store (development only)
const favorites: Map<string, any[]> = new Map();

// Get user favorites
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const userFavs = favorites.get(req.params.userId as string) || getDefaultFavorites();
        res.json(userFavs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get favorites' });
    }
});

// Add favorite
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, type, name, data } = req.body;
        const userFavs = favorites.get(userId) || [];
        const fav = {
            id: crypto.randomUUID(),
            userId, type, name, data,
            createdAt: new Date().toISOString(),
        };
        userFavs.push(fav);
        favorites.set(userId, userFavs);
        res.json(fav);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// Delete favorite
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        // In production: delete from database
        res.json({ deleted: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete favorite' });
    }
});

function getDefaultFavorites() {
    return [
        { id: '1', type: 'address', name: '回家', data: { address: '10 Anson Rd #20-01', icon: '🏠' } },
        { id: '2', type: 'address', name: '公司', data: { address: '1 Raffles Place #30-01', icon: '🏢' } },
        { id: '3', type: 'address', name: '父母家', data: { address: '123 Jurong East St', icon: '⭐' } },
        { id: '4', type: 'shop', name: '益昌老街', data: { shopName: '益昌老街', location: 'Chinatown Complex', icon: '🧋' } },
    ];
}

export { router as favoritesRouter };
