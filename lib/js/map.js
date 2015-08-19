/*----------------------------------------------
Author: Sarah Heim
----------------------------------------------*/

var lon = -117.34;
var lat = 32.88;
var zoom = 12;
var map;
var markers;
var selectCtrl;
var lastfeature;
var exy; // location of map click
var utcMapDateTime;
var TZoffset = new Date().getTimezoneOffset(); ///difference between UTC & local (browser) time, in minutes
var procCount = 0;

OpenLayers.ProxyHost = "../../cgi-bin/asbs/proxy.cgi?url=";
var proj3857   = new OpenLayers.Projection("EPSG:3857"); //Spherical Mercator, projection same as 900913
var proj900913 = new OpenLayers.Projection("EPSG:900913"); // Original, before 3858(lat/lon in meters in x/y)
var proj4326   = new OpenLayers.Projection("EPSG:4326"); //WGS 84 (lat/lon as x/y)

var hrDate = new Date();
hrDate.setUTCMinutes(0);
hrDate.setUTCSeconds(0);
hrDate.setUTCMilliseconds(0);
// hrDateTxt = hrDate.toISOString();
var mapTimeRoot = "http://neocoweb.ucsd.edu/cgi-bin/asbs/getMap-time.py";

var size = new OpenLayers.Size(30, 30);
var offset = new OpenLayers.Pixel(-15, -15);
var crHairIcon = new OpenLayers.Icon('./lib/img/crosshair.png',size,offset);

//covers full screen with gray, and busy signal
function wholeBusyProc() { document.getElementById('wholeBusy').style.visibility = "visible"; }
// document.getElementById('wholeBusy').style.visibility = "hidden"; //Line used for testing if busy gets in the way
function wholeBusyDone() { document.getElementById('wholeBusy').style.visibility = "hidden";}
//covers Legend section with gray, and busy signal
function layerBusyProc() { document.getElementById('layerBusy').style.visibility = "visible"; }
function layerBusyDone() { document.getElementById('layerBusy').style.visibility = "hidden"; }
//covers Graph section with gray, and busy signal
function chartBusyProc() {  
    document.getElementById('chartBusy').style.visibility = "visible";
    if (myLayout.state.south.isVisible == false) {
        myLayout.open('south', false);
    } 
}
function chartBusyDone() { document.getElementById('chartBusy').style.visibility = "hidden"; }

//take utcDate and give yyyy, MM, dd, HH, mm as texts with leading zeros
function dateTexts(utcDate){
    // console.log(utcDate);
    try{
        var isoArr = utcDate.toISOString().split('T');
        var dateArr = isoArr[0].split('-');
        var timeArr = isoArr[1].split(':');
        return {yyyy: dateArr[0], MM: dateArr[1], dd: dateArr[2], HH: timeArr[0], mm: timeArr[1]};
    } catch(err) {
        console.log("internal date error:", err, "date:", utcDate);
        return {yyyy: 'yyyy', MM: 'MM', dd: 'dd', HH: 'HH', mm: 'mm'};
    }
}
//take utcDate and output date in MM/dd/yyyy
function dateFormat(utcDate) {
    var isoArr = utcDate.toISOString().split('T')[0].split('-');
    return (isoArr[1]+"/"+isoArr[2]+"/"+isoArr[0]);
}
//take utcDate and output date/time in MM/dd/yyyy HH:mm
function dateTimeFormat(utcDate) {
    return (dateTexts(utcDate).MM+"/"+dateTexts(utcDate).dd+"/"+dateTexts(utcDate).yyyy+" "+dateTexts(utcDate).HH+":"+dateTexts(utcDate).mm);
}

//when a vecter is selected
function onFeatureSelect(event) {
    if ((typeof lastfeature != 'undefined') && (lastfeature.popup)) onFeatureUnselect();
    var feature = event;
    if (feature.feature) feature = feature.feature;
    // Since KML is user-generated, do naive protection against Javascript.
    var content = '<div class="popupContent">';
    if (feature.attributes.name) {
    	content += '<h2>'+feature.attributes.name + "</h2>";
    } else if (feature.fid) {
    	content += '<h2>'+feature.fid + "</h2>";
    }
    // content += '<div class="popupContent">';
    if (feature.attributes.description) content += feature.attributes.description;
    if (feature.attributes.urlDesc) {
		$.ajax({
	        url: feature.attributes.urlDesc,
	        type: 'GET',
	        crossDomain: true,
	        dataType: 'html',
	        async: false,
	        success: function(html) {
	        	content += html;
	        },
	        error: function(request,error) { 
	        	content += "Error: retrieving feature selection"; 
	        }
		});
    }
    if (content.search("<script") != -1) {
        content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
    }
    content+='</div>'
	popup = new OpenLayers.Popup.FramedCloud("featurePopup", 
		feature.geometry.getBounds().getCenterLonLat(),
		null, //new OpenLayers.Size(100,100),
		content,
		null, true, onPopupClose);

	feature.popup = popup;
	map.addPopup(popup);
	// GLOBAL variable, in case popup is destroyed by clicking CLOSE box
	lastfeature = feature;
}
//called when balloon popup is closed ("x")
function onPopupClose(evt) { 
	// selectCtrl.unselectAll(); 
	selectCtrl.unselect(lastfeature);
	OpenLayers.Event.stop(evt);
}
	
//call to remove balloon
function onFeatureUnselect(event) {
    var feature = lastfeature;
    if(feature.popup) {
        map.removePopup(feature.popup);
        // map.removePopup(feature);
        feature.popup.destroy();
        delete feature.popup;
    }
}

