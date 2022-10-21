const Model = require('./model');

module.exports = 
    class Nouvelle extends Model {
        constructor(titre, categorie, texte, imageUrl, date){
            super();
            this.Titre = titre !== undefined ? title : "";
            this.ImageUrl = imageUrl != undefined ? imageUrl : '/wwwroot/NouvellesManager/no_image.png';
            this.Texte = texte != undefined ? texte : "";
            this.Categorie = categorie != undefined ? categorie : "";
            this.Date = date != undefined ? date : 0;

            this.setKey('Date');
            this.addValidator('Titre', 'string');
            this.addValidator('ImageUrl', 'url');
            this.addValidator('Texte', 'string');
            this.addValidator('Categorie', 'string');
            this.addValidator('Date', 'integer');
        }
    }