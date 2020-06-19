let protocol    = location.protocol + '//';     // http o https
let host        = location.host;                // Dominio
let pluginName  = 'ajax-search-by-redkram';     // Nombre del plugin
let searchDelay = '';                           // Delay para no hacer peticiones simultaneas y evitar un DDOS propio ;)
let delay       = 1000;                         // Tiempo que esperamos entre la pulsación de una letra y la consulta Ajax
let tmp_value   = '';                           // Valor en bruto del campo input, lo usamos para saber si ha variado o no para lanzar una consulta
let minStr      = 4;                            // caracteres mínimos de búsqueda
let hideLayer   = true;                         // Para ocultar o no la capa de los detalles
let sku         = '';                           // Para saber que variación tenemos que mostrar
let data        = '';                           // Info del producto para construir los LI
let temp_search = '';                           // Resultado de la búsqueda limpia
let dataObjects = [];                           // Array con la info (Object) de todos los productos encontrados Key = ID
let searchInput = '';                           // ID de la capa del input del buscador
let searchform = '';                            // ID del Formulario de búsqueda

/**
 * Cuando cargamos la página: NO RESPONSIVE
 */
window.onload = function() {

    if (screen.width > 800) {
        searchInput = document.getElementsByClassName("search-field")[0];
        searchform  = document.getElementsByClassName("search-form")[0];
        init();
    }

};

/**
 * Controlamos los eventos y lanzamos el plugin
 */

function init() {

    searchInput.setAttribute('autocomplete', 'off');

    searchInput.addEventListener('mouseup', function(e) {
        alertUP(true);
        lanzadera(this.value.toLowerCase());
    });

    searchInput.addEventListener('keyup', function(e) {
        lanzadera(this.value.toLowerCase());
    });

    searchform.addEventListener('submit', function(e) {
        e.preventDefault();
        let str = searchInput.value.toLowerCase();
        if ( str.length < minStr ) {
            alert("Mínimo deben ser " + minStr + " caracteres");
        } else {
            str = str.replace("sku:", '');
            str = str.replace("ean:", '');
            str = str.replace("oem:", '');
            str = str.trim();
            searchInput.value = str;
            searchform.submit();
        }
    });

    window.addEventListener('click', function(e){
        hideLayer = true;
        if (document.getElementsByClassName("ajaxResults").length > 0) {
            myParents = getParents(e.target);
            myParents.forEach(dontHideLayer);
            if (hideLayer) {
                setTimeout(function() {
                    hiddenDIv("alertUP");
                    hiddenDIv("ajaxResults");
                }, delay);
            }
        }
    });

}

/**
 * Lanzamos la peticion de buscar si cumple X condiciones
 * Limpiamos la búsqueda de sku, oem, ean...
 * @param vari
 */
function lanzadera (vari)
{
    clearTimeout(searchDelay);
    temp_search = vari;
    temp_search = temp_search.replace("sku:", '');
    temp_search = temp_search.replace("oem:", '');
    temp_search = temp_search.replace("ean:", '');
    if (temp_search.length > minStr) {
        if (tmp_value !== vari ) {
            searchDelay = setTimeout(function() {
                ajaxSearch(vari);
            }, delay);
        } else {
            var element = document.getElementsByClassName("ajaxResults");
            if (element.length > 0 ) element[0].classList.remove("ocult");
        }
    }

}

/**
 * Creamos el panel de debajo del buscador
 * @param action
 */
function alertUP (action)
{
    if (action) {
        hiddenDIv("alertUP", false);
        let element = document.getElementsByClassName("alertUP");
        if (element.length === 0 ) {
            let div = newElement('div', 'alertUP');
            div.innerHTML = "<p>Para acelerar la búsqueda selecciona lo que estas buscando</p>";

            let buttons = ["sku", "ean", "oem", "otros"];
            buttons.forEach(function(el){
                let button = alertUPButtons(el);
                div.appendChild(button);
            });
            let i = newElement('i', 'fas fa-times');
            i.addEventListener('click', function(e){
                this.parentElement.classList.add("ocult");
            });
            div.appendChild(i);
            searchform.appendChild(div);
        }
    } else {
        hiddenDIv("alertUP");
    }
}