//page initializing
function init(){	
	wholeBusyProc();
	layerBusyDone();
	chartBusyDone();
	setTZOfromBrowser();
	addMapTimes();
	setMapTime();
	adjustMapTime(-3);
	setBrowserTimes();
	var pgW = $(window).width();
    var pgH = $(window).height();
    if (pgW < 850 || pgH < 500) {alert ("This page was configured to be viewed on a larger screen.");}
	window.setInterval(function(){setBrowserTimes()},10000);
    map = new OpenLayers.Map( 'map', {
    	projection: "EPSG:900913",
    	displayProjection: proj4326,
    	controls: [
    		new OpenLayers.Control.Navigation({
    			zoomWheelEnabled:true, 
    			handleRightClicks:true
    		}),
    		new OpenLayers.Control.SelectFeature(),
    		new OpenLayers.Control.PanZoom(),
    		new OpenLayers.Control.MousePosition()
    		// new OpenLayers.Control.OverviewMap(),
    		// layerSwitcher
    	]
    } );
    window.onresize = function () { setTimeout( function() { map.updateSize(); }, 200); }
    // $( "#map" ).resize(function () { setTimeout( function() { map.updateSize(); console.log("resized");}, 200); });

    setLayers();

	// addLayerSwitcherMenu(groups);
	var nonBase = 0;
	var loadendNum= 0;
	$(addLayersArr).each( function(i, lyr){
		if (lyr.isBaseLayer == false) {
			nonBase += 1;
			//layers added (not loaded) 
			lyr.events.register("added", lyr, function () {
				loadendNum += 1;
				if (nonBase == loadendNum) {
					addLayerSwitcherMenu(groups);
				}
			});
    	    lyr.events.register("loadstart", lyr, function (){
    	        // console.log("loadstart", dateTimeFormat(utcMapDateTime), utcMapDateTime.toLocaleString(), lyr.id);
                layerBusyProc();
            });

            // lyr.events.register("loadend", lyr, addToLegend);
            lyr.events.register("loadend", lyr, function (e) {
                if (lyr.metadata["legendAdded"]) {
                    if (document.getElementById(lyr.id.split(".").pop()+"-dataTime")) { 
                        getDataTime(lyr);        
                    }
                    layerBusyDone();
                } else { 
                    addToLegend(e);
                }
            });
			lyr.events.register("visibilitychanged", lyr, function () {
				if (lyr.getVisibility()) {
				    if (lyr.CLASS_NAME == "OpenLayers.Layer.WMS") {
                        lyr.mergeNewParams({'time':utcMapDateTime.toISOString()});
                    }
				    /// keep track of if the layer has been loaded
					if (lyr.metadata["loaded"]) {
					    /// refresh vector if it's been previously loaded
                        if (lyr.CLASS_NAME == "OpenLayers.Layer.Vector") {
                            // console.log("reFRESHing", lyr.id, lyr.metadata["loaded"]);
                            lyr.refresh({force: true});
					    // } else if (lyr.CLASS_NAME == "OpenLayers.Layer.Image") {
					        // console.log("reDRAWing", lyr.id, lyr.metadata["loaded"]);
					        // lyr.redraw();
					    } else {
					        console.log("ELSE ?");
					    }
					}
					if ((lyr.metadata["maxZoom"]) && (lyr.metadata["maxZoom"]) < map.getZoom()) {
					    alert("This layer is not visible at this zoom level. Zoom out to see layer.");
					}
					lyr.metadata["loaded"] = true;
				} else {
				    // If unchecked layer has a popup open, close it
				    if ((typeof lastfeature != 'undefined') && (lastfeature.popup) && (lyr.id == lastfeature.layer.id)) onFeatureUnselect();
					remFromLegend(lyr.id);
				}
			});
		}
	});		
    map.addLayers(addLayersArr);
    	
	var hili = new OpenLayers.Control.SelectFeature(vectorsArr, {
		hover: true, 
		highlightOnly: true,
		renderIntent: "hover",
	});
	selectCtrl = new OpenLayers.Control.SelectFeature(vectorsArr, {
		onSelect: onFeatureSelect, 
        onUnselect: onFeatureUnselect,
		clickout: true
	});
    
    map.addControl(hili);
    map.addControl(selectCtrl);
    hili.activate();
    selectCtrl.activate(); 

    //if lat/lon/zoom are in the URL use them, otherwise use default
    if ((getURLval("lat") != "") && (getURLval("lon") != "")) {
    	if (getURLval("zm") != "") {
    		setMapCenter(getURLval("lon"), getURLval("lat"), getURLval("zm"));
    	} else {
    		setMapCenter(getURLval("lon"), getURLval("lat"), zoom);    		
    	}
    	
    } else {
    	setMapCenter(lon, lat, zoom);
    }
	
	
	//custom baselayer drop down
	var baseLayers = map.getLayersBy("isBaseLayer", true);
	$(baseLayers).each( function(i, lyr){
		// console.log(lyr.name, lyr.id);
		$("#basemaps").append(new Option(lyr.name, lyr.id));
	});
	//listen to drop down to change baselayer
	$('#basemaps').change(function() {
  		$("#basemaps option:selected").each(function () {
                str = $(this).val();
        });
        map.setBaseLayer(map.getLayer(str));
	});
	
	map.events.register("click", map, function(e) {
		
		if ($("#chartLayer option").first().val() == 'x') {
			//Do nothing
			alert("Add a layer with time series available first");
		} else {
			///non vector layers are added to the top of the drop down list when they're added to the map' 
			if ($("#chartLayer").val() == 'x') {
				$("#chartLayer").removeAttr('disabled');
				$("#chartLayer option").first().attr('selected', 'selected');
			};
			exy = e.xy;
			var xy = map.getLonLatFromViewPortPx(e.xy); //getLonLatFromViewPortPx & getLonLatFromPixel return same value
	    	// markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(xy.lon, xy.lat), crHairIcon));
			markers = new OpenLayers.Layer.Markers( "Markers" );
			markers.addMarker(new OpenLayers.Marker(xy, crHairIcon));
			map.addLayer(markers);
			$("#chartLayer").disabled = false;
			$("#vectOpt").disabled = true;
			
			setGraph();
		} 
	});
	$("#duration").change(function(){ if (/^(?!Selection)/.test(document.getElementById("chart").innerHTML)) { setGraph() } });
	$("#chartLayer").change(function(){ if (/^(?!Selection)/.test(document.getElementById("chart").innerHTML)) { setGraph() }; });
	wholeBusyDone();
}

//default latitude, longitude, zoom
function setMapCenter(lo, la, z) {
    map.setCenter(new OpenLayers.LonLat(lo, la).transform(proj4326, map.getProjectionObject()), z);
}

