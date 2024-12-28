import mongoose from 'mongoose';
import logger from './logger.js';

export default (database) => {
    const connect = () => {
        mongoose.connect(
            database,
        )
        .then(() => {
            logger.info(`[SERVER] Connected to database.`)
        })
        .catch(err => {
            logger.crit(`[SERVER] Error connecting to database: ${err}`);
            process.exit(-1);
        })
    }

    connect();

    mongoose.connection.on(`disconnected`, connect);
}