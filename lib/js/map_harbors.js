/*----------------------------------------------
Author: Sarah Heim
----------------------------------------------*/
/*
for (var i=0; i<map.layers.length; i++) {
    if (!(map.layers[i].isBaseLayer)) {
        console.log(map.layers[i].id, map.layers[i].name);
    }
}
*/

///Moved lat, lon, zoom to layers base HTML
// var lon = -117.34;
// var lat = 32.88;
// var zoom = 12;
var map;
var markers;
var selectCtrl, selFtCtrl;
var lastfeature = null;
var exy; // location of map click
// var utcMapDateTime;
// var TZoffset = new Date().getTimezoneOffset(); ///difference between UTC & local (browser) time, in minutes
var procCount = 0;
var proxyStr = '../../cgi-bin/asbs/proxy.cgi?url=';
// var proxyStr = '../../cgi-bin/playground/asbs/proxy.cgi?url=';

OpenLayers.ProxyHost = proxyStr;
var proj3857   = new OpenLayers.Projection("EPSG:3857"); //Spherical Mercator, projection same as 900913
var proj900913 = new OpenLayers.Projection("EPSG:900913"); // Original, before 3858(lat/lon in meters in x/y)
var proj4326   = new OpenLayers.Projection("EPSG:4326"); //WGS 84 (lat/lon as x/y)

var size = new OpenLayers.Size(30, 30);
var offset = new OpenLayers.Pixel(-15, -15);
var crHairIcon = new OpenLayers.Icon('./lib/img/crosshair.png',size,offset);

var mapTimeRoot = "http://neocoweb.ucsd.edu/cgi-bin/asbs/getMap-time.py";

//covers full screen with gray, and busy signal
function wholeBusyProc() { document.getElementById('wholeBusy').style.visibility = "visible"; }
// document.getElementById('wholeBusy').style.visibility = "hidden"; //Line used for testing if busy gets in the way
function wholeBusyDone() { document.getElementById('wholeBusy').style.visibility = "hidden";}
//covers Legend section with gray, and busy signal
function layerBusyProc() { document.getElementById('layerBusy').style.visibility = "visible"; }
function layerBusyDone() { document.getElementById('layerBusy').style.visibility = "hidden"; }