// Finds the querystring, everything after the ?
function getURLval(varname) {
  var query = window.location.search.split("?").pop();
  if (query.length == 0) { return ""; }
  var vars = query.split("&");
  var value = "";
  for (i=0;i<vars.length;i++)
  {
    var parts = vars[i].split("=");
    if (parts[0].toLowerCase() == varname) {
      value = parts[1];
      break;
    }
  }
  value = unescape(value); // Convert escape code
  value.replace(/\+/g," "); // Convert "+"s to " "s
  return value.toLowerCase();
}


//adds layers to Layers section
function addLayerSwitcherMenu(groups) {
	// swId = 0;
	var layerMenu = document.getElementById("layerswitcher");
	for (group in groups) {
		// console.log("Group:", group);
		$(groups[group]).each( function (i, grpLyr) {
			if (map.getLayersByName(grpLyr.name)) {
				// console.log(grpLyr.id, grpLyr.name, grpLyr.CLASS_NAME);
				var row=layerMenu.insertRow(0);
				var cellCheck=row.insertCell(0);
				var cellIcon=row.insertCell(1);
				var cellLbl=row.insertCell(2);
				var cellInfo=row.insertCell(3);
				cellCheck.style.width = "20px";
				cellIcon.style.width = "18px";
				
				if (grpLyr.styleMap != hiddenStyle) {
				    var checkbox = document.createElement('input');
                    checkbox.type = "checkbox";
                    checkbox.name = grpLyr.name;
                    checkbox.value = grpLyr.id;
                    checkbox.checked = grpLyr.getVisibility();
                    checkbox.onchange = function() {map.getLayer(this.value).setVisibility(this.checked)};
                    cellCheck.appendChild(checkbox);
				}
				
				
				
				var label = document.createElement('label');
				label.innerHTML = grpLyr.name;
				cellLbl.appendChild(label);
				//metadata
				if (grpLyr.metadata["info"]) {
					var infoImg = document.createElement('img');
					infoImg.style.width = "18px";
					infoImg.style.width = "18px";
					infoImg.src = './lib/img/info.png';
					infoImg.alt = "info";
					infoImg.setAttribute("onclick", "showInfo('"+grpLyr.id+"')")
					cellInfo.appendChild(infoImg);
				}
				
				if (grpLyr.CLASS_NAME == "OpenLayers.Layer.Vector") {
					cellIcon.appendChild(canvasIcon(grpLyr));
				} else {
					var icon = document.createElement('img');
					icon.setAttribute('src', './lib/img/layer.png');
					cellIcon.appendChild(icon);
				}
			}
		});
		var row=layerMenu.insertRow(0);
		// row.style.background = "#5692D2"; 
		var hdr=row.insertCell(0);
		hdr.colSpan = 4;
		hdr.className = "grpHdr";
		var label = document.createElement('label');
		label.innerHTML = "&nbsp;"+group;
		hdr.appendChild(label);
	}
}
//adds hours 00:00 - 23:00 to maptime dropdown (bottom of center map section)
function addMapTimes() {
    for (var h=0;h<24;h++) {
        if (h<10) { hTxt = "0"+h; }
        else { hTxt = h; }
        // console.log(h);
        var option=document.createElement("option");
        option.text= hTxt+":00";
        option.id="";
        option.value=h;
        $('#mapTime').append(option);
    }
    $('#mapTime').val(hrDate.getHours());
    // console.log(hrDate.getUTCHours(), hrDate);
}

/// Take map date, time and timezone to display UTC datetime
function setMapTime(){
    // var mapDatepicker = $("#mapDate").datepicker("getDate").getTime();
    var mapDatepickerArr = $("#mapDate").val().split("/");
    var utcMapDate = Date.UTC(mapDatepickerArr[2], mapDatepickerArr[0]-1, mapDatepickerArr[1]);
    var mapTimeMS = $("#mapTime").val()*60*60*1000;
    var adjustMS = $('#tzoSel').val()*60*1000;
    var local = new Date(utcMapDate +mapTimeMS);
    utcMapDateTime = new Date(local.getTime()-adjustMS);
    $("#utcMapTime").text(dateTimeFormat(utcMapDateTime));  
    // console.log("setMapTime (UTC):", local.toString(), utcMapDateTime.toISOString());
}

/// Sets/updates local and utc browser times
function setBrowserTimes() {
    tzoAdj = parseInt($('#tzoSel').val());
    localBrowserEpoch = new Date().getTime() + (tzoAdj*60*1000);
    $("#localBrowserTime").text(dateTimeFormat(new Date(localBrowserEpoch)));
    $("#utcBrowserTime").text(dateTimeFormat(new Date()));
}

//Called when maptime is adjusted (buttons). Updates Image/WMS layers acording to time.
function changedMapTime(){
    setMapTime();
    /// loop through displayed layers
    var lyrsArr = []; /// Array contains list of layers changed
    var mrkCopy = (markers) ? markers.markers[0] : null;
    var table = document.getElementById("layerLegend");
    /// Adjust all appropriate layer images to the selected Map Date Time
    $(table.rows).each( function(i, row) {
        var lyrId =  row.cells[0].value;
        var lyr = map.getLayer(lyrId);
        /// If layer hasn not been updated
        if (lyrsArr.indexOf(lyrId) == -1) {
            if (lyr.CLASS_NAME == "OpenLayers.Layer.WMS") {
                lyr.mergeNewParams({'time':utcMapDateTime.toISOString()});
            } else if (lyr.CLASS_NAME == "OpenLayers.Layer.Image") {
                lyr.setUrl(urlAdjVar(lyr.url, 'ts', (utcMapDateTime.getTime())/1000));
            } else if (lyr.CLASS_NAME == "OpenLayers.Layer.XYZ") {
                lyr.redraw();
            }
            lyrsArr.push(lyrId);
        }
    });
    
    /// If marker was removed while updating WMS's, add it back 
    setTimeout(function(){  
        // if ((typeof markers == 'undefined') || (typeof markers.markers == 'undefined') || (markers.markers == null)) {
        if ((typeof markers == 'undefined') && (mrkCopy)) {
            markers = new OpenLayers.Layer.Markers( "Markers" );
            markers.addMarker(mrkCopy);
            map.addLayer(markers);
        } 
    }, 2000);
    // ///Change the Time Series date picker start and end times
    // $( "#datepickerEnd" ).datepicker('setDate', $("#mapDate").val());
    // var dur = (parseInt($("#duration").val()) < 604800) ? 604800000 : parseInt($("#duration").val())*1000;
    // startDate = new Date(utcMapDateTime.getTime()-dur);
    // $( "#datepickerSt" ).datepicker('setDate', dateFormat(startDate));
    // document.getElementById("pick").checked = true;
    // if (/^(?!Selection)/.test(document.getElementById("chart").innerHTML)) { setGraph() };
}