/**
 * Creamos los botones de sku, ean, oem ... debajo del buscador
 * @param param
 * @returns {HTMLAnchorElement}
 */
function alertUPButtons(param) {
    let buttons, codigo, className, aTXT;
    if ('otros' === param) {
        buttons     = 'Modelo Impresora';
        codigo      = '';
        className   = 'btn-primary newL';
        aTXT        = document.createTextNode(buttons);
    } else {
        buttons     = ('otros' !== param) ? param : 'Modelo Impresora';
        codigo      = ('otros' !== param) ? param + ': ' : '';
        className   = 'btn-primary 0axx';
        aTXT        = document.createTextNode(buttons.toUpperCase());
    }
    let a = newElement('a', className);
    a.appendChild(aTXT);
    a.addEventListener('click', function(e){
        searchInput.value = codigo;
        searchInput.focus();
        alertUP(false);
    });
    return a;
}

/**
 * Function para mostrar u ocultar el spinner
 * @param action
 */
function spinner (action)
{
    if (action) {
        alertUP(false);
        hiddenDIv("fa-spinner", false);
        let element = document.getElementsByClassName("fa-spinner");
        if (element.length <= 0) {
            let i = newElement('i', 'fas fa-spinner');
            searchform.appendChild(i);
        }
    } else {
        hiddenDIv("fa-spinner");
    }
}

/**
 * Funcion para no ocultar la capa de resultados si el padre es una de las siguientes clases
 * @param el
 */
function dontHideLayer(el) {
    if (
        el.className === 'ajaxResults'
        || el.className === 'search-form'
    ) {
        if (el.className === 'ajaxResults') hiddenDIv('alertUP');
        clearTimeout(searchDelay);
        hideLayer = false;
    }
}

function ajaxSearch (inputVal)
{
    spinner(true);
    tmp_value = inputVal;

    if ( inputVal.indexOf('sku:') === 0) {
        sku = inputVal.replace("sku:", '').trim();
        callPostData({'sku': inputVal.replace("sku:", '')});
    } else if (inputVal.indexOf('oem:') === 0) {
        callPostData({'oem': inputVal.replace("oem:", '')});
    } else if (inputVal.indexOf('ean:') === 0) {
        callPostData({'ean' : inputVal.replace("ean:", '')});
    } else {
        callPostData({'params' : inputVal});
    }
}

/**
 * Funcion para crear un elemento
 * @param tag
 * @param calssName
 * @returns {*}
 */
function newElement(tag, calssName = '') {
    let tmp = document.createElement(tag);
    if ('' !== calssName) addClass(tmp, calssName);
    return tmp;
}

/**
 * Función para añadir una clase al elemento
 * @param element
 * @param calssName
 */
function addClass(element, calssName) {
    element.setAttribute('class', calssName);
    return;
}

function removeChilds(className) {
    let tag = document.getElementsByClassName(className);
    if (tag.length > 0) {
        while(tag[0]) {
            tag[0].parentNode.removeChild(tag[0]);
            // tag[0].parentElement.removeChild(tag[0]);
        }
    }
}

function viewJSON (results)
{
    spinner(false);
    removeChilds("ajaxResultsLI");
    let element = document.getElementsByClassName("ajaxResults");
    if (element.length == 0) {
        let ul      = newElement('ul', 'ajaxResultsUL');
        let details = newElement('div', 'ajaxDetails');
        let div     = newElement('div', 'ajaxResults');
        let a       = newElement('a', 'ajaxAllProducts');
        div.appendChild(a);
        div.appendChild(ul);
        div.appendChild(details);
        searchform.appendChild(div);
    }
    results.forEach(result);
    let allProducts = document.getElementsByClassName("ajaxAllProducts");
    if (allProducts.length > 0) {
        allProducts[0].setAttribute('href', '/?s=' + temp_search + '&post_type=product');
        allProducts[0].innerText = 'Ver todos los productos [' + tmp_value + ']';
    }
}

