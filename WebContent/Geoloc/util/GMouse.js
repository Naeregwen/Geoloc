GMap2.prototype.onMouseDown = function( a ) {
  var b = null;
  if ( a ) {
    var c = va( a, this.container );
    b = this.containerCoordToLatLng(c)
  }
  GEvent.trigger(map,"mousedown",b);
  if ( ( a.button != null && a.button == 2 ) ||
       ( a.which != null && a.which == 3 ) )
    GEvent.trigger(map,"rightclick",b);
  if ( ( a.button != null && a.button == 1 ) ||
       ( a.which != null && a.which == 4 ) )
    GEvent.trigger(map,"middleclick",b);
};

GMap2.prototype.onDoubleClick = function(a) {
  if(!this.draggingEnabled()){return}
  var b = va(a,this.container);
  if ( this[GEvent.getPropertyName("dblclick")] ) {
    var p = this.containerCoordToLatLng( b );
    GEvent.trigger( this, "dblclick", p );
  } else {
    var c=Math.floor(this.viewSize.width/2)-b.x;
    var d=Math.floor(this.viewSize.height/2)-b.y;
    this.pan(c,d)
  }
};

GPoint.prototype.scaleRelative = function(a,b) {
	if ( b == null ) b = 1;
	if ( b < 0 ) b *= 0.5;
	b *= 2;
	var nx = ((this.x - a.x) / b) + a.x;
	var ny = ((this.y - a.y) / b) + a.y;
	return new GPoint( nx, ny );
};

GPoint.prototype.slope = function(a) {
	return (this.y-a.y) / (this.x-a-x == 0 ? 1 : this.x-a-x);
};

GMap2.prototype.mouseLatLng = function() {
	return this.containerCoordToLatLng( new GPoint( this.lastX, this.lastY ) );
};

GMap2.prototype.initializeMap=function(){
var self = this;

GEvent.addBuiltInListener(this.container,"mousemove",function(a) {
	self.lastX = a.offsetX || a.pageX;
	self.lastY = a.offsetY || a.pageY;
});

if ( this.container.addEventListener )
	this.container.addEventListener('DOMMouseScroll', function(a) {
		var p = self.mouseLatLng();
		if ( a.detail * -40 >= 120 )
			GEvent.trigger( self, "wheelup", p );
		else
			GEvent.trigger( self, "wheeldown", p );
  }, false);
else
	this.container.onmousewheel = function() {
		var p = self.mouseLatLng();
		if ( event.wheelDelta >= 120 )
			GEvent.trigger( self, "wheelup", p );
		else
			GEvent.trigger( self, "wheeldown", p );
	  return false;
  };

	// Copied from the API
this.deleteTiles();this.tileImages=[];this.overlayImages=[];this.calculateTileMeasurements();this.loadTileImages()}

function l(a){return Math.round(a)+"px"}
function X(a,b,c){this.anchor=a;this.offsetWidth=b||0;this.offsetHeight=c||0}
X.prototype.apply=function(a){a.style.position="absolute";a.style[this.getWidthMeasure()]=l(this.offsetWidth);a.style[this.getHeightMeasure()]=l(this.offsetHeight)};
X.prototype.getWidthMeasure=function(){switch(this.anchor){case 1:case 3:return"right";default:return"left"}};
X.prototype.getHeightMeasure=function(){switch(this.anchor){case 2:case 3:return"bottom";default:return"top"}};
function A(a){if(u.type==1){window.event.cancelBubble=true;window.event.returnValue=false}else{a.cancelBubble=true;a.preventDefault();a.stopPropagation()}}
function Ma(a){var b={"x":0,"y":0};while(a){b.x+=a.offsetLeft;b.y+=a.offsetTop;a=a.offsetParent}return b}
function va(a,b) {if(typeof a.offsetX!="undefined"){var c=a.target||a.srcElement;var d=Yc(c,b);return new GPoint(a.offsetX+d.x,a.offsetY+d.y)}else if(typeof a.pageX!="undefined"){var e=Ma(b);return new GPoint(a.pageX-e.x,a.pageY-e.y)}else{y.incompatible("dblclick");return new GPoint()}}
function Yc(a,b){var c={"x":0,"y":0};while(a&&a!=b){c.x+=a.offsetLeft;c.y+=a.offsetTop;a=a.offsetParent}return c}
