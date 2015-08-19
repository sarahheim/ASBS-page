/*----------------------------------------------
Author: Sarah Heim
----------------------------------------------*/
var proj3857   = new OpenLayers.Projection("EPSG:3857"); //Spherical Mercator, projection same as 900913
var proj900913 = new OpenLayers.Projection("EPSG:900913"); // Original, before 3858(lat/lon in meters in x/y)
var proj4326   = new OpenLayers.Projection("EPSG:4326"); //WGS 84 (lat/lon as x/y)

var mapDisplayProjection;

var hrDate = new Date();
hrDate.setUTCMinutes(0);
hrDate.setUTCSeconds(0);
hrDate.setUTCMilliseconds(0);
midnightDate = hrDate.setUTCHours(0);
hrDateTxt = hrDate.toISOString();

var esriOcean = new OpenLayers.Layer.XYZ('ESRI Ocean'
	,'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/${z}/${y}/${x}.jpg'
	, {wrapDateLine: true, isBaseLayer : true}
);
var topo = new OpenLayers.Layer.XYZ('Topo Quads', 
	'http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/${z}/${y}/${x}.jpg'
	, {wrapDateLine: true, isBaseLayer : true}
);
// var topo = new OpenLayers.Layer.WMS('Topo Quads', 
	// "http://terraservice.net/ogcmap.ashx?"
	// , {layers: 'DRG'}
	// //, { projection  : proj3857}
// );
var OL_wms_basic = new OpenLayers.Layer.WMS( "OpenLayers WMS Basic",
        "http://vmap0.tiles.osgeo.org/wms/vmap0"
        , {layers: 'basic'}
        , {wrapDateLine: true, isBaseLayer : true} 
);
var navCharts = new OpenLayers.Layer.WMS( 'Navigational Charts'
	,'http://egisws02.nos.noaa.gov/ArcGIS/services/RNC/NOAA_RNC/ImageServer/WMSServer?'
	,{	layers      : 'RNC/NOAA_RNC'
	} , { projection  : proj3857, wrapDateLine: true, isBaseLayer : true}
);

var gMap = new OpenLayers.Layer.Google("Google Streets");
var gSat = new OpenLayers.Layer.Google("Google Satellite", {type : google.maps.MapTypeId.SATELLITE});
var gHyb = new OpenLayers.Layer.Google("Google Hybrid", {type : google.maps.MapTypeId.HYBRID});
var gTer = new OpenLayers.Layer.Google("Google Terrain", {type : google.maps.MapTypeId.TERRAIN});
var osm = new OpenLayers.Layer.OSM(); 
// console.log(osm.projection);
osm.projection = proj3857;

var nasa = new OpenLayers.Layer.WMTS({
	name:"NASA test"
	, url: "http://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi"
	, layer: "MODIS_Aqua_Land_Surface_Temp_Day"  
	, style: ""
	, matrixSet: "EPSG4326_1km"
});

var delorme = new OpenLayers.Layer.XYZ('DeLorme_World_Base_Map', 
	'http://services.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/${z}/${y}/${x}.jpg'
	, {wrapDateLine: true}
);

var ncomSST = new OpenLayers.Layer.WMS( 'NCOM SST'
	,'http://services.asascience.com/ecop/wms.aspx?'
	// ,'http://coastmap.com/ecop/wms.aspx?'
	,{ layers : 'NCOM_SST', format : 'image/png', transparent : true, time : hrDateTxt } 
	, { projection : proj3857, visibility: false, singleTile : true, wrapDateLine: true}
);

var ncomCur = new OpenLayers.Layer.WMS( 'NCOM Currents'
	,'http://coastmap.com/ecop/wms.aspx?'
	,{ layers : 'NCOM_CURRENTS', format : 'image/png', transparent : true, time : hrDateTxt } 
	, { projection : proj3857, visibility: false, singleTile : true, wrapDateLine: true}
);

var ww3 = new OpenLayers.Layer.WMS( 'WW3 Wave Height'
	// ,'http://services.asascience.com/ecop/wms.aspx?'
	,'http://coastmap.com/ecop/wms.aspx?'
	,{ layers : 'WW3_WAVE_HEIGHT', format : 'image/png', transparent : true, time : hrDateTxt } 
	, { projection : proj3857, opacity: 0.5, visibility: false, singleTile : true, wrapDateLine: true}
);

