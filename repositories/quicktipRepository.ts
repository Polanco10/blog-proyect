import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const QuickTip = require('../models/quicktipModel');

class QuickTipRepository extends BaseRepository<Document> {
    constructor() {
        super(QuickTip);
    }
}

export = new QuickTipRepository();