//Sets timezone according to browser offset, else +00:00
function setTZOfromBrowser() {
    try {
        setTZOsel = TZoffset *-1;
        $('#tzoSel').val(setTZOsel);
    } catch (err) {
        alert("Timezone not recognized");
        $('#tzoSel').val(0);
    }
}

//creates a icon, using OpenLayer's canvas. Used for Layers and Legend sections. 
function canvasIcon(lyr, attr) { //optional attribute(s)
	// grName = grName || null;
	attr = attr || {};
	// console.log(attr);
	var icon = document.createElement('div');
	icon.setAttribute('style', 'width:16px;height:16px;');
	// console.log(attr, lyr.styleMap);
	var layerIcon = new OpenLayers.Layer.Vector(null, {styleMap: lyr.styleMap, isBaseLayer: true, renderers: ["Canvas"]});
	//if point|line|poly
	if (lyr.metadata["legendType"] == 'line')  {
		layerIcon.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.fromWKT("LINESTRING(10 10, -10 -10)"), attr)]);
	} else if (lyr.metadata["legendType"] == 'poly') {
		layerIcon.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.fromWKT("POLYGON((7 7, -7 7, -7 -7, 7 -7, 7 7))"), attr)]);
	} else {
		layerIcon.addFeatures([new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0, 0), attr)]);
	}
	var layerLegendCanvas = new OpenLayers.Map({
	    div: icon,
	    controls: [], layers: [layerIcon], center: new OpenLayers.LonLat(0, 0), zoom: 0 
	});
	return icon;
}

