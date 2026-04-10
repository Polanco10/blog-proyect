import { Document } from 'mongoose';
import BaseRepository from './baseRepository';
const Cheatsheet = require('../models/cheatsheetModel');

class CheatsheetRepository extends BaseRepository<Document> {
    constructor() {
        super(Cheatsheet);
    }
}

export = new CheatsheetRepository();
