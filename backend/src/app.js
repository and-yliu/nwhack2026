// Express App Setup
import express from "express";
import cors from "cors";
import gameController from './controller/gameController.ts';
import lobbyController from './controller/lobbyController.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/lobby', lobbyController);
app.use('/game', gameController);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

export default app;