import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Mock game configuration
const GAME_CONFIG = {
    gameId: 145,
    odds: {
        0: { // Low mode
            8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        },
        1: { // Medium mode
            8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        },
        2: { // High mode
            8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        },
    },
};

// Mock user data
let mockRounds: any[] = [];
let roundCounter = 1;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.json({ status: 'Plinko Mock Service Running', port: 5000 });
});

// Socket.IO connection handling for the /user/plinko namespace
const plinkoNamespace = io.of('/user/plinko');

plinkoNamespace.on('connection', (socket) => {
    console.log('Client connected to /user/plinko namespace:', socket.id);

    // Handle sign-in
    socket.on('sign-in', () => {
        console.log('User signed in');
        socket.emit('signed-in');
    });

    // Handle in-game request
    socket.on('in-game', () => {
        console.log('Sending game config');
        socket.emit('game-event', {
            gameConfigs: GAME_CONFIG,
            user: {
                name: 'TestPlayer',
                rate: 1
            },
            roundHistory: mockRounds.slice(-10),
            playerResultBoard: []
        });
    });

    // Handle bet placement
    socket.on('bet', (payload: any) => {
        console.log('Bet received:', payload);

        const { amount, gameMode, numberOfRows, clientSeed } = payload;

        // Generate mock ball path
        const path: number[] = [];
        for (let i = 0; i < numberOfRows; i++) {
            path.push(Math.random() < 0.5 ? 0 : 1); // 0 = left, 1 = right
        }

        // Calculate final slot based on path
        const finalSlot = path.filter(p => p === 1).length;

        // Get multiplier from config
        const multiplier = GAME_CONFIG.odds[gameMode as keyof typeof GAME_CONFIG.odds]?.[numberOfRows as keyof typeof GAME_CONFIG.odds[0]]?.[finalSlot] || 1;
        const winAmount = amount * multiplier;

        // Create round record
        const round = {
            id: roundCounter++,
            uid: 'test-user-123',
            name: 'TestPlayer',
            amount,
            winAmount,
            gameMode,
            numberOfRows,
            result: path,
            settlementResult: { slotIndex: finalSlot, multiplier },
            clientSeed,
            time: new Date()
        };

        mockRounds.push(round);

        // Send responses
        socket.emit('game-event', {
            endBet: amount,
            ownBets: { gameMode, numberOfRows }
        });

        // Send finish immediately
        socket.emit('game-event', {
            finish: {
                result: path,
                settlementResult: { slotIndex: finalSlot, multiplier },
                winAmount,
                amount,
                reachMaxWin: winAmount > 10000
            }
        });

        // Send to other players
        socket.emit('game-event', {
            playerBet: {
                playerName: 'TestPlayer',
                amount,
                winAmount,
                multiplier
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected from /user/plinko namespace:', socket.id);
    });
});

// Keep the default namespace for backward compatibility
io.on('connection', (socket) => {
    console.log('Client connected to default namespace:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected from default namespace:', socket.id);
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 Plinko Mock Service running on port ${PORT}`);
    console.log(`📊 Game config:`, GAME_CONFIG.gameId);
    console.log(`🎯 Ready for client connections!`);
});