//on layer load, add layer to Legend section
function addToLegend(e) {
    var lyrRowsNum = 0;
    ///takes either layerID (string) or event object
    if (typeof(e) == 'string') {
        var lyrId = e;
    } else {
        var lyrId = e.object.id;
    }
	var lyr = map.getLayer(lyrId);
	var layerMenu = document.getElementById("layerLegend");
	var skipName = false;
	
	///Add individual items (in reverse order bottom to top so they appear in correct order)
	if ((lyr.CLASS_NAME == "OpenLayers.Layer.Vector") && (lyr.features.length < 100) && (!("selOpts" in lyr.metadata))) {
		$(lyr.features.reverse()).each( function(i, feat){
			var featRow=layerMenu.insertRow(0);
			lyrRowsNum +=1;
			ftIcon = featRow.insertCell(0);
			ftIcon.value = lyr.id;
			ftIcon.appendChild(canvasIcon(lyr, feat.attributes));
			var cellLbl=featRow.insertCell(1);
			cellLbl.innerHTML = '<a href="#" onclick="onFeatureSelect(map.getLayer('+"'"+lyr.id+"'"+').getFeatureById('+"'"+feat.id+"'"+'));">'+feat.fid+"</a>";
		});
    ///Add XYZ image time
    } else if (lyr.CLASS_NAME == "OpenLayers.Layer.XYZ") {
        if (lyr.metadata["dataTimeUTC"]) {
            addDataTimeRow(lyr, layerMenu);
            if (!("selOpts" in lyr.metadata)) getDataTime(lyr); 
        } 
        
        if (lyr.metadata["getFtInfoUrlBase"]) {
            ///add as option to chart layer drop down
            var option=document.createElement("option");
            option.text=lyr.name;
            option.id="";
            option.value=lyrId;
            ///select layer if no chart is made
            if (typeof chart == 'undefined') option.selected=true;
            $('#chartLayer').prepend(option);
        }

	///Add WMS legend image
	} else if (lyr.CLASS_NAME == "OpenLayers.Layer.WMS") {
        addDataTimeRow(lyr, layerMenu);
        if (!("selOpts" in lyr.metadata)) getDataTime(lyr); 
	    
		/// LAYERS is right, ASA uses LAYER. Having both works.
		var getLeg = lyr.url+"REQUEST=GetLegendGraphic&STYLES=&FORMAT=image%2Fpng&LAYER="+lyr.params.LAYERS+"&LAYERS="+lyr.params.LAYERS; 
		var wmsRow=layerMenu.insertRow(0);
		lyrRowsNum +=1;
		var cellEmpty=wmsRow.insertCell(0);
		cellEmpty.style.width = "20px";
		cellEmpty.value = lyr.id;
		var cellImg=wmsRow.insertCell(1);
		cellImg.colSpan = 3;
		cellImg.value = lyr.id;
		var infoImg = document.createElement('img');
		infoImg.src = getLeg;
		infoImg.onerror = function() {this.style.display = "none";}
		// infoImg.alt = "legend";
		cellImg.appendChild(infoImg);
        
        // !!! Add row that can adjust opacity	

		///add wms as option to chart layer drop down
		var option=document.createElement("option");
		option.text=lyr.name;
		option.id="";
		option.value=lyrId;
		///select layer if no chart is made
		if (typeof chart == 'undefined') option.selected=true;
		$('#chartLayer').prepend(option);
	} else if (lyr.CLASS_NAME == "OpenLayers.Layer.Image") {
       addDataTimeRow(lyr, layerMenu);
       if (!("selOpts" in lyr.metadata)) getDataTime(lyr);
	}

    //If layer has bookmarks, add them
    if (lyr.metadata["lyrBookmarks"]) {
        bkmId = lyr.id.split(".").pop()+"-bkmrks";
        if (!document.getElementById(bkmId)) {
            bTblRow=layerMenu.insertRow(0);
            lyrRowsNum +=1;
            bTblCell=bTblRow.insertCell(0);
            bTblCell.id = bkmId;
            bTblCell.colSpan = 3;
            bTblCell.value = lyr.id;
            bkmTbl = document.createElement('table');
            for (var loc in lyr.metadata["lyrBookmarks"]) {
                locArr = lyr.metadata["lyrBookmarks"][loc];
                var bkmkRow=bkmTbl.insertRow(0);
                lyrRowsNum +=1;
                var bkmk0 = bkmkRow.insertCell(0);
                bkmk0.value = lyr.id;
                var bkmk = bkmkRow.insertCell(1);
                bkmk.innerHTML = '<a href="#" onclick="setMapCenter('+locArr[0]+','+locArr[1]+','+locArr[2]+');">'+loc+'</a>';
            }
            var bkmkLblRow=bkmTbl.insertRow(0);
            lyrRowsNum +=1;
            var bkmkLbl = bkmkLblRow.insertCell(0);
            bkmkLbl.value = lyr.id;
            bkmkLbl.colSpan = 3;
            bkmkLbl.innerHTML = "<i>Location Bookmarks:</i>"
            bTblCell.appendChild(bkmTbl);
        }
    }

    ///Add legend image if there is one
    if (lyr.metadata["legendImg"]) {
        var legRow=layerMenu.insertRow(0);
        lyrRowsNum +=1;
        var lyrLegend=legRow.insertCell(0);
        lyrLegend.colSpan = 3;
        lyrLegend.innerHTML = '<img src="'+lyr.metadata["legendImg"]+'" alt="layer legend">'
        lyrLegend.value = lyr.id;
    }
    
    ///If a non-WMS layer has an image url in the metadata, display it above the features
    if (lyr.metadata["vPtLegend"]) {
        tblRow=layerMenu.insertRow(1);
        lyrRowsNum +=1;
        tblCell=tblRow.insertCell(0);
        tblCell.colSpan = 3;
        tblCell.value = lyr.id;
        iconTbl = document.createElement('table');
        iconTbl.className= "tblKey";
        for (v in lyr.metadata["vPtLegend"].reverse()) {
            legRow=iconTbl.insertRow(0);
            lyrRowsNum +=1;
            vIcon=legRow.insertCell(0);
            vIcon.style.borderStyle = "none";
            // vIcon.appendChild(canvasIcon(lyr, lyr.metadata["vPtLegend"][v][0]));
            vIcon.appendChild(canvasIcon(lyr, {type:lyr.metadata["vPtLegend"][v][0]}));
            vLbl=legRow.insertCell(1);
            vLbl.innerHTML = lyr.metadata["vPtLegend"][v][1];
            vLbl.className = "lblKey";
        }
        tblCell.appendChild(iconTbl);
    }

	//If layer has options, "selOpts""
	if (lyr.metadata["selOpts"]) {
	    legId = lyr.id.split(".").pop()+"-legend";
	    if (!document.getElementById(legId)) {
    		oTblRow=layerMenu.insertRow(0);
    		lyrRowsNum +=1;
    		oTblCell=oTblRow.insertCell(0);
    		oTblCell.colSpan = 3;
    		oTblCell.value = lyr.id;
    		optTbl = document.createElement('table');
    		optTbl.className= "optionsTbl";
    		var optLeg = "";
    		for (var opt in lyr.metadata["selOpts"]["list"]) {
    			optDict = lyr.metadata["selOpts"]["list"][opt];
    			optName = optDict["name"];
    			optRow=optTbl.insertRow(0);
    			lyrRowsNum +=1;
    			var optCell=optRow.insertCell(0);
    			optCell.value = lyr.id;
    			var optLbl = document.createElement('label');
    			optLbl.innerHTML = optName+":\t";
    			var optDD = document.createElement('select');
    			optDD.id = lyr.id.split(".").pop()+"-"+opt;
    			for (var optOpts in optDict["sublist"]) {
    			    ooName = optDict["sublist"][optOpts]["name"];
    			    if (optDict["sublist"][optOpts]["legendImg"]) optLeg = opt;
    			    var newOpt = new Option(ooName, optOpts);
    			    // if (optDict["sublist"][optOpts]["selIndex"]) newOpt.selectedIndex = optDict["sublist"][optOpts]["selIndex"];
			        if (optDict["sublist"][optOpts]["selected"]) {
    			        // console.log(ooName);
    			        newOpt.selected = true;
    			    };
    				$(optDD).append(newOpt);
    			}
    			optDD.onchange = function() {
    			    changeOpt(lyr);
    			};
    			optCell.appendChild(optLbl);
    			optCell.appendChild(optDD);
    		}
    		oTblCell.appendChild(optTbl);
            if (optLeg != "") {
                optLegRow=layerMenu.insertRow(0);
                lyrRowsNum +=1;
                optLegCell=optLegRow.insertCell(0);
                optLegCell.id = legId;
                optLegCell.colSpan = 3;
                optLegCell.value = lyr.id;
                optLegCell.title = optLeg;
            }
        } else {
            skipName = true;
        } 
		changeOpt(lyr);
	} else {
	    // for layer with NO "selOpt" but has "groupKey" 
	    if (lyr.metadata["groupKey"]) {
	        addLegendKey_oneParam(lyr);
	    }
	}
	
    ///Add legend note if there is one
    if (lyr.metadata["legendNote"]) {
        var noteRow=layerMenu.insertRow(0);
        lyrRowsNum +=1;
        lyrNote=noteRow.insertCell(0);
        lyrNote.className = "legNote";
        lyrNote.colSpan = 3;
        lyrNote.innerHTML = "Note: "+lyr.metadata["legendNote"];
        lyrNote.value = lyr.id;
    }
    
	///Add layer name row (extent option if vector or image)
	if (!skipName) {
	    var row=layerMenu.insertRow(0);
	    lyrRowsNum +=1;
        row.className = "legendLayerRow";
        
        var lyrPlusMinus=row.insertCell(0);
        lyrPlusMinus.value = lyr.id;
        var pmImg = document.createElement('img');
        pmImg.src = './lib/img/minus.png';
        pmImg.alt = '-';
        pmImg.setAttribute("onclick", "toggleLayer('"+lyr.id+"')")
        lyrPlusMinus.appendChild(pmImg);
        
    	if (lyr.CLASS_NAME != "OpenLayers.Layer.WMS")  {
    		// If a non-WMS layer has an extent, show an extent button
    		if ((lyr.extent) || (lyr.getDataExtent())) {
    			if (lyr.getDataExtent()) {extFun = 'getDataExtent()'}
    			else {extFun = 'extent'}
    			var lyrName=row.insertCell(1);
    			lyrName.innerHTML = lyr.name;
    			lyrName.value = lyr.id;
    			var extra=row.insertCell(2);
    			extra.innerHTML = '&nbsp;&nbsp;<a href="#" onclick="map.zoomToExtent(map.getLayer('
    			+"'"+lyr.id+"'"+').'+extFun+');"><img src="./lib/img/extent.png" alt="extent"></a>';
    		} else {
                var lyrName=row.insertCell(1);
                lyrName.colSpan = 2;
                lyrName.innerHTML = lyr.name;
                lyrName.value = lyr.id;
            }
    	} else {
    		var lyrName=row.insertCell(1);
    		lyrName.colSpan = 2;
    		lyrName.innerHTML = lyr.name;
    		lyrName.value = lyr.id;
    	}
    }

	/// If there's more than 9 vector features, have layer legend section closed
	if ((lyr.CLASS_NAME == "OpenLayers.Layer.Vector") && (lyrRowsNum > 40)) {
		toggleLayer(lyr.id);
	}
	lyr.metadata["legendAdded"] = true;
	layerBusyDone();
}