//when a vecter is selected
function onFeatureSelect(event) {
    if ((lastfeature) && (lastfeature.popup)) onFeatureUnselect();
    if ($("#queryLayer").val() != 'x') {
      $("#vectOpt").selected=true;
    }
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
//called when balloon popup is closed (selected point, 'x')
function onPopupClose(evt) {
  console.log('onPopupClose 1');
  // selectCtrl.unselectAll();
  selectCtrl.unselect(lastfeature);
  OpenLayers.Event.stop(evt);
}

//called when balloon popup is closed (marker/crosshair)
function onPopupClose2(evt) {
  console.log('onPopupClose 2');
  // selectCtrl.unselectAll();
  selFtCtrl.unselect(lastfeature);
  OpenLayers.Event.stop(evt);
}

//call to remove balloon
function onFeatureUnselect(event) {
  console.log('onFeatureUnselect');
  var feature = lastfeature;
  if((feature) && (feature.popup)) {
      map.removePopup(feature.popup);
      // map.removePopup(feature);
      feature.popup.destroy();
      delete feature.popup;
  }
  if (map.getLayersByName('feat info').length > 0) {
    infoLyr = map.getLayersByName('feat info')[0];
    infoLyr.destroyFeatures();
    map.removeLayer(infoLyr);
  }
  lastfeature = null;
}

//page initializing
function init(){
  wholeBusyProc();
  layerBusyDone();
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
    		new OpenLayers.Control.MousePosition(),
        new OpenLayers.Control.Attribution(),
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
        if (lyr.metadata["getFtInfoUrlBase"]) {
          var rootUrl = lyr.url;

          var resId = this.id.split(".").pop()+"-res";
          var resSel = $("#"+resId+" option:selected").val();
          var rngId = this.id.split(".").pop()+"-rng";
          var rngSel = $("#"+rngId+" option:selected").val();
          var res = (resSel) ? resSel : 500;
          var type = (rngSel) ? rngSel : 'h';
          lyr.metadata["lastRes"] = res.toString();
          lyr.metadata["lastRng"] = type.toString();
          for (i=1; i<25; i++) {
            console.log(i);
            var qTime = moment.utc().minutes(0).seconds(0).subtract(i,'hours');
            // var urlArr = [rootUrl, type, res, qTime.format('YYYY-MM'), qTime.format('YYYYMMDD_HHmm'), zoom, filename];
            var urlArr = [rootUrl, type, res, qTime.format('YYYY-MM'), qTime.format('YYYYMMDD_HHmm'), '00', 'z0y0x0.png'];
            newUrl = proxyStr+urlArr.join("/");
            // newUrl = urlArr.join("/");
            console.log('check url', i, newUrl);

            breakFlag = 0;
            $.ajax({
              type: 'HEAD',
              url: newUrl,
              async: false,
              success: function() {
                console.log('Good subtract', i, qTime.format(), res, type);
                lyr.metadata["dataTimeUTC"] = qTime.format();
                breakFlag = 1;
              },
              error: function() {
                console.log('error', i);
                breakFlag = -1;
              }
            });
            if (breakFlag > 0) break;
          }
        }
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
			    // if (lyr.CLASS_NAME == "OpenLayers.Layer.WMS") {
          //   lyr.mergeNewParams({'time':moment.utc().format()});
          // }
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
          // Next line, not working?
			    // if ((lastfeature) && (lyr.id == lastfeature.layer.id)) onFeatureUnselect(null);
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

		if ($("#queryLayer").val() == 'x') {
			//Do nothing
			alert('Select point/line data to see information.' +
      'Change "Layer info" to see specific location information, may need to add appropriate layer.');
		} else {
			///non vector layers are added to the top of the drop down list when they're added to the map'
			// if ($("#queryLayer").val() == 'x') {
			// 	// $("#queryLayer").removeAttr('disabled');
			// 	$("#queryLayer option").first().attr('selected', 'selected');
			// };
			exy = e.xy;
			var xy = map.getLonLatFromViewPortPx(e.xy); //getLonLatFromViewPortPx & getLonLatFromPixel return same value
	    	// markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(xy.lon, xy.lat), crHairIcon));
			markers = new OpenLayers.Layer.Markers( "Markers" );
			markers.addMarker(new OpenLayers.Marker(xy, crHairIcon));
			// map.addLayer(markers);
			// $("#queryLayer").disabled = false;
			// $("#vectOpt").disabled = true;

			// setGraph();
      WMSFeatInfo(map.getLayer($("#queryLayer").val()));
		}
	});
	$("#queryLayer").change(function(){
    // if (/^(?!Selection)/.test(document.getElementById("chart").innerHTML)) {
    if (lastfeature) {
      if ($("#queryLayer").val() == 'x') {
        onFeatureUnselect(null);
      }
      else {
        WMSFeatInfo(map.getLayer($("#queryLayer").val()));
      }
    }
  });
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

