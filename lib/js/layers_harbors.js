// var lon = -118.24;
// var lat = 33.53;
// var zoom = 10;
var addLayersArr, groups, vectorsArr;
// var hfrVeloWMS;

function setLayers() {
    ///______________________________________BASE LAYERS_____________________________________________
    var esriOcean = new OpenLayers.Layer.XYZ('ESRI Ocean'
    	,'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/${z}/${y}/${x}.jpg'
    	, {wrapDateLine: true, isBaseLayer : true}
    );
    var topo = new OpenLayers.Layer.XYZ('Topo Quads',
    	'http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/${z}/${y}/${x}.jpg'
    	, {wrapDateLine: true, isBaseLayer : true}
    );

    var navCharts = new OpenLayers.Layer.WMS( 'Navigational Charts'
    	,'https://seamlessrnc.nauticalcharts.noaa.gov/arcgis/services/RNC/NOAA_RNC/ImageServer/WMSServer?'
      //,'http://egisws02.nos.noaa.gov/ArcGIS/services/RNC/NOAA_RNC/ImageServer/WMSServer?' //stopped working
    	,{	layers      : 'NOAA_RNC' //'RNC/NOAA_RNC'
    	} , { projection  : proj3857, wrapDateLine: true, isBaseLayer : true}
    );

    var gMap = new OpenLayers.Layer.Google("Google Streets");
    var gSat = new OpenLayers.Layer.Google("Google Satellite", {type : google.maps.MapTypeId.SATELLITE});
    var gHyb = new OpenLayers.Layer.Google("Google Hybrid", {type : google.maps.MapTypeId.HYBRID});
    var gTer = new OpenLayers.Layer.Google("Google Terrain", {type : google.maps.MapTypeId.TERRAIN});

    ///__________________________________________LAYERS_____________________________________________

    var buoy = new OpenLayers.Layer.Vector("CDIP Wave Buoy", {
    	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
    	protocol: new OpenLayers.Protocol.HTTP({ url: "http://sccoos.org/data/harbors/lalb/buoys.kml",
        // format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
  	    format: new OpenLayers.Format.KML({extractAttributes: true})
    	}),
    	styleMap: ylwStyle,
      visibility: true,
      metadata: {"info": "<h2>CDIP Wave Buoy</h2><p>Layer metadata placeholder</p>"}
    });

    var mops = new OpenLayers.Layer.Vector("Monitoring and Prediction Sites", {
    	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
    	protocol: new OpenLayers.Protocol.HTTP({ url: "http://sccoos.org/data/harbors/lalb/mops.kml",
        // format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
    	  format: new OpenLayers.Format.KML({extractAttributes: true})
    	}),
      visibility: true,
    	styleMap: grnStyle,

    });

    var ship = new OpenLayers.Layer.Vector("Shipping Lanes", {
    	projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
    	protocol: new OpenLayers.Protocol.HTTP({ url: "http://sccoos.org/data/harbors/lalb/shipping_lanes.kml",
        // format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
    	  format: new OpenLayers.Format.KML({extractAttributes: true})
    	}),
    	styleMap: colorLine('#ff0000'),
      visibility: true,
      metadata: {"legendType": "line"}
    });

    var cata = new OpenLayers.Layer.Vector("Catalina Ferry", {
      projection: map.displayProjection, visibility: false, strategies: [new OpenLayers.Strategy.Fixed()],
      protocol: new OpenLayers.Protocol.HTTP({ url: "http://sccoos.org/data/harbors/lalb/catalina_ferry.kml",
        format: new OpenLayers.Format.KML({extractStyles: true, extractAttributes: true})
          // format: new OpenLayers.Format.KML({extractStyles: false, extractAttributes: true})
      }),
      // styleMap: greenStyle
      styleMap: colorLine('#1A8C22'),
      visibility: true,
      metadata: {"legendType": "line"}
    });

    var swell = new OpenLayers.Layer.WMS( 'CDIP Swell Model'
    	// ,'http://services.asascience.com/ecops/wms.aspx?'
    	,'http://thredds.cdip.ucsd.edu/thredds/wms/cdip/model/MOP_grids/CA_0.01_nowcast.nc?'
    	, { layers : 'waveHs', format : 'image/png', transparent : true } //, time : utcMapDateTime.toISOString() }
    	, { projection : proj3857, visibility: true, //singleTile : true, wrapDateLine: true,
    		metadata: {"info": '<h2>CDIP Swell Model</h2><p>Using <a href="http://cdip.ucsd.edu/">CDIP</a>\'s model: <a href="http://thredds.cdip.ucsd.edu/thredds/wms/cdip/model/MOP_grids/CA_0.01_nowcast.nc?service=WMS&version=1.3.0&request=GetCapabilities">MOP_grids/CA_0.01_nowcast WMS </a> on THREDDS. Wave parameter grid aggregate, based on: Bulk wave parameters and directional wave spectra as predicted by the CDIP MOP version 1.1 model.</p>'+
        '<p>Model options include:<ul><li>Wave Height</li><li>Peak Wave Period</li><li>Peak Wave Direction</li><li>Ave Wave Period</li></ul></p>'
    		// , "legendNote": "Time series graph is limited to one week"
        // , "legendNote": "Can add a note here"
        , "selOpts": {
            "selOptsType": "wms",
            "list": {
                "layers": {
                    "name": "Model",
                    "sublist": {
                        "waveHs": {"name": "Wave Height"},
                        "waveTp": {"name": "Peak Wave Period"},
                        "waveDp": {"name": "Peak Wave Direction"},
                        "waveTa": {"name": "Ave Wave Period"}
                    }
                }
            }
          }
    		}}
    );

    // hfrVeloWMS = new OpenLayers.Layer.WMS( 'HF Radar Surface Currents - WMS test 6km hourly'
        // ,          'http://hfrnet.ucsd.edu/thredds/wms/HFRNet/USWC/6km/hourly/RTV'
        // // , 'http://hfrnet-dev.ucsd.edu:8080/thredds/wms/HFRNet/USWC/6km/hourly/RTV' //working
        // // , 'http://hfrnet-dev.ucsd.edu:8080/thredds/wms/HFRNet/USWC/' // base to add resolution and type
        // ,{ layers : 'surface_sea_water_velocity', format : 'image/png', transparent : true, version:'1.3.0',
            // styles: 'linevec/ferret', colorscalerange: '0,0.5' , numcolorbands:20}
        // , { projection : proj3857, opacity: 0.7, visibility: false, singleTile : true, wrapDateLine: true,
            // // getURL: function(bounds) {
                // // console.log(this.url);
                // // var rootUrl = this.url;
                // // var type = 'hourly';
                // // var res = '6km';
// //
                // // var urlArr = [rootUrl, res, type, "RTV"];
                // // newUrl = urlArr.join("/");
                // // this.url = newUrl;
                // // return newUrl;
            // // },
            // metadata: {"info": "<h2>High Frequency Radar</h2><p>Data collected from high-frequency (HF) radar can be used to infer the speed and direction of ocean surface currents (to 1 meter’s depth). This data is processed and displayed to the user as surface currents maps in near real-time. This information can be useful in determining the fate and transport of oil from an oil spill, freshwater outflow from a broken sewage line or river source, and can inform swimmers, surfers and boaters of hazardous conditions in the surfzone and coastal areas.</p><p><a href='http://www.sccoos.org/data/hfrnet'>High Frequency Radar site</a></p>",
                        // "legendImg": "http://hfrnet-dev.ucsd.edu:8080/thredds/wms/HFRNet/USWC/500m/hourly/RTV?REQUEST=GetLegendGraphic&LAYER=surface_sea_water_velocity&PALETTE=ferret"
                        // // , "selOpts": {
                            // // "res": ["resolution", {"500m/hourly/RTV": "500 meters", "1km/hourly/RTV": "1 km", "km/hourly/RTV": "2 km", "6km/hourly/RTV": "6 km"}]
                        // // }
            // }
          // }
    // );
    // console.log(hfrVeloWMS.getFullRequestString({}));



    var hfrVelo = new OpenLayers.Layer.XYZ( 'HF Radar Surface Currents'
        // http://hfrnet-dev.ucsd.edu:8080/thredds/wms/HFRNet/USWC/6km/hourly/RTV?service=WMS&version=1.3.0&request=GetCapabilities
        // , 'http://mosaic.ucsd.edu/tiles/rtv/us/h/6000/2014-04/20140407_2300/09/z${z}y${y}x${x}.png?rng=0,50&scheme=0'
        , 'http://mosaic.ucsd.edu/tiles/rtv/us'
        , { visibility: false, wrapDateLine: true, projection : proj3857, isBaseLayer:false,
            ///assumes mosaic.ucsd.edu file structure
            getURL: function(bounds) {
                var rootUrl = this.url;
                // var type = 'h';
                // var res = '6000';

                // var resId = this.id.split(".").pop()+"-res";
                // var resSel = $("#"+resId+" option:selected").val();
                // var rngId = this.id.split(".").pop()+"-rng";
                // var rngSel = $("#"+rngId+" option:selected").val();
                // var res = (resSel) ? resSel : 500;
                // var type = (rngSel) ? rngSel : 'h';
                // this.metadata["lastRes"] = res.toString();
                // this.metadata["lastRng"] = type.toString();
                // console.log(res, type, resSel, rngSel);


                // var filename = 'z${z}y${y}x${x}.png?rng=0,50&scheme=0';
                var xyz = this.getXYZ(bounds);
                var filename = 'z'+xyz.z+'y'+xyz.y+'x'+xyz.x+'.png?rng=0,50&scheme=0';
                var zoom = map.getZoom().toString();
                var zoom = (map.getZoom() < 10) ? "0"+zoom : zoom;

                // var yyyy = dateTexts(utcMapDateTime).yyyy;
                // var MM = dateTexts(utcMapDateTime).MM;
                // var dd = dateTexts(utcMapDateTime).dd;
                // var HH= dateTexts(utcMapDateTime).HH;
                // var mm = '00';

                // console.log("hfr UTC:", yyyy+'-'+MM+'-'+dd+'T'+HH+':'+mm);
                // var urlArr = [rootUrl, type, res, yyyy+'-'+MM, yyyy+MM+dd+'_'+HH+mm, zoom, filename];
                // The lastest tiles are only 2(-3?) hours old
                // this.metadata["lastRes"] = res.toString();
                // this.metadata["lastRng"] = type.toString();
                // var baseUrl = lastestHFR(rootUrl, type, res);
                // console.log(baseUrl)
//                 for (i=2; i<25; i++) {
//                   console.log(i);
//                   var qTime = moment.utc().minutes(0).subtract(i,'hours');
//                   var urlArr = [rootUrl, type, res, qTime.format('YYYY-MM'), qTime.format('YYYYMMDD_HHmm'), zoom, filename];
//                   newUrl = urlArr.join("/");
//                   console.log('check url', newUrl);
//
//                   $.ajax({
//                     type: 'HEAD',
//                     url: newUrl,
//                     success: function() {
//                       console.log('use this to subtract', i);
//                       this.metadata["dataTimeUTC"] = qTime.format('YYYY-MM-DDTHHmm[Z]');
//                       return newUrl;
//                     },
// error: function() {
//       console.log('error', i);
// }
//                   });
//                 }
//                 console.log('ALERT: error retrieving latest HFR layer',i);
//                 return '';
                var qTime = moment.utc(this.metadata["dataTimeUTC"]);
                // var urlArr = [rootUrl, type, res, qTime.format('YYYY-MM'), qTime.format('YYYYMMDD_HHmm'), zoom, filename];
                var urlArr = [rootUrl, this.metadata["lastRng"], this.metadata["lastRes"], qTime.format('YYYY-MM'), qTime.format('YYYYMMDD_HHmm'), zoom, filename];
                newUrl = urlArr.join("/");
                // console.log('HFR getUrl', newUrl);
                // this.metadata["dataTimeUTC"] = qTime.format('YYYY-MM-DDTHHmm[Z]');
                return newUrl;
            },
            metadata: {"info": "<h2>High Frequency (HF) Radar Surface Currents</h2><p>Data collected from high-frequency (HF) radar can be used to infer the speed and direction of ocean surface currents (to 1 meter's depth). This data is processed and displayed to the user as surface currents maps in near real-time. This information can be useful in determining the fate and transport of oil from an oil spill, freshwater outflow from a broken sewage line or river source, and can inform swimmers, surfers and boaters of hazardous conditions in the surfzone and coastal areas.</p><p><a href='http://www.sccoos.org/data/hfrnet'>High Frequency Radar site</a></p>"
                        , "selOpts": {
                            "selOptsType":"hfrStructure",
                            "list":{
                                "res": {
                                    "name": "Resolution",
                                    "sublist": {
                                        "500": {"name": "500 meters", "setFtInfo": "500m"},
                                        "1000": {"name": "1 km", "setFtInfo": "1km"},
                                        "2000": {"name": "2 km", "setFtInfo": "2km"},
                                        "6000": {"name": "6 km", "setFtInfo": "6km", "selected":true}
                                    }
                                },
                                "rng": {
                                    "name": "Range",
                                    "sublist": {
                                        "h": {"name": "Hourly", "setFtInfo":"0"},
                                        "a": {"name": "25 hr ave", "setFtInfo":"1"}
                                    }
                                }
                            }
                        }
                        // , "getFtInfoUrlBase": "http://hfrnet-dev.ucsd.edu:8080/thredds/wms/HFRNet/USWC"
                        , "getFtInfoUrlBase": "http://neocoweb.ucsd.edu/cgi-bin/asbs/hfr_timespan_ascii-hist.py?"
                        , "legendImg": "./lib/img/hfr_current-strength.png"
                        , "legendNote": "500 meter only available in San Francisco."
                        , "maxZoom": 12
            }
          }
    );

    // var asbs31Doc = new OpenLayers.Layer.Vector("ASBS #31 San Diego-Scripps", { styleMap: hiddenStyle, metadata: {"info":"<h2>ASBS #31 San Diego-Scripps Documents</h2><h3>Reports, Papers, and Special Studies</h3><ul class='buffer-list'><li><a target='_blank' href='./lib/docs/Final%20UCSD%20SIO%20Monitoring%20Report%2007-28-2011.pdf'>Final Monitoring and Effectiveness Assessment Report</a> - (2011) La Jolla Shores Area of Special Biological Significance Dry Weather Flow and Pollution Control Program</li><li><a target='_blank' href='./lib/docs/La_Jolla_Shores_Coastal_Watershed_Management_Plan_Final.pdf'>LA JOLLA SHORES COASTAL WATERSHED MANAGEMENT PLAN FINAL REPORT</a> - (2008) Final Version of the Watershed Management Plan<ul><li><a target='_blank' href='./lib/docs/Appendicies_La_Jolla_Shores_Coastal_Watershed_Management_Plan_Final.pdf'>Appendicies A through H</a></li></ul></li><li><a target='_blank' href='./lib/docs/DilutionStudy_Final_Feb07_2007.pdf'>DILUTION STUDY</a> - (2007) Hydrodynamic Simulations of Shoreline Discharges of Laboratory Seawater and Storm Water at Scripps Beach</li></ul>"+
    // "<h3>About Areas of Special Biological Significance</h3><ul><li><a target='_blank' href='./lib/docs/ASBS_brochure.pdf'>LA JOLLA SHORES ASBS</a> - Brochure from <a target='_blank' href='http://sdcoastkeeper.org/'>San Diego Coastkeepers</a> describing the La Jolla Shores ASBS</li></ul>"+
    // "<h3>Permits and Regulations</h3><ul class='buffer-list'><li><a target='_blank' href='./lib/docs/2012_CA_OceanPlan.pdf'>CALIFORNIA OCEAN PLAN</a> - (2012)</li><li><a target='_blank' href='./lib/docs/UCSD_SIO_NPDES_Permit_2008.pdf'>PERMIT</a> - (2008) NPDES Permit no. CA0107239 for University of California, Scripps Institution of Oceanography. Water discharge requirements, monitoring and reporting program.</li></ul>"}});
    // var regMonDoc = new OpenLayers.Layer.Vector("Regional Monitoring", { styleMap: hiddenStyle, metadata: {"info":"<h2>Regional Monitoring Documents</h2><ul class='buffer-list'><li>(0853) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/853_ASBSRef_V5combWcover040815final.pdf'>Near-Coastal Water Quality at Reference Sites Following Storm Events.</a> 2015. Kenneth Schiff, Jeff Brown: Southern California Coastal Water Research Project (Costa Mesa, CA). Steen Trump: ADH Environmental (Arcata, CA), Dane Hardin: Applied Marine Sciences (Santa Cruz, CA).  Technical Report 853.</li><li>(0852) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/852_SouthCoastASBS_FinalRep.pdf'>South Coast Areas of Special Biological Significance Regional Monitoring Program Year 2 Results.</a> 2015. Kenneth Schiff, Jeff Brown. Technical Report 852. Southern California Coastal Water Research Project. Costa Mesa, CA.</li><li>(0816) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/816_ASBSBioaccumulation.pdf'>Areas of Special Biological Significance: Bioaccumulation Monitoring.</a> 2014. Nathan Dodder, Wayne Lao, David Tsukada, Dario Diehl, Kenneth Schiff. Technical Report 816. Southern California Coastal Water Research Project. Costa Mesa, CA.</li><li>(0818) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/818_ASBSRockyIntertidal.pdf'>Characterization of the Rocky Intertidal Ecological Communities Associated with Southern California Areas of Special Biological Significance: Phase II.</a> 2014. Pete Raimondi. Technical Report 818. University of California Santa Cruz. Santa Cruz, CA</li><li>(0817) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/817_ASBSPlumes.pdf'>Assessing Areas of Special Biological Significance Exposure to Stormwater Plumes Using a Surface Transport Model.</a> 2014. Peter Rogowski, Eric Terrill, Lisa Hazard: Coastal Observing Research and Development Center (La Jolla, CA), Kenneth Schiff: Southern California Coastal Water Research Project (Costa Mesa, CA). Technical Report 817. </li><li>(0858) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/858_ASBS_BMPRep.pdf'>Proposition 84 Grant Evaluation Report: Assessing Pollutant Reductions to Areas of Biological Significance.</a> 2015. Kenneth Schiff, Jeff Brown. Technical Report 858. Southern California Coastal Water Research Project. Costa Mesa, CA.</li><li>(0703) <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/703_ASBS_Characterization.pdf'>Characterization of the Rocky Intertidal Ecological Communities Associated with Southern California Areas of Special Biological Significance.</a> 2012. P Raimondi, K Schiff, D Gregorio. Technical Report 703. Southern California Coastal Water Research Project. Costa Mesa, CA. <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/703_ASBS_Characterization_ES.pdf'>ABSTRACT</a> <a target='_blank' href='https://mail.ucsd.edu/owa/redir.aspx?C=iOZfBMvdEE6rA5DDzA0xR-ykkm_UENEIot-3pDwy_zAPdXYblIChpNzW62jTVDpsEnyByxGut6I.&URL=http%3a%2f%2fdocs.google.com%2fviewer%3furl%3dhttp%3a%2f%2fwww.sccwrp.org%3a8060%2fpub%2fdownload%2fDOCUMENTS%2fTechnicalReports%2f703_ASBS_Characterization.pdf'>PREVIEW</a></li><li>(0685) <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/685_B08RockyReef.pdf'>Southern California Bight 2008 Regional Monitoring Program: V. Rocky Reefs.</a> 2012. D Pondella, J Williams, J Claisse, R Schaffner, K Ritter, K Schiff. Technical Report 685. Southern California Coastal Water Research Project. Costa Mesa, CA. <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/685_B08RockyReef_ES.pdf'>ABSTRACT</a> <a target='_blank' href='https://mail.ucsd.edu/owa/redir.aspx?C=iOZfBMvdEE6rA5DDzA0xR-ykkm_UENEIot-3pDwy_zAPdXYblIChpNzW62jTVDpsEnyByxGut6I.&URL=http%3a%2f%2fdocs.google.com%2fviewer%3furl%3dhttp%3a%2f%2fwww.sccwrp.org%3a8060%2fpub%2fdownload%2fDOCUMENTS%2fTechnicalReports%2f685_B08RockyReef.pdf'>PREVIEW</a></li><li>(0641) <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/641_B08ASBS.pdf'>Southern California Bight 2008 Regional Monitoring Program: II. Areas of Special Biological Significance.</a> 2011. K Schiff, B Luk, D Gregorio, S Gruber. Technical Report 641. Southern California Coastal Water Research Project. Costa Mesa, CA. <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/641_B08ASBS_ES.pdf'>ABSTRACT</a> <a target='_blank' href='https://mail.ucsd.edu/owa/redir.aspx?C=iOZfBMvdEE6rA5DDzA0xR-ykkm_UENEIot-3pDwy_zAPdXYblIChpNzW62jTVDpsEnyByxGut6I.&URL=http%3a%2f%2fdocs.google.com%2fviewer%3furl%3dhttp%3a%2f%2fwww.sccwrp.org%3a8060%2fpub%2fdownload%2fDOCUMENTS%2fTechnicalReports%2f641_B08ASBS.pdf'>PREVIEW</a></ul>"}});
    // var ecoDoc = new OpenLayers.Layer.Vector("Ecosystems Assessments", { styleMap: hiddenStyle, metadata: {"info":"<h2>Ecosystems Assessments Documents</h2><p><a target='_blank' href='./lib/docs/FnlBioacCircStdyLaJollaBay.pdf'>Final Bioaccumulation and Circulation Study</a> - (2007) La Jolla Bay</p>"}});

    ///order of items in addLayersArr doesn't matter, except for z-index (?)
    addLayersArr = [esriOcean, navCharts, gMap, gSat, gHyb, gTer, topo
      , swell, hfrVelo
      , ship, cata
    	, buoy, mops];

    ///built in reverse order
    groups = {// "Special Studies and Documents": [ecoDoc, regMonDoc, asbs31Doc],
    	"Models": [swell, hfrVelo],
    	"Lines": [ship, cata],
    	"Points": [buoy, mops]
    	};
    vectorsArr = [ship, cata, buoy, mops];
}

// function lastestHFR(rootUrl, type, res) {
//   var baseUrl = [rootUrl, type, res].join("/");
//   $.ajax({
//     url: baseUrl,
//     success: function(data){
//        $(data).find("td > a").each(function(){
//           // will loop through
//           console.log("Found a folder: " + $(this).attr("href"));
//        });
//        return "newDir"
//     },
//     error: function(request,error) {
//         // console.log();
//         alert("Error: retrieving HFR: "+error.message);
//         return ""
//     }
//   });
// }