//Adds a row for legend image
function addLegendImgRow(lyr, title, menu, link) {
    var legImgRow = menu.insertRow(0);
    var legImgRowCell = legImgRow.insertCell(0);
    legImgRowCell.id = lyr.id.split(".").pop()+"-legend";
    legImgRowCell.colSpan = 3;
    legImgRowCell.value = lyr.id;   
    legImgRowCell.title = title;
    legImgRowCell.innerHTML = '<img src="'+link+'" alt="layer legend">'
}

//Adds a row for the (WMS/Image) layers that have a datetime
function addDataTimeRow(lyr, menu) {
    /// Add data time line
    var dataTimeRow = menu.insertRow(0);
    var dataTimeCell = dataTimeRow.insertCell(0);
    dataTimeCell.id = lyr.id.split(".").pop()+"-dataTime";
    dataTimeCell.colSpan = 3;
    dataTimeCell.value = lyr.id;
}

//Removes layer from Legend section, when unchecked
function remFromLegend(lyrId) {
	// console.log("REMOVE features from legend");
	var delArr = [];
	var table = document.getElementById("layerLegend");
	// console.log(table.rows.length);
	$(table.rows).each( function(i, row) {
		if (lyrId == row.cells[0].value) {
			delArr.push(i)
		}
	});
	///Need to delete from bottom up to keep the same indexes
	delArr.reverse();
	for (var j = 0; j < delArr.length; j++) {
		table.deleteRow(delArr[j]);
	}
	///Remove from Graph's Layer drop down
	$("#chartLayer option").each(function () {
		if (lyrId == $(this).val()) {
			if (($("#chartLayer").val() == lyrId) && (typeof chart != 'undefined')) remGraph();
			$(this).remove();
		}
		//if only vector option is left, clear graph!!! 
	});
	map.getLayer(lyrId).metadata["legendAdded"] = false;
}

//called when the +/- for a layer in the Legend section is clicked. 
//It expands/minimizes accordingly
function toggleLayer(lyrId){
	var featArr = [];
	var mainRow;
	table = document.getElementById("layerLegend");
	$(table.rows).each( function(i, row) {
		if (lyrId == row.cells[0].value) {
			if (row.className == "legendLayerRow") {
				mainRow = i;
			} else {
				featArr.push(i);
			}
		}
	});
	
	lyrHideShow = table.rows[mainRow].cells[0].childNodes[0]; 
	if (lyrHideShow.alt == '-') {
		lyrHideShow.alt = '+'
		lyrHideShow.src = './lib/img/plus.png';
		for (var j = 0; j < featArr.length; j++) {
			table.rows[featArr[j]].style.visibility="hidden";
			table.rows[featArr[j]].style.display="none";
		}
	} else {
		lyrHideShow.alt = '-'
		lyrHideShow.src = './lib/img/minus.png';
		for (var j = 0; j < featArr.length; j++) {
			table.rows[featArr[j]].style.visibility="visible";
			table.rows[featArr[j]].style.display="table-row";
		}
	}
}