/// Sets/updates local and utc browser times
function setBrowserTimes() {
  var nowEp = new Date().getTime();
  // console.log(nowEp);
  // console.log(moment.tz(nowEp, "America/Los_Angeles").format());
  $("#pacificBrowserTime").text(moment.tz(nowEp, "America/Los_Angeles").format('L HH:mm'));
  $("#utcBrowserTime").text(moment.utc(nowEp).format('L HH:mm'));
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
//Getting a little crazy, could could some taming
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
  ///Not sure what layer skipName was used for previously. Not needed? Remove?
  ///If needed, should be put in layer's metadata parameters
	var skipName = false;

	///Add individual items (in reverse order bottom to top so they appear in correct order)
	if ((lyr.CLASS_NAME == "OpenLayers.Layer.Vector") && (lyr.features.length < 100) && (!("selOpts" in lyr.metadata))) {
		$(lyr.features.reverse()).each( function(i, feat){
			var featRow=layerMenu.insertRow(0);
			lyrRowsNum +=1;
			ftIcon = featRow.insertCell(0);
      if (feat.attributes.name) {
        var showName = feat.attributes.name;
      } else {
        var showName = feat.fid;
      }
			ftIcon.value = lyr.id;
			ftIcon.appendChild(canvasIcon(lyr, feat.attributes));
			var cellLbl=featRow.insertCell(1);
			cellLbl.innerHTML = '<a href="#" onclick="onFeatureSelect(map.getLayer('+"'"+lyr.id+"'"+').getFeatureById('+"'"+feat.id+"'"+'));">'+showName+"</a>";
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
            if (!(( lastfeature != null) && (lastfeature.popup))) option.selected=true;
            // if (!(( lastfeature != null) && (lastfeature.popup))) console.log('option.selected=true 1');
            // if ((lastfeature) && (lastfeature.layer.name == 'feat info')) console.log('option.selected=true 2');
            $('#queryLayer').prepend(option);
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
    cellImg.id = lyr.id.split(".").pop()+"-legend";
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
		///select layer if feature is selected
    if (!((lastfeature != null) && (lastfeature.popup))) option.selected=true;
    // if (!((lastfeature != null) && (lastfeature.popup))) console.log('option.selected=true 1');
    // if ((lastfeature) && (lastfeature.layer.name == 'feat info')) console.log('option.selected=true 2');
		$('#queryLayer').prepend(option);
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
	    // if (!document.getElementById(legId)) {
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
        // } else {
        //     skipName = true;
        // }
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
	if (lyr.CLASS_NAME == "OpenLayers.Layer.Vector") { // && (lyrRowsNum > 40)
		toggleLayer(lyr.id);
	}
	lyr.metadata["legendAdded"] = true;
	layerBusyDone();
}

//Adds a row for legend image
//Not using this?? But should
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
	///Remove from Layer info drop down
	$("#queryLayer option").each(function () {
		if (lyrId == $(this).val()) {
      // if this layer has a selected feature, remove it
			// if ((lastfeature) && (lastfeature.popup)) {
      //   if (map.getLayersByName('feat info').length > 0) {
      //     // if (lastfeature.layer.name == 'feat info')
      //     if (lyrId = map.getLayersByName('feat info')[0].metadata["origLyr"]) {
      //       onFeatureUnselect(null);
      //     }
      //   }
      // }
      // if ((lastfeature) && (lyrId == lastfeature.layer.id)) onFeatureUnselect(null);
			$(this).remove();
		}
    if (lastfeature) {
      console.log('lastfeature.layer.id:',lyrId, lastfeature.layer);
      if (lastfeature.layer.name == 'feat info'){
        if (lyrId == lastfeature.layer.metadata["origLyr"]) onFeatureUnselect(null);
        console.log('here 1: feat info');
      } else if (lyrId == lastfeature.layer.id) {
        onFeatureUnselect(null);
        console.log('here 2: vector');
      }
    } else {console.log('else')}
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
    var paramsArr = [];
    var paramsDic = {};
    for (var opt in lyr.metadata["selOpts"]["list"]) {
        var optId = lyr.id.split(".").pop()+"-"+opt;
        var sel = $("#"+optId+" option:selected");
        paramsDic[opt] = sel.val();
        // console.log(optId, opt, sel.val());
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
        newImgUrl += "&ts="+moment.utc().format('X').toString();
        if (lyr.url != newImgUrl) lyr.setUrl(newImgUrl);
    } else if (lyr.metadata["selOpts"]["selOptsType"] == "hfrStructure") {
        // lyr.refresh({force: true});
        var selRes = paramsDic["res"];
        var selRng = paramsDic["rng"];
        if ((lyr.metadata["lastRes"] != paramsDic["res"]) || (lyr.metadata["lastRng"] != paramsDic["rng"])) {
            lyr.redraw() ;
            //if chart has data from this layer, update it
            // if ((typeof markers != 'undefined') && (lyr.id==$("#queryLayer").val())) {
            if ((lastfeature) && (lyr.id==$("#queryLayer").val())) {
                console.log("changeOpt - WMSFeatInfo");
                // lyr.metadata["lastRes"] = paramsDic["res"]; //Also get reset in getUrl
                // lyr.metadata["lastRng"] = paramsDic["rng"];
                // setGraph();
                WMSFeatInfo(lyr);
            } else {console.log("else");}
        }
    // currently customized for CDIP swell models
    } else if (lyr.metadata["selOpts"]["selOptsType"] == "wms") {
      lyr.mergeNewParams(paramsDic);
      if (lyr.params.LAYERS == 'waveHs') lyr.mergeNewParams({'colorscalerange':'0,4'})
    }

    ///change "-dataTime" for layer in legend
    if (document.getElementById(lyr.id.split(".").pop()+"-dataTime")) {
        getDataTime(lyr);
    }

    /// if legendImg is for selOpt option (not whole layer), change legendImg
    if ((optEl) && (optEl.length != 0)) {
        var optLeg = optEl.title;
        var selOptLeg = paramsDic[optLeg];
        if (lyr.metadata["selOpts"]["selOptsType"] == "wms") {
          var params = '&BGCOLOR=%23FFF&TRANSPARENT=true';
          if (lyr.params.LAYERS == 'waveHs') params += '&COLORSCALERANGE=0%2C4'; // optional: .mergeNewParams({'colorscalerange':'0,4'})
          imgSrc = lyr.url+"REQUEST=GetLegendGraphic&STYLES=&FORMAT=image%2Fpng"+params+"&LAYER="+lyr.params.LAYERS+"&LAYERS="+lyr.params.LAYERS;
          // lyr.mergeNewParams({'attribution':'<img src="'+imgSrc+'">'});
          lyr.mergeNewParams({'attribution':lyr.params.LAYERS});
        } else {
          imgSrc = lyr.metadata["selOpts"]["list"][optLeg]["sublist"][selOptLeg]["legendImg"];
        }
        optEl.innerHTML ='<img src="'+imgSrc+'" alt="layer legend">';

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

    if ((lastfeature) && (lyr.id == lastfeature.layer.metadata["origLyr"])) WMSFeatInfo(lyr);

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

//CHANGE!!!
//PREVIOUSLY retrieved timeseries (mutli-time data)
function WMSFeatInfo (lyr) {
  // console.log('in WMSFeatInfo', markers, $("#queryLayer option").val());
  if ((typeof markers != 'undefined') && ($("#queryLayer").val() != 'x')) {
    var lyr = map.getLayer($("#queryLayer").val());
  	// console.log(lyr.id);
  	if ((lyr.CLASS_NAME == "OpenLayers.Layer.WMS")) {
  	    gfUrl = lyr.url;
  	    gfLyr = lyr;
          var wmsGFI = new OpenLayers.Control.WMSGetFeatureInfo({
              url: gfUrl, // Your WMS server url here,
              drillDown: false, // Or true if you want drill down (see the docs)
              hover: false, // Or true if you want but bear in mind this could get chatty
              // infoFormat: 'application/vnd.ogc.wms_xml',
              infoFormat: 'text/xml',
              // vendorParams: {TIME: wmsTimeSpan()},
              layers: [gfLyr],
              eventListeners: {
                  // beforegetfeatureinfo: function(event) {
                      // console.log(this.vendorParams );
                      // // this.vendorParams = {time: timeSpanStr()};
                  // },
                  getfeatureinfo: function (event) {
                      makeWMSInfo(event, lyr.id);
                  },
                  nogetfeatureinfo: function (event) { //doesn't work
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

          // var qtime = moment.utc().format('X').toString();
          var qtime = moment.utc().minutes(0).seconds(0).subtract(3,'hours').format('X').toString();
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
                  makeXMLInfo(xml, lyr.id);
              },
              error: function(request,error) {
                  // console.log();
                  alert("Error: retrieving selection: "+error.message);
              }
          });
  	}
  }
}

//Creates a chart with values from a WMS getFeatureInfo
function makeWMSInfo(event, lyrId) {
	if (event.request.status == 200){
		var doc = event.request.responseXML;
        if (event.request.responseText.match(/ServiceException/g)) {
            alert("Error: WMS getFeatureInfo ServiceException");
        } else {
    		makeXMLInfo(doc, lyrId);
    	}
	}
	else {
		console.log(event);
		alert("Error: WMS get feature info");
	}
}

function makeXMLInfo(xml, lyrId) {
  // console.log('makeXMLInfo', xml);
  if (lastfeature) onFeatureUnselect();
  var infoTxt = '<div class="popupContent"><table class="plainTbl">';
  LLexy = map.getLonLatFromViewPortPx(exy);
  var selPt = new OpenLayers.Geometry.Point(LLexy.lon, LLexy.lat);
  LLexy4326 = LLexy.transform(map.getProjectionObject(), proj4326);

  var pt = $(xml).find("Point").last();
  if (pt.length == 0) {
    pt = $(xml).find("FeatureInfo");
    ptLat = $(xml).find("latitude").text();
    ptLon = $(xml).find("longitude").text();
  } else {
    var dataTag = $(xml).find("Data");
    ptLat = dataTag.attr('Lon');
    ptLon = dataTag.attr('Lat');
  }
  $(pt[0].children).each(function(j, kid){ //pt[0].childNodes
    if (kid.firstChild) {
        kidVals = kid.firstChild;
        if (kid.getAttribute('Var') == "Direction") {
            ptDir = parseFloat(kidVals.nodeValue);
            infoTxt += '<tr class="bolder"><td>Direction:</td><td><img src="'+
            'http://neocoweb.ucsd.edu/cgi-bin/asbs/arrow.py?dir='+ ptDir.toString()+'" alt="arrow"> '+ ptDir.toString()+' degrees</td></tr>';
        }
        else {
            // console.log(kidVals.parentElement.tagName, kidVals.nodeValue);
            if (kidVals.parentNode.tagName.toLowerCase() == "time") {
                var nodeTimeUTC = moment.utc(kidVals.nodeValue).format('L HH:mm');
                var nodeTimeLocal = moment.tz(kidVals.nodeValue, "America/Los_Angeles").format('L HH:mm [(]Z[)]');
                infoTxt += '<tr class="soften"><td>Time UTC:</td><td>'+nodeTimeUTC+'</td></tr>';
                infoTxt += '<tr class="bolder"><td>Time Local:</td><td>'+nodeTimeLocal+'</td></tr>';
            } else if (kidVals.parentNode.tagName.toLowerCase() == "value") {
                ptVal = parseFloat(kidVals.nodeValue);
                xmlTitle = kid.getAttribute('Var');
                xmlUnits = kid.getAttribute('Unit');
                if (xmlTitle) {
                  infoTxt += '<tr class="bolder"><td>'+xmlTitle+':</td><td>'+ ptVal.toString();
                } else {
                  infoTxt += '<tr class="bolder"><td>Value:</td><td>'+ ptVal.toString();
                }
                if (xmlUnits) {infoTxt += ' '+xmlUnits;}
                infoTxt += '</td></tr>'
            }
        }
    }
    else { console.log('data collection error');}
  });
  infoTxt += '<tr class="soften"><td>Selected Latitude:</td><td>'+LLexy4326.lat+'</td></tr>';
  infoTxt += '<tr class="soften"><td>Selected Longitude:</td><td>'+LLexy4326.lon+'</td></tr>';
  infoTxt += '<tr class="soften"><td>Returned Data Latitude:</td><td>'+ptLat+'</td></tr>';
  infoTxt += '<tr class="soften"><td>Returned Data Longitude:</td><td>'+ptLon+'</td></tr>';
  infoTxt += '</table></div>';
  var infoLayer = new OpenLayers.Layer.Vector("feat info", {
    projection: map.displayProjection,
    visibility: true,
    isBaseLayer: false,
    metadata:{"origLyr":lyrId}
  });
  map.addLayer(infoLayer);

  //exy.x, exy.y
  // LLexy = map.getLonLatFromViewPortPx(exy);
  // var selPt = new OpenLayers.Geometry.Point(LLexy.lon, LLexy.lat);
  var feature = new OpenLayers.Feature.Vector(selPt, {message:'here'}, {
    externalGraphic: './lib/img/crosshair.png',
    graphicWidth:30,
    graphicHeight:30,
    graphicXOffset:-15,
    graphicYOffset:-15,
    graphicZIndex: 1000
  });

  infoLayer.addFeatures([feature]);
  selFtCtrl = new OpenLayers.Control.SelectFeature([infoLayer], {
    // onUnselect: onFeatureUnselect,
    onUnselect: function(evt) {
      onFeatureUnselect(evt);
      selFtCtrl.deactivate();
    },
    clickout: true
  })
  map.addControl(selFtCtrl);
  selFtCtrl.activate();

  popup = new OpenLayers.Popup.FramedCloud("featurePopup",
    feature.geometry.getBounds().getCenterLonLat(),
    null, //new OpenLayers.Size(100,100),
    infoTxt,
    null, true,
    onPopupClose2
    // function(evt) {
    //   console.log('custom function - remove feature/layer(crosshair) and popup');
    //   onPopupClose(evt);
    // }
  );

  feature.popup = popup;
  map.addPopup(popup);
  // GLOBAL variable, in case popup is destroyed by clicking CLOSE box
  lastfeature = feature;
}

// function WMSgetMapTime(lyr) {
function getDataTime(lyr) {
    if (lyr.CLASS_NAME == "OpenLayers.Layer.XYZ") {
        $("#"+lyr.id.split(".").pop()+"-dataTime").show();
        $("#"+lyr.id.split(".").pop()+"-dataTime").text(moment.tz(lyr.metadata["dataTimeUTC"], "America/Los_Angeles").format());
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
                var dataTimeEp = parseInt(txt);
                if (dataTimeEp > 0) {
                    var dataTimeStr = moment.tz(dataTimeEp, "America/Los_Angeles").format();
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