var namWinds = new OpenLayers.Layer.WMS( 'NAM Winds'
	,'http://services.asascience.com/ecop/wms.aspx?'
	,{ layers : 'NAM_WINDS', format : 'image/png', transparent : true, time : hrDateTxt } 
	, { projection : proj3857, visibility: false, singleTile : true, wrapDateLine: true}
);
var nexrad = new OpenLayers.Layer.WMS("Nexrad 45-min"
	, "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?"
	, {
		layers:"nexrad-n0r-900913-m45m"
		// layers:"nexrad-n0r-m45m"
		,transparent:"true",format:'image/png'}
	, { projection : proj3857, visibility: false}
);

var hrEast = new OpenLayers.Layer.WMS( 'SS Eastward Velocity'
	// ,'http://hfrnet.ucsd.edu/thredds/wms/HFRNet/USWC/6km/hourly/RTV?'
	,'http://hfrnet.ucsd.edu/thredds/wms/HFRNet/USWC/6km/hourly/GNOME?'
	,{ layers : 'water_u', format : 'image/png', transparent : true } 
	, { projection : proj3857, opacity: 0.5, visibility: false, singleTile : true, wrapDateLine: true}
);

var hrNorth = new OpenLayers.Layer.WMS( 'SS Northward Velocity'
	// ,'http://hfrnet.ucsd.edu/thredds/wms/HFRNet/USWC/6km/hourly/RTV?'
	,'http://hfrnet.ucsd.edu/thredds/wms/HFRNet/USWC/6km/hourly/GNOME?'
	,{ layers : 'water_v', format : 'image/png', transparent : true } 
	, { projection : proj3857, opacity: 0.5, visibility: false, singleTile : true, wrapDateLine: true}
);

var mc = new OpenLayers.Layer.WMS( "MetaCarta" , "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'});

var HABs = new OpenLayers.Layer.Vector("HAB sites", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/hab_sites.kml",
	    format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
	})
});
var AllASBSs = new OpenLayers.Layer.Vector("ASBS Locations", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/asbs_locations.kml",
	    format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
	})
});
var SDasbsR = new OpenLayers.Layer.Vector("SD ASBS Regions", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/sd_asbs_regions.kml",
	    format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
	})
});
var SDasbsS = new OpenLayers.Layer.Vector("SD ASBS Sites", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/site_overview.kml",
	    format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
	}),
	styleMap: imgStyle //change in style during hover and select not working
});
var WQsites = new OpenLayers.Layer.Vector("WQ sites", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/wqsites.kml",
	    format: new OpenLayers.Format.KML({extractStyles: false, extractAttributes: true})
	}),
	styleMap: greenStyle
});
var consti = new OpenLayers.Layer.Vector("Constituents of Interest", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/constituents_sites.kml",
	    format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
	})
});
var iGlider = new OpenLayers.Layer.Vector("Ideal Glider Tracks", {
	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({ url: "lib/KMLs/ideal.kml",
	    format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
	})
});
var sioMx = new OpenLayers.Layer.Vector("SIO Meteorological Sensors", {
	strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({
		url: "http://neocodev.ucsd.edu/playground/asbs/lib/JSONs/SIOMx.json",
	    format: new OpenLayers.Format.GeoJSON()
	}),
	styleMap: greenStyle
});
proj4326toMap(sioMx);
var sio01 = new OpenLayers.Layer.Vector("SIO Flow Monitoring", {
	strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({
		url: "http://neocodev.ucsd.edu/playground/asbs/lib/JSONs/SIO01.json",
	    format: new OpenLayers.Format.GeoJSON()
	}),
	styleMap: greenStyle
});
proj4326toMap(sio01);

function proj4326toMap(layer) {
	for (f in layer.features) {
		var feature = sioMx.features[f];
		feature.geometry.transform(proj4326, map.getProjectionObject());
	}
}

// for (f in sioMx.features) {
	// var feature = sioMx.features[f];
	// feature.geometry.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
// }
	
var addLayersArr = [esriOcean, OL_wms_basic, osm, navCharts, gMap, gSat, gHyb, gTer, topo, delorme
	, ncomSST, ncomCur, ww3, namWinds, nexrad, hrEast, hrNorth, HABs, AllASBSs, SDasbsR, SDasbsS
	, WQsites, consti, iGlider, sioMx, sio01];
	
var vectorsArr = [WQsites, HABs, AllASBSs, SDasbsS, consti, sioMx, sio01];