//If layer has "selOpts" in its metadata, changeOpt is called when an option is changed
function changeOpt(lyr) {
    // console.log('changeOpt');
    var paramsArr = [];
    var paramsDic = {};
    for (var opt in lyr.metadata["selOpts"]["list"]) {
        var optId = lyr.id.split(".").pop()+"-"+opt;
        var sel = $("#"+optId+" option:selected");
        paramsDic[opt] = sel.val();
        // console.log(optId, sel.val());
        paramsArr.push(opt+"="+sel.val());
    }
    optLegId = lyr.id.split(".").pop()+"-legend";
    optEl = document.getElementById(optLegId);
        
    /// currently customized for probability exposure maps (probExp)
    if (lyr.metadata["selOpts"]["selOptsType"] == "url") {
        //add specific geoJSON
        var selOptLeg = paramsDic["loc"];
        selOptUrl = lyr.metadata["selOpts"]["list"]["loc"]["sublist"][selOptLeg]["url"];

        ///Only refresh if url is different, or will refresh in endless loop
        if (lyr.protocol.url != selOptUrl) {
            lyr.protocol.url = selOptUrl;
            lyr.protocol.options.url = selOptUrl;
            lyr.refresh({force: true});
        }
    /// currently customized for ROMS
    } else if (lyr.metadata["selOpts"]["selOptsType"] == "urlParams") {
        var newImgUrl = lyr.url.split("?")[0]+"?"+paramsArr.join("&");
        newImgUrl += "&ts="+(utcMapDateTime.getTime())/1000;
        if (lyr.url != newImgUrl) lyr.setUrl(newImgUrl);
    } else if (lyr.metadata["selOpts"]["selOptsType"] == "hfrStructure") {
        // lyr.refresh({force: true});
        var selRes = paramsDic["res"];
        var selRng = paramsDic["rng"];
        if ((lyr.metadata["lastRes"] != paramsDic["res"]) || (lyr.metadata["lastRng"] != paramsDic["rng"])) {
            lyr.redraw() ; 
            //if chart has data from this layer, update it
            if ((typeof markers != 'undefined') && (lyr.id==$("#chartLayer option:selected").val())) {
                console.log("setGraph");
                // lyr.metadata["lastRes"] = paramsDic["res"]; //Also get reset in getUrl
                // lyr.metadata["lastRng"] = paramsDic["rng"];
                setGraph();
            } else {console.log("else");}
        }
    }
    
    ///change "-dataTime" for layer in legend
    if (document.getElementById(lyr.id.split(".").pop()+"-dataTime")) { 
        getDataTime(lyr);        
    }
    
    /// if legendImg is for selOpt option (not whole layer), change legendImg
    if ((optEl) && (optEl.length != 0)) {
        var optLeg = optEl.title;
        var selOptLeg = paramsDic[optLeg];
        optEl.innerHTML ='<img src="'+lyr.metadata["selOpts"]["list"][optLeg]["sublist"][selOptLeg]["legendImg"]+'" alt="layer legend">';
    }
    
    /// if legendImg is for selOpt option (not whole layer), change legendImg
    if (lyr.metadata["groupKey"]) {
        keyId = lyr.id.split(".").pop()+"-key";
        if (Object.keys(lyr.metadata["groupKey"]).length == 1) {
            if (document.getElementById(keyId) == null) {
                addLegendKey_oneParam(lyr);
            }
        }
    }

    // } else if (lyr.CLASS_NAME == "OpenLayers.Layer.WMS") {
        // console.log(lyr.id);
        // //!! Currently assumes WMS only has one selOpts
        // console.log(sel.val());
        // // var newImgUrl = lyr.url+sel.val();
        // // /// currently customized for ROMS
        // // newImgUrl += "&ts="+(utcMapDateTime.getTime())/1000;
        // var newImgUrl = lyr.getFullRequestString({}, lyr.url+sel.val());
        // if (lyr.url != newImgUrl) {
            // console.log("old image url:", lyr.url);
            // lyr.setUrl(newImgUrl);
            // console.log("new image url:", lyr.url);
            // lyr.redraw();  
            // // getDataTime(lyr);          
        // }

}

//If layer has "groupKey" in its metadata, create a key in the Legend section
//key is vector based icons using OL's canvas
function addLegendKey(lyr, element, group, colorscale) {
    grpTxtArr = lyr.metadata["groupKey"][group];
    if (grpTxtArr.length == colorscale.length) {
        element.innerHTML = "";
        keyId = lyr.id.split(".").pop()+"-key";
        var vGrpTbl = document.createElement('table');
        vGrpTbl.className= "tblKey";
        vGrpTbl.id= keyId;
        for (var g in grpTxtArr) {
            var vGrpRow=vGrpTbl.insertRow(0);
            var vGrpIcon=vGrpRow.insertCell(0);
            vGrpIcon.style.borderStyle = "none";
            tempAttr = {};
            tempAttr[group] = parseInt(g); 
            vGrpIcon.appendChild(canvasIcon(lyr, tempAttr));
            var vGrpLbl=vGrpRow.insertCell(1);
            vGrpLbl.innerHTML = grpTxtArr[g];
            vGrpLbl.className = "lblKey";
        }
        element.appendChild(vGrpTbl);
    }
    else { alert("Error: adding legend key: "+grpTxtArr.length+" and "+colorscale.length); }    
}

//Used when layer has "groupKey" in its metadata, but no "selOpts"
function addLegendKey_oneParam(lyr) {
    // console.log("stylemap", lyr.styleMap);
    // console.log("test", lyr.styleMap.styles.default.rules);
    clrArr = [];
    lyr.styleMap.styles.default.rules.forEach(function(rule) {
        // console.log(rule);
        if (rule.filter) { 
            grp = rule.filter.property;
            if (rule.symbolizer.fillColor) { clrArr.push(rule.symbolizer.fillColor) } 
        }
    });
    if ((typeof grp != 'undefined') && (clrArr.length > 0)) {
        var layerMenu = document.getElementById("layerLegend");
        tblRow=layerMenu.insertRow(0);
        // lyrRowsNum +=1;
        tblCell=tblRow.insertCell(0);
        tblCell.colSpan = 3;
        tblCell.value = lyr.id;
        addLegendKey(lyr, tblCell, grp, clrArr);
    }
}

//buttons call this function to adjust map by 1 or 6 hrs
function adjustMapTime(adjHr) {
    var adjMS = adjHr*60*60*1000;
    var tzoMS = $('#tzoSel').val()*60*1000;
    utcMapDateTime = new Date(utcMapDateTime.getTime()+adjMS);
    var setDate = new Date(utcMapDateTime.getTime()+tzoMS);
    var setTime = parseInt($("#mapTime").val())+adjHr;  
    if ((setTime < 0) || (setTime > 23)) {
        setTime = (setTime < 0) ? setTime+24 : setTime-24;
        $( "#mapDate" ).datepicker('setDate', dateFormat(setDate));
    }
    $("#mapTime").val(setTime);
    changedMapTime();
}

