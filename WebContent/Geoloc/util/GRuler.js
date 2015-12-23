function useRuler() {

	var marker1;
	var marker2;
	var label1;
	var label2;
	var button=0;
	var dist=0;
	var line;
	var poly;
	var map = dojo.widget.byId('EasyMap').map;

	function measure(){
		if(marker1&&marker2)
			line = [marker1.getPoint(),marker2.getPoint()];
		dist=marker1.getPoint().distanceFrom(marker2.getPoint());
		dist=dist.toFixed(0)+"m";
		if(parseInt(dist)>10000){dist=(parseInt(dist)/1000).toFixed(1)+"km";}
		label1.setContents(dist);label2.setContents(dist);
		label1.setPoint(marker1.getPoint());
		label1.setContents(dist);
		label2.setPoint(marker2.getPoint());
		map.removeOverlay(poly);
		poly = new GPolyline(line,'#FFFF00', 8, 1)
		map.addOverlay(poly);
	}

	document.getElementById("useRuler").value="Cliquer sur la carte";

	GEvent.addListener(map, 'click', function(overlay,pnt) {
		if (pnt&&button==0) {
			marker1 = new GMarker(pnt,{draggable: true});
			map.addOverlay(marker1);
			marker1.enableDragging();
			label1=new ELabel(pnt, dist,"labelstyle",new GSize(2,20),60);
			map.addOverlay(label1);
			marker2 = new GMarker(pnt,{draggable: true});
			map.addOverlay(marker2);
			marker2.enableDragging();
			label2=new ELabel(pnt, dist,"labelstyle",new GSize(2,20),60);
			map.addOverlay(label2);
		}
		GEvent.addListener(marker1,"drag",function(){measure();});
		GEvent.addListener(marker1,"dblclick",function(){clr();});
		GEvent.addListener(marker2,"drag",function(){measure();});
		GEvent.addListener(marker2,"dblclick",function(){clr();});
		document.getElementById("useRuler").value="Régle";
		button++;
		});


	function clr(){
		//map.clearOverlays();
		map.removeOverlay(poly);
		map.removeOverlay(marker1);
		map.removeOverlay(marker2);
		map.removeOverlay(label1);
		map.removeOverlay(label2);
		button=0;
		document.getElementById("useRuler").value="Nouvelle";
		dist=0;
	}
}

