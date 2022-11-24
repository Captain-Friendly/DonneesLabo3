// limit nb elements
// ofsset: a partir de ou

const periodicRefreshPeriod = 10;
let currentETag = "";
let previousScrollPosition = 0;

let smtWEtag = false;
const FirstNews = 3;
const NewNews = 1;
let NbOfNews = 0;
let currentCat = "";
let scrollUpdated = false;

let hideSearchBar = true;
let selectedCategorie = "";
let nouvelleIdToDelete = 0; // used by confirmDeleteDlg
let noNewNews = false;
let createMode = true;

init_UI();
HEAD(partialRefresh, error)
// getNouvelleList();
setInterval(() => {HEAD(partialRefresh, error)}, periodicRefreshPeriod * 1000);

function partialRefresh(ETag){
    if(!smtWEtag && ETag != currentETag){
        currentETag = ETag;
        getNouvelleList();
    }
}

function prepareQueryString(offset){
    let queryString = "?";
    let  news=0;
    if(NbOfNews == 0){
        news = FirstNews;
    }
    else{
        news = NewNews
    }
    if (offset != undefined){
        queryString+=`&offset=${offset}&limit=${news}`
    }
    // queryString+="sort=Categorie&sort=Titre";
    queryString+="&sort=Date,desc";

    // add search bar shit
    return queryString;
}

function refreshCategoryList(categories) {
    $("#searchCategory").empty();
    $("#searchCategory").append("<option value=''>Toutes les catégories</option>");
    for (let item of categories) {

        let category = item.Categorie;
        let selected = (selectedCategorie == category ? " selected " : "");
        $("#searchCategory").append(`<option value='${category}' ${selected}>${category}</option>`);
    }
}
function getNouvelleList(){
    // here where we decide the number of news
    if(NbOfNews == 0){
        GET_ALL(refreshNouvellesList , error, prepareQueryString(0));
        NbOfNews+=FirstNews;
    }
    else
        GET_ALL(refreshNouvellesList , error, prepareQueryString(NbOfNews));

    GET_ALL(refreshCategoryList , error, "?fields=Categorie");

}

function makeImage(imageUrl){
    let image = $(`<a href="${imageUrl}" target="_blank" class="imageContainer">
    <img src="${imageUrl}" class="img-responsive theImage" ></a>`);
    return image;
}


function insertIntoNouvellesList(nouvelle){
    let catElem = $(`<div class="category"> ${nouvelle.Categorie}</div>`); // above
    
    let dateFormated = convertToFrenchDate(nouvelle.Date);
    let titElem = $(`<div class=" titleContainer"> <div class="Title"> ${nouvelle.Titre} </div> ${dateFormated}</div>`);
    // let dateElem = $(`<div class=""> </div>`);
    let textElem = $(`<div class="textContainer"> <div class="text"> ${nouvelle.Texte}</div> </div>`);
    let nouvelleRow = $("<div class='nouvelleRow'> ");

    let editCmd = $(`<div class="cmd editCmd fa fa-pencil-square" nouvelleid="${nouvelle.Id}" title="Editer ${nouvelle.Titre}" data-toggle="tooltip">`);
    let deleteCmd = $(`<div class="cmd deleteCmd fa fa-window-close" nouvelleid="${nouvelle.Id}" title="Effacer ${nouvelle.Titre}" data-toggle="tooltip">`);


    nouvelleRow.append(catElem);
    nouvelleRow.append(titElem);
    nouvelleRow.append(makeImage(nouvelle.ImageUrl));

    nouvelleRow.append(editCmd);
    nouvelleRow.append(deleteCmd);
    nouvelleRow.append(textElem);

    $("#nouvelleList").append(nouvelleRow);
}

function editNouvelle(e) {
    smtWEtag = true;
    createMode = false;
    GET_ID(e.target.getAttribute("nouvelleid"), nouvelleToForm, error);
    smtWEtag = true;
    $("#nouvelleDlg").dialog('option', 'title', 'Modification de favori');
    $("#nouvelleDlgOkBtn").text("Modifier");
    $("#nouvelleDlg").dialog('open');
}

function refreshNouvellesList(nouvelles, ETag){
    currentETag = ETag;
    previousScrollPosition = $(".scrollContainer").scrollTop();

    $("#nouvelleList").empty();
    // TODO change for something else, NewNews doesnt 
    // take into cosidaration if there were changes after the first inset
    for(let i = 0; i < NbOfNews; i++){
        // this is so the news doesn't show the cat, check above
        if(nouvelles[i].Categorie !== currentCat)
            currentCat = nouvelles[i].Categorie;
        else 
            nouvelles[i].Categorie = "";

        insertIntoNouvellesList(nouvelles[i])
    }
    $(".scrollContainer").scrollTop(previousScrollPosition);
    $(".deleteCmd").on("click", (e) => { deleteNouvelle(e) });
    $(".editCmd").on("click", (e) => { editNouvelle(e) });
    $('[data-toggle="tooltip"]').tooltip();
}

function deleteNouvelle(e) {
    smtWEtag = true;
    nouvelleIdToDelete = e.target.getAttribute("nouvelleid")
    GET_ID(
        nouvelleIdToDelete,
        nouvelle => {
            $("#confirmationMessage").html("Voulez-vous vraiment effacer la nouvelle <b>" + nouvelle.Titre + "</b>?")
        },
        error
    );
    holdCheckETag = true;
    $("#confirmDlg").dialog('option', 'title', 'Retrait de favori...');
    $("#confirmDeleteDlgOkBtn").text("Effacer");
    $("#confirmDeleteDlg").dialog('open');
}