/**
 * Datos de los resultados obtenidos por ajax
 * @param el
 */
function result (el)
{
    let PID = el.product.id;
    dataObjects[PID] = el;
    dataObjects[PID].is_variation = false;
    specialPrices(PID);
    // Si te el preu a 0 perque no s'hauria de poder comprar que fem???
    if (dataObjects[PID].variations !== undefined && dataObjects[PID].variations !== null) {
        dataObjects[PID].is_variation = true;
        dataObjects[PID].variations.forEach(updateProduct);
    }
    liHTML(PID);
}

function specialPrices (PID)
{
    let product = dataObjects[PID].product;
    if (parseFloat(product.price) < parseFloat(product.sale_price)) {
        product.price = '';
        product.sale_price = parseFloat(product.sale_price);
    } else if(parseFloat(product.price) === parseFloat(product.sale_price)) {
        product.sale_price = '';
    } else if (parseFloat(product.sale_price) === '' || parseFloat(product.sale_price) === 0) {
        product.price = '';
    } else {
        product.price = parseFloat(product.price);
        product.sale_price = parseFloat(product.sale_price);
    }
    if (product.sale_price) {
        product.regular_price = product.sale_price;
    }
}

/**
 * Actualizamos la info del producto por si se busca una variación
 * @param el
 * @param index
 */
function updateProduct (el, index)
{
    let PID = el.product.parent_id;
    let search = searchInput.value.toLowerCase();
    let attributes = '';
    let _sku = '';
    if (el.color !== undefined && el.color !== null && el.color !== false ) {
        attributes = el.color.toLowerCase();
    }
    if (el.metas._sku[0] !== undefined && el.metas._sku[0] !== null && el.metas._sku[0] !== false ) {
        _sku = el.metas._sku[0].toLowerCase();
    }
    if (
        0 === index
        || (attributes !== '' && search.indexOf(attributes) >= 0)
        || (attributes !== '' && attributes.indexOf(search) >= 0)
        || (_sku !== '' && search.indexOf(_sku) >= 0)
        || (_sku !== '' && _sku.indexOf(search) >= 0)
    ) {
        dataObjects[PID].product.id = el.product.variation_id;
        dataObjects[PID].images.main = el.images;
        dataObjects[PID].product.stock = el.metas._stock;
        dataObjects[PID].product.sku = el.metas._sku[0];
        dataObjects[PID].product.regular_price = (el.metas._regular_price[0]) ?? 0;
        dataObjects[PID].product.sale_price = (el.metas.hasOwnProperty("_sale_price")) ? el.metas._sale_price[0] : 0;
        dataObjects[PID].link += (0 === index) ? '' : "?attribute_pa_color=" +  attributes;
        dataObjects[PID].product.price = (el.metas._regular_price[0]) ?? 0;
    }
    specialPrices(PID);
}

/**
 * Montamos los resultados de la búsqueda en un LI
 */
function liHTML (PID) {
    let li          = newElement('li', 'ajaxResultsLI');
    li.innerHTML    = "<img alt='"+dataObjects[PID].product.name+"' src='"+dataObjects[PID].images.main+"' class='redLiImg'>" +
        "<h3 class='redLih3'><a href='"+dataObjects[PID].link+"'>" +dataObjects[PID].product.name+ "</a></h3>" +
        "<span>SKU: <strong>"+dataObjects[PID].product.sku+"</strong></span>" +
        "<span>Stock: <strong>"+dataObjects[PID].product.stock_quantity+"</strong></span>";
    if (dataObjects[PID].product.price !== '' && dataObjects[PID].product.price !== undefined && dataObjects[PID].product.price !== null && dataObjects[PID].product.price > 0) {
        li.innerHTML += "<span>Precio: <strong>"+dataObjects[PID].product.price+"€ / ud.</strong></span>";
    }
    li.addEventListener('mouseenter', function(e) {
        rightDetails(PID);
    });
    document.getElementsByClassName("ajaxResultsUL")[0].appendChild(li);
}

