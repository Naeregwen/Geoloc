/** @class
 * Liste popup d'options possibles pour un champ de saisie
 * @constructor
 * @param source element HTML (champ de saisie) associe a la liste
 */
function PopupList(source) {
  /** Element div contenant les options  @type HTMLElement */
  this.list = document.createElement("div");
  document.body.appendChild(this.list);
  /** Rang de l'option selectionnee (-1 au depart) @type int*/
  this.index = -1;
  /** Element (champ de saisie) auquel la popup est rattachee 
   * @type HTMLElement */
  this.source = source;
  // Initialiser
  this.setLayout();
  this.hide();
  this.setBehaviour();
}

PopupList.prototype = {  
  /** Initialiser la popup de suggestion */
  setLayout: function() {
    // Donner au div l'apparence d'une popup
    this.list.style.background = "Window";
    this.list.style.border = "solid 1px WindowText";
    this.list.style.padding = "2px";
    // La masquer au debut
    this.list.style.display = "block";
    // La positionner juste sous le champ de saisie
    this.list.style.position = "absolute";
    this.list.style.left = Element.getLeft(this.source) + "px";
    this.list.style.top = (Element.getTop(this.source) + 
      this.source.offsetHeight) + "px";
  },
  
  /** Supprimer toutes les options et masquer la popup */
  clear: function() {
    this.list.style.display = "none";
    this.list.innerHTML = "";
    this.index = -1;
  },

  /** Afficher la popup si elle a des options */
  display: function() {
    if (this.list.childNodes.length > 0) {
      this.list.style.display = "block";
    }
  },
  
  /** Cacher la popup */
  hide: function() {
    this.list.style.display = "none";
  },
  
  /** La liste est-elle visible 
   * @type Boolean */
  isVisible: function() {
    return this.list.style.display != "none";
  },
  
  /** Remplacer les options
   * @param values tableau des nouvelles valeurs */
  setOptions: function(values) {
    this.clear();
    if (values.length > 0) {
      var div;
      // Les proposer, s'il y en a
      for (i=0 ; i<values.length ; i++) {
        div = document.createElement("div");
        div.innerHTML = values[i];
        this.list.appendChild(div);
        // Memoriser dans l'element div son rang
        div.setAttribute("index", i);
        div.setAttribute("style", 'width:'+(this.source.offsetWidth-5)+'px');
        div.className = "option";
      }
      this.display();
    }
  },
  
  /** Valeur courante de la liste.<br/>
   * Chaine vide si pas d'option selectionnee 
   * @type String */
  getValue: function() {
    return (0 <= this.index &&
            this.index < this.list.childNodes.length) ? 
      this.list.childNodes[this.index].innerHTML :
      "";
  },
  
  /** Nombre d'options de la liste @type int */
  getLength: function() {
    return this.list.childNodes.length;
  },
  
  /** Faire reagir la popup aux mouseout, mouseover et clic.<br/>
   * mousemove met en exergue l'option ayant la souris.<br/>
   * mouveout la remet a l'etat initial.<br/>
   * clic fait disparaitre la popup et met la valeur de l'option
   * dans la source.
   */
  setBehaviour: function() {
    // Garder l'objet courant pour les on... des options
    var current = this;
	var self = this.list;
    this.list.onmouseover = function(event) {
	  self.style.cursor = 'pointer';
      var target = Event.target(event);
      if (target.className == "option") {
        current.go(target.getAttribute("index"));
        Event.stopPropagation(event);
      }
    };
    this.list.onmouseout = function(event) {
	  self.style.cursor = 'default';
      current.go(-1);
    };
    this.list.onclick = function(event) {
      current.source.value = Event.target(event).innerHTML;
      // Effacer la liste : les options ne sont plus a jour
      current.clear();
      // Redonner le focus au champ de saisie
      current.source.focus();
    };
  },
  
  
  /** Aller a l'option d'indice index, et la mettre en exergue.<br/>
   * Assure que index est dans les bornes ou bien vaut -1 :
   * this.index vaudra <br/>
   * index si 0 <= index < nombre d'options 
   * (this.list.childNodes.length),<br/>
   * -1 si index < 0 et <br/>
   * nombre d'options -1 si index >= nombre d'options */
  go: function(index) {
    var divs = this.list.childNodes;
    // Deselectionner le div selectionne
    if (-1 < this.index && this.index < divs.length) {
      divs[this.index].style.background = "Window";
      divs[this.index].style.color = "WindowText";
    }
    // Mettre a jour l'index
    if (-1 < index && index < divs.length) {
      this.index = index;
    }
    else if (index <= -1) {
      this.index = -1;
    }
    else {
      this.index = divs.length - 1;
    }
    // Mettre en exergue l'element selectionne s'il y en a un
    if (this.index != -1) {
      divs[this.index].style.background = "Highlight";
      divs[this.index].style.color = "HighlightText";
    }
  }  
};

PopupList.prototype.constructor = PopupList;