function AddNews(nouvelles, ETag){
    previousScrollPosition = $(".scrollContainer").scrollTop();
    if(nouvelles.length > 0){
        if(noNewNews == false) {
            if(NbOfNews == 0){
                for(let i = 0; i < NewNews; i++){
            
                    insertIntoNouvellesList(nouvelles[i])
                    
                }
                NbOfNews += NewNews;
            }else{
                insertIntoNouvellesList(nouvelles[0])
                NbOfNews += NewNews;
            }
            
        }else{
            if(ETag != currentETag){
                $(".scrollContainer").scrollTop();
                noNewNews = false;
                getNouvelleList();

            }
        }
    }
    
    if(nouvelles.length < NewNews)
        noNewNews = true;
    
    scrollUpdated = false;
    // insertIntoNouvellesList()
    $(".scrollContainer").scrollTop(previousScrollPosition);
}

$(".scrollContainer").on("scroll", 
    function () {
        // console.log(`scrollTop: ${$(".scrollContainer").scrollTop()}\n`);
        if ($(".scrollContainer").scrollTop() + $(".scrollContainer").innerHeight() >= $("#nouvelleList").height()) {
            // todo: charger la prochaine nouvelle
            if(scrollUpdated == false ){
                scrollUpdated = true;
                GET_ALL(AddNews , error, prepareQueryString(NbOfNews));
            }
            else
                setTimeout(()=> {scrollUpdated = false},100)
        }
    }
);



function error(status) {
    let errorMessage = "";
    switch (status) {
        case 0:
            errorMessage = "Le service ne répond pas";
            break;
        case 400:
        case 422:
            errorMessage = "Requête invalide";
            break;
        case 404:
            errorMessage = "Service ou données introuvables";
            break;
        case 409:
            errorMessage = "Conflits de données: Hyperlien existe déjà";
            break;
        case 500:
            errorMessage = "Erreur interne du service";
            break;
        default: break;
    }
    $("#errorMessage").text(errorMessage);
    $("#errorDlg").dialog('open');
}

function resetNouvelleForm() {
    $("#Id_input").val("0");
    $("#title_input").val("");
    $("#url_input").val("");
    $("#category_input").val("");
    $("#texte_input").val("");
}
function nouvelleToForm(nouvelle) {
    $("#Id_input").val(nouvelle.Id);
    $("#title_input").val(nouvelle.Titre);
    $("#url_input").val(nouvelle.ImageUrl);
    $("#category_input").val(nouvelle.Categorie);
    $("#texte_input").val(nouvelle.Texte);
}
function nouvelleFromForm() {
    if ($("#nouvelleForm")[0].checkValidity()) {
        let nouvelle = { Id: parseInt($("#Id_input").val()), Titre: $("#title_input").val(), ImageUrl: $("#url_input").val(), Categorie: $("#category_input").val(), Date: Date.now(), Texte:$("#texte_input").val() };
        return nouvelle;
    } else {
        $("#nouvelleForm")[0].reportValidity()
    }
    return false;
}

function newNouvelle() {
    smtWEtag = true;
    createMode = true;
    resetNouvelleForm()
    $("#nouvelleDlg").dialog('option', 'title', 'Ajout de favori');
    $("#nouvelleDlgOkBtn").text("Ajouter");
    $("#nouvelleDlg").dialog('open');
}
function init_UI(){
    // newNouvelleCmd
    $("#newNouvelleCmd").on("click", newNouvelle)

    $("#nouvelleDlg").dialog({
        title: "Nouvelle nouvelle",
        autoOpen: false,
        modal: true,
        show: { effect: 'fade', speed: 400 },
        hide: { effect: 'fade', speed: 400 },
        width: 400,
        minWidth: 400,
        maxWidth: 500,
        height: 440,
        minHeight: 440,
        maxHeight: 440,
        position: { my: "top", at: "top", of: window },
        buttons: [{
            id: "nouvelleDlgOkBtn",
            text: "Title will be changed dynamically",
            click: function () {
                let nouvelle = nouvelleFromForm();
                if (nouvelle) {
                    if (createMode)
                        POST(nouvelle, getNouvelleList, error);
                    else
                        PUT(nouvelle, getNouvelleList, error);
                    resetNouvelleForm();
                    smtWEtag = false;
                    $(this).dialog("close");
                }
            }
        },
        {
            text: "Annuler",
            click: function () {
                smtWEtag = false;
                $(this).dialog("close");
            }
        }]
    });

    $("#confirmDeleteDlg").dialog({
        title: "Attention!",
        autoOpen: false,
        modal: true,
        show: { effect: 'fade', speed: 400 },
        hide: { effect: 'fade', speed: 400 },
        width: 500, minWidth: 500, maxWidth: 500,
        height: 230, minHeight: 230, maxHeight: 230,
        position: { my: "top", at: "top", of: window },
        buttons: [{
            id: "confirmDeleteDlgOkBtn",
            text: "Oui",
            click: function () {
                smtWEtag = false;
                if (nouvelleIdToDelete)
                    DELETE(nouvelleIdToDelete, getNouvelleList, error);
                    nouvelleIdToDelete = 0;
                $(this).dialog("close");
            }
        },
        {
            text: "Annuler",
            click: function () {
                smtWEtag = false;
                nouvelleIdToDelete = 0;
                $(this).dialog("close");
            }
        }]
    });

    $("#errorDlg").dialog({
        title: "Erreur...",
        autoOpen: false,
        modal: true,
        show: { effect: 'fade', speed: 400 },
        hide: { effect: 'fade', speed: 400 },
        width: 500, minWidth: 500, maxWidth: 500,
        height: 230, minHeight: 230, maxHeight: 230,
        position: { my: "top", at: "top", of: window },
        buttons: [{
            text: "Fermer",
            click: function () {
                smtWEtag = false;
                nouvelleIdToDelete = 0;
                $(this).dialog("close");
            }
        }]
    });
}