// function WMSFeatInfo (lyr, exy) {
function WMSFeatInfo (lyr) {
	// console.log(lyr, exy);
	if ((lyr.CLASS_NAME == "OpenLayers.Layer.WMS")) {
	    gfUrl = lyr.url;
	    gfLyr = lyr;
        var wmsGFI = new OpenLayers.Control.WMSGetFeatureInfo({
            url: gfUrl, // Your WMS server url here,
            drillDown: false, // Or true if you want drill down (see the docs)
            hover: false, // Or true if you want but bear in mind this could get chatty
            // infoFormat: 'application/vnd.ogc.wms_xml',
            infoFormat: 'text/xml',
            vendorParams: {TIME: wmsTimeSpan()},
            layers: [gfLyr],
            eventListeners: {
                // beforegetfeatureinfo: function(event) {
                    // console.log(this.vendorParams ); 
                    // // this.vendorParams = {time: timeSpanStr()}; 
                // }, 
                getfeatureinfo: function (event) {
                    chartBusyDone();
                    makeWMSchart(event, lyr.name);
                },
                nogetfeatureinfo: function (event) { //doesn't work
                    chartBusyDone();
                    console.log("nogetfeatureinfo", event);
                    alert("Error: no get feature info");
                }
            
            } 
        });
        map.addControl(wmsGFI);
        wmsGFI.request(exy);
        // wmsGFI.activate();
	}
	//Currently set up for HFR time series
	else if (lyr.metadata["getFtInfoUrlBase"]) {
        var qLL = map.getLonLatFromPixel(exy).transform(map.getProjectionObject(), proj4326);
        var qLat = qLL.lat.toFixed(5).toString();
        var qLon = qLL.lon.toFixed(5).toString();
        if (document.getElementById("now").checked) {
            if ($("#duration").val() != "259200"){
                alert("Time series time span for this layer is only available in 3 days");
                $("#duration").val("259200");
            } 
            var qtime = (utcMapDateTime.getTime()/1000).toString();
            // var qtime = parseInt(new Date().getTime()/1000).toString();          
        } else {
            alert("only using end date, since this time series is only available as a 3 day time span");
            var qtime = ($( "#datepickerEnd" ).datepicker("getDate").getTime()/1000).toString();
        }
        var selRes = lyr.metadata["lastRes"];
        var selRng = lyr.metadata["lastRng"];
        var mask = lyr.metadata["selOpts"]["list"]["res"]["sublist"][selRes]["setFtInfo"];
        var avgs = lyr.metadata["selOpts"]["list"]["rng"]["sublist"][selRng]["setFtInfo"];
        // console.log("WMSFeatInfo", lyr.metadata["lastRes"], lyr.metadata["lastRng"]);
	    gfUrl = lyr.metadata["getFtInfoUrlBase"]+"lat="+qLat+"&lon="+qLon+"&mask="+mask+"&time="+qtime+"&avgs="+avgs;
	    // console.log(gfUrl);
	    // // gfLyr = hfrVeloWMS;
// 	    
        $.ajax({
            url: gfUrl,
            type: 'GET',
            crossDomain: true,
            dataType: 'xml',
            async: false,
            success: function(xml) {
                // console.log(xml);
                makeXMLChart(xml, lyr.name);
            },
            error: function(request,error) { 
                console.log();
                alert("Error: retrieving selection: "+error.message); 
            }
        });
	}
}

// function WMSgetMapTime(lyr) {
function getDataTime(lyr) {
    var adjustMS = $('#tzoSel').val()*60*1000;
    var adjustStr = (/:00/.test($('#tzoSel option:selected').text())) ? $('#tzoSel option:selected').text().split(':')[0]: $('#tzoSel option:selected').text();
    if (lyr.CLASS_NAME == "OpenLayers.Layer.XYZ") {
        var urlDate = new Date(lyr.metadata["dataTimeUTC"]).getTime()+adjustMS;
        $("#"+lyr.id.split(".").pop()+"-dataTime").show();
        $("#"+lyr.id.split(".").pop()+"-dataTime").text(dateTimeFormat(new Date(urlDate))+" UTC"+adjustStr);    
    } else {
        if (lyr.CLASS_NAME == "OpenLayers.Layer.WMS") {
            mapTimeUrl = mapTimeRoot+"?"+lyr.getURL(map.getExtent())+"&drawImg=false"
        } else if (lyr.CLASS_NAME == "OpenLayers.Layer.Image") {
            mapTimeUrl = mapTimeRoot+"?"+lyr.url
        }

        // console.log(mapTimeUrl);
        $.ajax({
            url: mapTimeUrl,
            type: 'GET',
            crossDomain: true,
            dataType: 'text',
            async: false,
            success: function(txt) {
                // console.log(txt);
                var dataTimeEp_ms = parseInt(txt)*1000;
                if (dataTimeEp_ms > 0) {
                    var dataTimeStr = dateTimeFormat(new Date(dataTimeEp_ms+adjustMS))+" UTC"+adjustStr;
                    $("#"+lyr.id.split(".").pop()+"-dataTime").show();
                    $("#"+lyr.id.split(".").pop()+"-dataTime").text(dataTimeStr);
                } else { 
                    console.log("Error: getMap time (-1)");
                    $("#"+lyr.id.split(".").pop()+"-dataTime").hide();
                }
            },
            error: function(request,error) { 
                console.log("Error: getDataTime"); 
                $("#"+lyr.id.split(".").pop()+"-dataTime").hide();
            }
        });
    }
}

//show dialog box with selected layer's metadata
function showInfo(lyrId){
	var lyr = map.getLayer(lyrId);
	var lyrInfo = document.createElement('div');
	lyrInfo.id = "lyrDialog";
	lyrInfo.title = "Layer Metadata"
	lyrInfo.innerHTML = lyr.metadata.info;
	$("#map").append(lyrInfo);
	$("#lyrDialog").dialog({ modal:true,
		resizeable: false,
		draggable: false,
		height:"auto",
		maxHeight:450,
		width: 480,
		dialogClass: "dialogBox" 
	});
	
}

//Used for adding geoJSON layer
function geoJsonLayer(lyrName, vis, geoJsonUrl, style, meta) {
	meta = meta || {};
	var jsonLayer = new OpenLayers.Layer.Vector(lyrName, {
		projection: map.displayProjection,
		visibility: vis,
		protocol: new OpenLayers.Protocol.HTTP({ url: geoJsonUrl, format: new OpenLayers.Format.GeoJSON() }),
		strategies: [new OpenLayers.Strategy.Fixed()],
		styleMap: style,
		metadata: meta
	});
	return jsonLayer;
}

// $(function() {$( "#mapDate" ).datepicker({ defaultDate:hrDate, dateFormat : 'mm/dd/yyyy' })});
$(function() {$( "#mapDate" ).datepicker()});
$(function() {$( "#mapDate" ).datepicker('setDate', hrDate)});