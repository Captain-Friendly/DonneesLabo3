// tester sans live server quand fini

const Repository = require('../models/repository');
const NouvelleModel = require('../models/Nouvelle');

module.exports =
    class NouvellesController extends require('./Controller') {
        constructor(HttpContext) {
            super(HttpContext, new Repository(new NouvelleModel()));
            
        }
    }