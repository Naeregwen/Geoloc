/*-------------------------------------------------------*/
// Extension des objets DOMElement
// On stocke toutes les methodes dans un objet Element
if (!window.Element) {
  Element = {};
}


/** Renvoie le tableau des elements de type tagName enfants de element
 * Si tagName vaut *, renvoie tous les elements enfants */
Element.getChildElements = function(element, tagName) {
  var result = [];
  var name = tagName.toLowerCase();
  for (var i=0 ; i<element.childNodes.length ; i++) {
    var child = element.childNodes[i];
    if (child.nodeType == 1) { // C'est un element
      if (name == "*" || child.nodeName.toLowerCase() == name) {
        result.push(child);
      }
    }
  }
  return result;
};

/** Enleve les noeuds texte vides enfants de l'element */
Element.cleanWhiteSpace = function(element) {
  for (var i = 0; i < element.childNodes.length; i++) {
    var node = element.childNodes[i];
    if (node.nodeType == 3 && !(/\S/.test(node.nodeValue))) {
      element.removeChild(node);
    }
  }
};

/** Applique a element le style specifie.
 * style est un objet dont les proprietes sont des directives CSS
 * telles qu'utilisees en javascript (ex: fontStyle et non font-style)
 */
Element.setStyle = function(element, style) {
  for (directive in style) {
    element.style[directive] = style[directive];
  }
};

/** Deplace un noeud ou plusieurs d'un parent a un autre 
 * @param children noeud ou tableau de noeuds a deplacer
 * @newParent nouveau parent a donner au noeud
 */
Element.move = function(children, newParent) {
  if (!(children instanceof Array)) {
    children = [children];
  }
  for (var i=0 ; i<children.length ; i++) {
    child = children[i];
    newParent.appendChild(child.parentNode.removeChild(child));
  }
};

/** (inutilise)
 * Applique a l'element HTML element le style specifie
 * style est un objet dont les proprietes sont des directives CSS
 * telles qu'utilisees en javascript (ex: fontStyle et non font-style)
 * Si defaultStyle (optionnel) est present, applique ses directives
 * non presentes dans style.
 */
Element.setStyleOrDefaultStyle = function(element, style, defaultStyle) {
  // Appliquer le style
  for (directive in style) {
    element.style[directive] = style[directive];
  }
  if (defaultStyle) {
    // Appliquer les directives de defaultStyle absentes de style
    for (directive in defaultStyle) {
      element.style[directive] = element.style[directive] || defaultStyle[directive];
    }
  }
};

/** Coordonnee left de l'element */
Element.getLeft = function(element) {
  var offsetLeft = 0;
  // On cumule les offset de tous les elements englobants
  while (element !== null) {
    offsetLeft += element.offsetLeft;
    element = element.offsetParent;
  }
  return offsetLeft;
};

/** Coordonnee top de l'element */
Element.getTop = function(element) {
  var offsetTop = 0;
  // On cumule les offset de tous les elements englobants
  while (element !== null) {
    offsetTop += element.offsetTop;
    element = element.offsetParent;
  }
  return offsetTop;
};


/*-------------------------------------------------------*/
/** Unicode */
Keys = {
  TAB:      9,
  ENTER:    13,
  ESCAPE:   27,
  PAGE_UP:   33,
  PAGE_DOWN:34,
  END:       35,
  HOME:      36,
  LEFT:     37,
  UP:       38,
  RIGHT:    39,
  DOWN:     40
};


/*-------------------------------------------------------*/
/** DOM event */

if (!window.Event) {
  Event = {};
}

Event.event = function(event) {
  // W3C ou alors IE
  return (event || window.event);
};

Event.target = function(event) {
  return (event) ? event.target : window.event.srcElement ;
};

Event.preventDefault = function(event) {
  var evt = event || window.event;
  if (evt.preventDefault) { // W3C
    evt.preventDefault();
  }
  else { // IE
    evt.returnValue = false;
  }
};

Event.stopPropagation = function(event) {
  var evt = event || window.event;
  if (evt.stopPropagation) {
    evt.stopPropagation();
  }
  else {
    evt.cancelBubble = true;
  }
};


function getRadioValue(radioObj) {
	if (!radioObj) {	return ""; }
	var radioLength = radioObj.length;
	if (radioLength === undefined) {
		return radioObj.checked ? radioObj.value : "";
	}
	for (var i = 0; i < radioLength; i++) {
		if(radioObj[i].checked) {
			return radioObj[i].value;
		}
	}
	return "";
}

function setRadioValue(radioObj, newValue) {
	if (!radioObj) { return; }
	var radioLength = radioObj.length;
	if (radioLength === undefined) {
		radioObj.checked = (radioObj.value == newValue.toString());
		return;
	}
	for(var i = 0; i < radioLength; i++) {
		radioObj[i].checked = false;
		if(radioObj[i].value == newValue.toString()) {
			radioObj[i].checked = true;
		}
	}
}