/**
 * Capa de la derecha de detalles
 * @param newData
 */
function rightDetails(PID) {
    document.getElementsByClassName("ajaxDetails")[0].innerHTML= constructLI(PID);
}

/**
 * Algo ha fallado y lo mostramos por console log
 * @param error
 */
function viewERROR (error)
{
    searchInput.value = "";
    searchInput.setAttribute("placeholder", "Lo sentimos, tenemos 0 resultados");
    spinner(false);
    hiddenDIv("ajaxResults");
    console.log("ERROR: "+error);
}

/**
 * Funcion para añadir la clase .ocult o quitarla
 * @param className
 * @param action
 */
function hiddenDIv (className, action = true)
{
    var element = document.getElementsByClassName(className);
    if (element.length > 0) {
        (action) ? element[0].classList.add("ocult") : element[0].classList.remove("ocult");
    }
}

/**
 * Comprobamos los padres de un tag
 * @param el
 * @param parentSelector
 * @returns {[]}
 */
function getParents(el, parentSelector ) {
    if (parentSelector === undefined) {
        parentSelector = document;
    }
    var parents = [];
    var p = el.parentNode;
    while (p !== parentSelector) {
        var o = p;
        parents.push(o);
        p = o.parentNode;
    }
    parents.push(parentSelector);
    return parents;
}

/**
 * Funcion standard para hacer la llamada a la funcion de ajax postData
 * @param params
 */
function callPostData (params) {
    let pluginPath = protocol + host + '/wp-content/plugins/' + pluginName + '/' + pluginName + '-results.php';
    postData(pluginPath, params).then(data => {viewJSON (data);}).catch((error) => {
        viewERROR(error);
    });
}

/**
 * Funcion AJAX
 * @param url
 * @param data
 * @returns {Promise<any>}
 */
async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return response.json();
}

function constructLI (PID)
{
    let ID      = (dataObjects[PID].product.parent_id === 0) ? dataObjects[PID].product.id: dataObjects[PID].product.parent_id;
    let TITLE   = dataObjects[PID].product.name;
    let LINK    = dataObjects[PID].link;
    let IMG     = dataObjects[PID].images.main;
    let PRICE   = dataObjects[PID].product.regular_price;
    let SKU     = dataObjects[PID].product.sku;

    let html = '' +
        '<div class="product type-product post-'+ID+' status-publish instock product_cat-elementos-de-proteccion-para-objetos-e-instalaciones has-post-thumbnail taxable shipping-taxable purchasable product-type-simple">' +
            '<div class="item-img">          ' +
                '<a class="product-image" title="'+TITLE+'" href="'+LINK+'">' +
                '<img src="'+IMG+'" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail wp-stateless-item" alt="'+TITLE+'" width="300" height="300"> </a>' +
            '</div>' +
            '<div class="block-item-title">' +
                '<h3><a title="'+TITLE+'" href="'+LINK+'">'+TITLE+'</a></h3>' +
            '</div>' +
            '<div class="product-button-wrap clearfix">' +
                '<a href="?add-to-cart='+ID+'" data-quantity="1" class="button product_type_simple add_to_cart_button ajax_add_to_cart" data-product_id="'+ID+'" data-product_sku="'+SKU+'" aria-label="Add “'+TITLE+'” to your cart" rel="nofollow">Add to cart</a> ' +
                '<a class="villa-details" title="'+TITLE+'" href="'+LINK+'">' +
                'View Details            </a>' +
            '</div>' +
            '<div class="product-price-wrap">' +
                '<span class="price"><span class="woocommerce-Price-amount amount">'+PRICE+'<span class="woocommerce-Price-currencySymbol">€</span></span></span>' +
            '</div>' +
            '<ul class="add-to-links">' +
                '<li>' +
                '<a class="link-wishlist" href="/categoria/material-de-oficina/?add_to_wishlist='+ID+'">' +
                'Add To Wishlist                </a>' +
                '</li>' +
            '</ul>' +
        '</div>';
        return html;
}
