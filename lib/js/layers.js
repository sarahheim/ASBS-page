// var proj3857   = new OpenLayers.Projection("EPSG:3857"); //Spherical Mercator, projection same as 900913
// var proj900913 = new OpenLayers.Projection("EPSG:900913"); // Original, before 3858(lat/lon in meters in x/y)
// var proj4326   = new OpenLayers.Projection("EPSG:4326"); //WGS 84 (lat/lon as x/y)

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
    	,'http://egisws02.nos.noaa.gov/ArcGIS/services/RNC/NOAA_RNC/ImageServer/WMSServer?'
    	,{	layers      : 'RNC/NOAA_RNC'
    	} , { projection  : proj3857, wrapDateLine: true, isBaseLayer : true}
    );
    
    var gMap = new OpenLayers.Layer.Google("Google Streets");
    var gSat = new OpenLayers.Layer.Google("Google Satellite", {type : google.maps.MapTypeId.SATELLITE});
    var gHyb = new OpenLayers.Layer.Google("Google Hybrid", {type : google.maps.MapTypeId.HYBRID});
    var gTer = new OpenLayers.Layer.Google("Google Terrain", {type : google.maps.MapTypeId.TERRAIN});
    
    ///__________________________________________LAYERS_____________________________________________
    var sioMx = geoJsonLayer("Meteorological Station Data", false, "lib/JSONs/SIOMx.json", magStyle,
    {"info": "<h2>San Diego Meteorological Sensors</h2><p>Located at Scripps Pier, MARFAC (Marine Facilities -  Scripps Institution of Oceanography), and Fleet Services</p><p>Meteorological stations along the coast provide wind speed, wind direction, air temperature, relative humidity, barometric pressure, solar radiation, rainfall and water temperature data. These basic measurements provide important information for predicting coastal circulation, upwelling and changes to the weather and climate.</p>"});

    //!!! Script is on neocodev NOT neocoweb. Neocoweb does not have Python library MySQLdb
    var HABs = geoJsonLayer("Harmful Algae & Red Tides", false, "http://neocoweb.ucsd.edu/cgi-bin/asbs/habs_ptData_json.py", colorPoint("#00B800", "#0000B8"),
    {"info": '<h2>Harmful Algae & Red Tide Regional Monitoring Program</h2><p>Monitoring for Harmful Algal Blooms (HAB) occurs at 8 piers along the California coastline.</p><p>The HAB groups of greatest concern to California are Pseudo-nitzschia and Alexandrium, since some species can produce potent algal toxins that can be transferred through the food web to higher organisms such as marine mammals and humans.</p><p>Water samples and net tows are collected once per week to monitor for HAB species, and naturally occurring algal toxins, as well as water temperature, salinity, and nutrients.</p><p>Links:<br><a target="_blank" href="http://www.sccoos.org/data/habs/index.php">Harmful Algae & Red Tide Regional Map</a><br><a target="_blank" href="http://www.sccoos.org/data/habs/about.php">About HAB</a><br><a target="_blank" href="http://www.sccoos.org/data/habs/news.php">HAB News</a><br><a target="_blank" href="http://www.sccoos.org/data/habs/abouthabs.php">What are HABs?</a><br><a target="_blank" href="http://www.sccoos.org/data/habs/species.php">Harmful Algae & Red Tide Species</a></p>',
     // "legendImg": "./lib/img/legend-test.png",
     "vPtLegend":[["circle", "< 7 days"], ["square", "7 - 14 days"], ["triangle", "> 14 days"]]});
     
    // var SDasbsS = geoJsonLayer("San Diego ASBS Monitoring Stations", "lib/JSONs/sites.json", redStyle,
    // {"info": "<h2>San Diego ASBS Sampling Locations</h2><p>Sampling for the ASBS monitoring pilot program occurs at outfalls and receiving waters in the San Diego Marine Life Refuge and the San Diego-La Jolla Ecological Reserve.</p>"});
    
    var bactStations = geoJsonLayer("San Diego ASBS Bacteria Stations", true, "http://neocoweb.ucsd.edu/cgi-bin/asbs/ciwqs_latestStats.py?type=wq", cyanStyle,
    {"info": "<h2>San Diego ASBS Bacteria Monitoring Stations</h2><p>Bacteria monitoring in the surf zone is performed weekly in the San Diego-Scripps Area of Special Biological Significance (ASBS). Data shown are the last reported results sent to the State Water Resources Control Board (SWRCB).</p><p>When repeat sampling is required because of an exceedance of any one single sample density, values from all samples collected during that 30-day period are used to calculate the geometric mean.</p><p>Questions relating to data: Contact UCSD-EH&S Environmental Affairs <a href='mailto:ehsea@ucsd.edu?subject=ASBS site question'>ehsea@ucsd.edu</a></p>"});
    
    
    var outfalls = geoJsonLayer("San Diego ASBS Outfall Stations", true, "http://neocoweb.ucsd.edu/cgi-bin/asbs/ciwqs_latestStats.py?type=outfall", orngStyle,
    {"info": "<h2>Outfall Monitoring Stations</h2><p>Seawater and storm water outfalls at Scripps Institution of Oceanography that are monitored in accordance with the California Ocean Plan</p>"+
        "<h3>SIO Outfall 1</h3><a href='lib/img/outfall_001.jpg' target='_blank'><img height='75' width='75' src='lib/img/outfall_001_thumb.jpg' /></a><h4>Discharge sources:</h4><ul><li>Birch Aquarium - indigenous and non-indigenous species discharge, filter backwash seawater</li><li>Hubbs Hall - indigenous and non-indigenous species discharge</li><li>Electromagnetic Facility (shark tank) - indigenous species discharge</li><li>National Marine Fisheries - indigenous species discharge</li><li>Seawater Storage Tanks - filtered seawater</li><li>Hydraulics Lab - non-species discharge</li><li>Scholander Hall - non-species discharge</li><li>Keck Center for Ocean Atmosphere Reseach - non-species discharge</li><li>Stormwater</li></ul>"+
        "<h3>SIO Outfall 2</h3><a href='lib/img/outfall_002.jpg' target='_blank'><img height='75' width='75' src='lib/img/outfall_002_thumb.jpg' /></a><h4>Discharge sources:</h4><ul><li>Stormwater</li></ul>"+
        "<h3>SIO Outfall 3</h3><a href='lib/img/outfall_003.jpg' target='_blank'><img height='75' width='75' src='lib/img/outfall_003_thumb.jpg' /></a><h4>Discharge sources:</h4><ul><li>Experimental Aquarium - indigenous species discharge</li><li>Seawater Storage Tanks - filtered seawater</li><li>Ring Tank - indigenous species discharge</li></ul>"+
        "<h3>SIO Outfall 4a</h3><a href='lib/img/outfall_4a.jpg' target='_blank'><img height='75' width='75' src='lib/img/outfall_4a_thumb.jpg' /></a><h4>Discharge sources:</h4><ul><li>Settling Tanks - unfiltered raw seawater</li></ul>"+
        "<h3>SIO Outfall 4b</h3><a href='lib/img/outfall_4b_thumb.jpg' target='_blank'><img height='75' width='75' src='lib/img/outfall_4b_thumb.jpg' /></a><h4>Discharge sources:</h4><ul><li>Filter System - filter backwash seawater</li></ul>"+
        "<p>Questions relating to data: Contact UCSD-EH&S Environmental Affairs <a href='mailto:ehsea@ucsd.edu?subject=ASBS site question'>ehsea@ucsd.edu</a></p>"
    });
    var ww3 = new OpenLayers.Layer.WMS( 'WWIII Wave Height'
    	// ,'http://services.asascience.com/ecop/wms.aspx?'
    	,'http://coastmap.com/ecop/wms.aspx?'
    	,{ layers : 'WW3_WAVE_HEIGHT', format : 'image/png', transparent : true, time : utcMapDateTime.toISOString() } 
    	, { projection : proj3857, opacity: 1.0, visibility: false, singleTile : true, wrapDateLine: true,
    		metadata: {"info": '<h2>WW3 Wave Height</h2><p>Wave Watch III (WW3) is a third generation wave model developed at NOAA/NWS/NCEP (National Centers for Environmental Prediction).</p><p>WW3 forecasts are produced every six hours at 00, 06, 12 and 18 UTC. The WW3 graphics are based model fields of 1.00 x 1.250 to 50 x 50 and are available at six hour increments out to 87 hours.</p><p>WW3 solves the spectral action density balance equation for wave number-direction spectra. Assumptions for the model equations imply that the model can generally be applied on spatial scales (grid increments) larger than 1 to 10 km, and outside the surf zone.</p><a target="_blank" href="http://polar.ncep.noaa.gov/waves">http://polar.ncep.noaa.gov/waves</a>'
    		          // , "legendNote": "Time series graph is limited to one week"
    		          , "maxZoom": 11}}
    );
    
    var namWinds = new OpenLayers.Layer.WMS( 'NAM Winds'
    	// ,'http://services.asascience.com/ecops/wms.aspx?'
    	,'http://coastmap.com/ecop/wms.aspx?'
    	, { layers : 'NAM_WINDS', format : 'image/png', transparent : true, time : utcMapDateTime.toISOString() } 
    	, { projection : proj3857, visibility: false, singleTile : true, wrapDateLine: true, 
    		metadata: {"info": '<h2>NAM Winds</h2><p>The North American Mesoscale Model (NAM), refers to a numerical weather prediction model run by National Centers for Environmental Prediction for short-term weather forecasting. Currently, the Weather Research and Forecasting Non-hydrostatic Mesoscale Model (WRF-NMM) model is run as the NAM, thus, three names (NAM, WRF, or NMM) typically refer to the same model output. The WRF replaced the Eta model on June 13, 2006.<\p><p>The model is run four times a day (00, 06, 12, 18 UTC) out to an 84 hour forecast. It is currently run with 12 km horizontal resolution and with 1 hour temporal resolution, providing finer detail than other operational forecast models.</p><a target="_blank" href="http://www.nco.ncep.noaa.gov/pmb/nwprod/analysis/">http://www.nco.ncep.noaa.gov/pmb/nwprod/analysis/</a>'
    		// , "legendNote": "Time series graph is limited to one week"
    		}}
    );
    
    var anSST = new OpenLayers.Layer.WMS( 'NCEP SST (nowcast)'
        ,'http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/analyses?'
        , { layers : 'NCEP_RAS_ANAL_RTG_SST', format : 'image/png', transparent : true, time : utcMapDateTime.toISOString() } 
        , { projection : proj3857, visibility: false, wrapDateLine: true, opacity: 0.8,
            // singleTile : true,  
            metadata: {"info": "<h2>Sea Surface Temperature</h2><p>The Sea Surface Temperature (1/12 deg) analysis map layer displays the NOAA/ NWS/National Centers for Environmental Prediction's (NCEP) daily, high-resolution, real-time, global sea surface temperature analysis. The analysis uses the most recent 24-hours of in-situ and satellite-derived surface water temperature data to provide a global SST map. The analysis is frequently referred to as 'RTG_SST'.</p><p>Links:<br><a target=\"_blank\" href=\"http://polar.ncep.noaa.gov/sst/\">More information about the SST analysis</a><br><a target=\"_blank\" href=\"www.nws.noaa.gov/om/tpb/477.pdf\">NOAA/NWS Technical Procedures Bulletin on the SST analysis</a><br><a target=\"_blank\" href=\"http://nowcoast.noaa.gov/\">NOAA's nowCoast</a>: Web Mapping Portal</p>"
                        , "legendNote": "No time series available<br>Only current gridded daily map analysis available."
                        , "legendImg": "./lib/img/ncep_SST.png"
                        , "maxZoom": 9
                }
            }
    );
    
    var ASBSpoly = new OpenLayers.Layer.Vector("California ASBS Boundaries", {
        // strategies: [new OpenLayers.Strategy.Fixed(),
        // new OpenLayers.Strategy.Cluster({distance: 5, threshold: 2})],
        strategies: [new OpenLayers.Strategy.Fixed()],
        visibility: true,
        protocol: new OpenLayers.Protocol.HTTP({ url: "lib/JSONs/asbs_locations_bounds.json", format: new OpenLayers.Format.GeoJSON() }),
        projection : proj4326,
//      styleMap: colorPoly("#2288FF", "#0000FF"),
        styleMap: customGroupStyleMap("Sec", "Sec_group", secs3, "lblOnHover"),
        metadata: {"legendType": "poly",
            "groupKey": {"Sec_group": ["CA Bight", "Central CA", "Northern CA"]}, 
            "info": "<h2>The State of California ASBS System</h2><p>The state of California designates thirty-four coastal regions in the <a target=\"_blank\" href=\"http://www.swrcb.ca.gov/plnspols/oplans.html\">California Ocean Plan</a> as Areas of Special Biological Significance (ASBS) in an effort to preserve these unique and sensitive marine ecosystems for future generations.</p><p>To discover more about an ASBS region, click on the boundary's polygon, or visit the <a target=\"_blank\" href=\"http://www.swrcb.ca.gov/plnspols/asbs.html\">State Water Resources Control Board ASBS page</a> for full details. You can also view a comprehensive interactive map showing all critical coastal areas in the state, including ASBS regions, on the <a target=\"_blank\" href=\"http://www.coastal.ca.gov/nps/Web/cca_statemap.htm\">California's Critical Coastal Areas</a> website. The regions below are derived from third-party sources, and are intended to provide an approximate sense of ASBS extents only.</p>"
        }
    });


    
    var probExp = new OpenLayers.Layer.Vector("Historical Probability Maps", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        visibility: false,
        protocol: new OpenLayers.Protocol.HTTP({ url: "./lib/JSONs/exposure-maps_annuals-template.json", format: new OpenLayers.Format.GeoJSON() }),
        projection : proj4326,
        // styleMap: colorPoly("#77FFFF", "#00FFFF"),
        styleMap: customGroupStyleMap("PE", "PE_group", scale9rainbow, "noLbl"),
        // opacity: 0.5, //adjusted in customGroupStyleMap
        metadata: {"legendType": "poly", "info": "<h2>Probability Exposure Maps (2008-2009)</h2><p>A plume exposure hindcast model, driven by surface current data observed by a network of high-frequency (HF) radars, was used to generate probability exposure maps for two Areas of Special Biological Significance (ASBS); the San Diego Marine Life Refuge and San Diego - La Jolla Ecological Reserve.  The resulting exposure maps estimate the spatial extent of the surface plume for a historical dataset from 2008-2009.  The maps were used to determine the probabilities of exposure of each ASBS to coastal discharges for annual circulation patterns.</p>",
        "groupKey": {"PE_group": ["1% PoE", "5% PoE", "10% PoE", "15% PoE", "25% PoE", "50% PoE", "70% PoE", "80% PoE", "90% PoE"]},
        "legendNote": 'If selected location is out of map view, use "SoCal" map bookmark',
        "selOpts": {
            "selOptsType": "url",
            "list": {
                "loc": {
                    "name": "Location",
                    "sublist": {
                        "ah": {"name": "Agua Hedionda",     "url": "./lib/JSONs/exposure-maps_annuals-AH.json"}, 
                        "ac": {"name": "Aliso Creek",       "url": "./lib/JSONs/exposure-maps_annuals-AC.json"}, 
                        "bal": {"name": "Ballona Creek",    "url": "./lib/JSONs/exposure-maps_annuals-BAL.json"}, 
                        "bat": {"name": "Batiquitos Lagoon","url": "./lib/JSONs/exposure-maps_annuals-BAT.json"},
                        "bvl": {"name": "Buena Vista Lagoon","url": "./lib/JSONs/exposure-maps_annuals-BVL.json"}, 
                        "cal": {"name": "Calleguas Creek",  "url": "./lib/JSONs/exposure-maps_annuals-CAL.json"},
                        "lag": {"name": "Laguna Canyon",    "url": "./lib/JSONs/exposure-maps_annuals-LAG.json"}, 
                        "lpl": {"name": "Los Penasquitos Lagoon", "url": "./lib/JSONs/exposure-maps_annuals-LPL.json"},
                        "mal": {"name": "Malibu Lagoon",    "url": "./lib/JSONs/exposure-maps_annuals-MAL.json"}, 
                        "nb": {"name": "Newport Bay",       "url": "./lib/JSONs/exposure-maps_annuals-NB.json"},
                        "salt": {"name": "Salt Creek",      "url": "./lib/JSONs/exposure-maps_annuals-SALT.json"}, 
                        "sdito": {"name": "SanDiegito",     "url": "./lib/JSONs/exposure-maps_annuals-SDito.json"},
                        "sdbm": {"name": "San Diego Bay Mouth", "url": "./lib/JSONs/exposure-maps_annuals-SDBM.json"}, 
                        "sdr": {"name": "San Diego River", "url": "./lib/JSONs/exposure-maps_annuals-SDR.json"},
                        "sel": {"name": "San Elijo Lagoon", "url": "./lib/JSONs/exposure-maps_annuals-SEL.json"}, 
                        "sgr": {"name": "San Gabriel River", "url": "./lib/JSONs/exposure-maps_annuals-SGR.json"},
                        "sjc": {"name": "San Juan Creek",   "url": "./lib/JSONs/exposure-maps_annuals-SJC.json"}, 
                        "smac": {"name": "San Mateo Creek", "url": "./lib/JSONs/exposure-maps_annuals-SMaC.json"},
                        "sar": {"name": "Santa Ana River",  "url": "./lib/JSONs/exposure-maps_annuals-SAR.json"}, 
                        "scr": {"name": "Santa Clara River", "url": "./lib/JSONs/exposure-maps_annuals-SCR.json"},
                        "smc": {"name": "Santa Monica Creek","url": "./lib/JSONs/exposure-maps_annuals-SMC.json"}
                    }
                }
            }
            // "loc": ["Location", {
            // "ah": ["Agua Hedionda", "./lib/JSONs/exposure-maps_annuals-AH.json"], "ac": ["Aliso Creek", "./lib/JSONs/exposure-maps_annuals-AC.json"], 
            // "bal": ["Ballona Creek", "./lib/JSONs/exposure-maps_annuals-BAL.json"], "bat": ["Batiquitos Lagoon", "./lib/JSONs/exposure-maps_annuals-BAT.json"],
            // "bvl": ["Buena Vista Lagoon", "./lib/JSONs/exposure-maps_annuals-BVL.json"], "cal": ["Calleguas Creek", "./lib/JSONs/exposure-maps_annuals-CAL.json"],
            // "lag": ["Laguna Canyon", "./lib/JSONs/exposure-maps_annuals-LAG.json"], "lpl": ["Los Penasquitos Lagoon", "./lib/JSONs/exposure-maps_annuals-LPL.json"],
            // "mal": ["Malibu Lagoon", "./lib/JSONs/exposure-maps_annuals-MAL.json"], "nb": ["Newport Bay", "./lib/JSONs/exposure-maps_annuals-NB.json"],
            // "salt": ["Salt Creek", "./lib/JSONs/exposure-maps_annuals-SALT.json"], "sdito": ["SanDiegito", "./lib/JSONs/exposure-maps_annuals-SDito.json"],
            // "sdbm": ["San Diego Bay Mouth", "./lib/JSONs/exposure-maps_annuals-SDBM.json"], "sdr": ["San Diego River", "./lib/JSONs/exposure-maps_annuals-SDR.json"],
            // "sel": ["San Elijo Lagoon", "./lib/JSONs/exposure-maps_annuals-SEL.json"], "sgr": ["San Gabriel River", "./lib/JSONs/exposure-maps_annuals-SGR.json"],
            // "sjc": ["San Juan Creek", "./lib/JSONs/exposure-maps_annuals-SJC.json"], "smac": ["San Mateo Creek", "./lib/JSONs/exposure-maps_annuals-SMaC.json"],
            // "sar": ["Santa Ana River", "./lib/JSONs/exposure-maps_annuals-SAR.json"], "scr": ["Santa Clara River", "./lib/JSONs/exposure-maps_annuals-SCR.json"],
            // "smc": ["Santa Monica Creek", "./lib/JSONs/exposure-maps_annuals-SMC.json"]}]
        }, 
        }
    });

    // var mets = geoJsonLayer("Meteorological Observations", "lib/JSONs/met-obs_temp.json", customGroupStyleMap("T", "T_group", scale9rainbow, "smallPointLbl"),
    // {"info": '<h2>Recent Meteorological Stations and Observations</h2><p>Data orginates from the MADIS Web Services Portal</p><p>Links:<br><a target="_blank" href="http://www.sccoos.org/data/mets/index.php">SCCOOS\'s Meteorological Observations</a><br>For access to raw data, visit the <a target="_blank" href="http://madis-data.noaa.gov/public/sfcdumpguest.html">MADIS query page</a><br></p>',
     // "selOpts": {
         // "selOptsType": "urlParams",
         // "list": {
             // "chan": {
                 // "name": "Channel",
                 // "sublist": {
                     // "T": {
                         // "name": "Air Temperature",
                         // "groupName": "T_group",
                         // "legendType": "point",
                         // "styleMap": scale9rainbow,
                         // "groupKey": ["less than 32°F", "32°F to 39.999°F", "40°F to 49.999°F", "50°F to 59.999°F", "60°F to °69.999F", "70°F to 79.999°F", "80°F to 89.999°F", "90°F to 99.999°F", "100°F or greater"]
                     // },
                     // "RH": {
                         // "name": "Relative Humidity",
                         // "groupName": "RH_group",
                         // "legendType": "point",
                         // "styleMap": scaleWhToBlu,
                         // "groupKey": ["less than 10%", "10% to 10.999%", "20% to 20.999%", "30% to 30.999%", "40% to 40.999%", "50% to 50.999%", "60% to 60.999%", "70% to 70.999%", "80% to 80.999%", "90% to 100%"]
                     // }
                 // }
             // },
             // "dist": { "name": "Distance", "sublist": {"1": {"name": "< 1 km"}, "5": {"name": "< 5 km"}, "1000": {"name": "All Stations"} } },
             // "unit": { "name": "Unit", "sublist": { "C": {"name": "°C"}, "F": {"name": "°F"} } }
         // }
     		// // "chan": ["Channel", {"T": ["Air Temperature", "T_group", scale9rainbow], "RH": ["Relative Humidity", "RH_group", scaleWhToBlu]}],
     		// // "dist": ["Distance", {"1": "< 1 km", "5": "< 5 km", "15": "< 15 k", "1000": "All Stations"}],
     		// // // "dist": ["Distance", {}],
     		// // "unit": ["Unit", {"C": "°C", "F": "°F"}]  
     	// },
     // // "groupKey": {"T_group": ["less than 32°F", "32°F to 39.999°F", "40°F to 49.999°F", "50°F to 59.999°F", "60°F to °69.999F", "70°F to 79.999°F", "80°F to 89.999°F", "90°F to 99.999°F", "100°F or greater"],
           // // "RH_group": ["less than 10%", "10% to 10.999%", "20% to 20.999%", "30% to 30.999%", "40% to 40.999%", "50% to 50.999%", "60% to 60.999%", "70% to 70.999%", "80% to 80.999%", "90% to 100%"]
        // // }
    // });
    
    var roms = new OpenLayers.Layer.Image(
        'ROMS',
        //'http://sandbar.ucsd.edu/roms-3km/util/ol.php?',
        'http://neocoweb.ucsd.edu/roms-3km/util/ol.php?',
        // 'http://sandbar.ucsd.edu/roms-3km/util/ol.php?var=temp&depth=0',
        new OpenLayers.Bounds(-127.5, 31.3, -117, 43).transform(proj4326, proj900913),
        new OpenLayers.Size(1490, 2081),
        {isBaseLayer:false , alwaysInRange: true, projection:proj900913, visibility:false, opacity: 0.7,
            // don't know where this link came from <a target=\"_blank\" href=\"http://ourocean.jpl.nasa.gov/\">
        metadata: {"info": "<h2>Regional Ocean Model System (ROMS) Model Output</h2><p>The ROMS model is produced and distributed by Dr. Yi Chao and his team at UCLA through the Joint Institute for Regional Earth System Science and Engineering (JIFRESSE) and the west coast office of Remote Sensing Solutions, Inc.</p>"
                    , "legendNote": "No time series available"
                    // , "maxZoom": 10
        			// "legendImg": "./lib/img/roms_salt.png",
        			, "selOpts": {
        			    "selOptsType": "urlParams",
        			    "list": {
        			        "var": {
        			            "name": "Channel",
        			            "sublist": {
        			                "temp": {"name": "Temperature",  "legendImg": "./lib/img/roms_temp.png"},
        			                "salt": {"name": "Salinity",     "legendImg": "./lib/img/roms_salt.png"},
                                    "zeta": {"name": "Sea Surface Height", "legendImg": "./lib/img/roms_zeta.png"},
                                    "uv": {"name": "Ocean Currents", "legendImg": "./lib/img/roms_uv.png"}
        			            }
        			        },
        			        "depth": {
        			            "name": "Depth",
        			            "sublist": {
        			                "0": {"name": "0 meters"}, "1": {"name": "10 meters"}, "2": {"name": "20 meters"}, "3": {"name": "30 meters"},
        			                "4": {"name": "40 meters"}, "5": {"name": "50 meters"}, "6": {"name": "75 meters"}, "7": {"name": "100 meters"},
        			                "8": {"name": "150 meters"}, "9": {"name": "200 meters"}, "10": {"name": "300 meters"}, "11": {"name": "400 meters"}
        			            }
        			        }
        			    }
        				// "var": ["Channel", {"temp": ["Temperature", "./lib/img/roms_temp.png"], "salt": ["Salinity", "./lib/img/roms_salt.png"], "zeta": ["Sea Surface Height", "./lib/img/roms_zeta.png"], "uv": ["Ocean Currents", "./lib/img/uv.png"]}],
        				// "depth": ["Depth", {"0":"0 meters", "1":"10 meters", "2":"20 meters", "3":"30 meters", "4":"40 meters", "5":"50 meters", 
        				// "6":"75 meters", "7":"100 meters", "8":"150 meters", "9":"200 meters", "10":"300 meters", "11":"400 meters"}]
        			} 
        }
    });
    
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
                
                var resId = this.id.split(".").pop()+"-res";
                var resSel = $("#"+resId+" option:selected").val();
                var rngId = this.id.split(".").pop()+"-rng";
                var rngSel = $("#"+rngId+" option:selected").val();
                var res = (resSel) ? resSel : 500;
                var type = (rngSel) ? rngSel : 'h';
                // console.log(res, type, resSel, rngSel);
                
                
                // var filename = 'z${z}y${y}x${x}.png?rng=0,50&scheme=0';
                var xyz = this.getXYZ(bounds);
                var filename = 'z'+xyz.z+'y'+xyz.y+'x'+xyz.x+'.png?rng=0,50&scheme=0';
                var zoom = map.getZoom().toString();
                var zoom = (map.getZoom() < 10) ? "0"+zoom : zoom;
                
                var yyyy = dateTexts(utcMapDateTime).yyyy;
                var MM = dateTexts(utcMapDateTime).MM;
                var dd = dateTexts(utcMapDateTime).dd;
                var HH= dateTexts(utcMapDateTime).HH;
                var mm = '00';
                
                // console.log("hfr UTC:", yyyy+'-'+MM+'-'+dd+'T'+HH+':'+mm);
                var urlArr = [rootUrl, type, res, yyyy+'-'+MM, yyyy+MM+dd+'_'+HH+mm, zoom, filename];
                newUrl = urlArr.join("/");
                this.metadata["dataTimeUTC"] = yyyy+'-'+MM+'-'+dd+'T'+HH+':'+mm+"Z";
                this.metadata["lastRes"] = res.toString();
                this.metadata["lastRng"] = type.toString();
                // console.log("reset:", this.metadata["lastRes"], this.metadata["lastRng"]);
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
                        , "legendNote": "500 meter only available in San Francisco.<br>May need to adjust Map Date Time to view."
                        , "maxZoom": 12
            }
          }
    );
    
    var asbs31Doc = new OpenLayers.Layer.Vector("ASBS #31 San Diego-Scripps", { styleMap: hiddenStyle, metadata: {"info":"<h2>ASBS #31 San Diego-Scripps Documents</h2><h3>Reports, Papers, and Special Studies</h3><ul class='buffer-list'><li><a target='_blank' href='./lib/docs/Final%20UCSD%20SIO%20Monitoring%20Report%2007-28-2011.pdf'>Final Monitoring and Effectiveness Assessment Report</a> - (2011) La Jolla Shores Area of Special Biological Significance Dry Weather Flow and Pollution Control Program</li><li><a target='_blank' href='./lib/docs/La_Jolla_Shores_Coastal_Watershed_Management_Plan_Final.pdf'>LA JOLLA SHORES COASTAL WATERSHED MANAGEMENT PLAN FINAL REPORT</a> - (2008) Final Version of the Watershed Management Plan<ul><li><a target='_blank' href='./lib/docs/Appendicies_La_Jolla_Shores_Coastal_Watershed_Management_Plan_Final.pdf'>Appendicies A through H</a></li></ul></li><li><a target='_blank' href='./lib/docs/DilutionStudy_Final_Feb07_2007.pdf'>DILUTION STUDY</a> - (2007) Hydrodynamic Simulations of Shoreline Discharges of Laboratory Seawater and Storm Water at Scripps Beach</li></ul>"+
    "<h3>About Areas of Special Biological Significance</h3><ul><li><a target='_blank' href='./lib/docs/ASBS_brochure.pdf'>LA JOLLA SHORES ASBS</a> - Brochure from <a target='_blank' href='http://sdcoastkeeper.org/'>San Diego Coastkeepers</a> describing the La Jolla Shores ASBS</li></ul>"+
    "<h3>Permits and Regulations</h3><ul class='buffer-list'><li><a target='_blank' href='./lib/docs/2012_CA_OceanPlan.pdf'>CALIFORNIA OCEAN PLAN</a> - (2012)</li><li><a target='_blank' href='./lib/docs/UCSD_SIO_NPDES_Permit_2008.pdf'>PERMIT</a> - (2008) NPDES Permit no. CA0107239 for University of California, Scripps Institution of Oceanography. Water discharge requirements, monitoring and reporting program.</li></ul>"}});
    var regMonDoc = new OpenLayers.Layer.Vector("Regional Monitoring", { styleMap: hiddenStyle, metadata: {"info":"<h2>Regional Monitoring Documents</h2><ul class='buffer-list'><li>(0853) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/853_ASBSRef_V5combWcover040815final.pdf'>Near-Coastal Water Quality at Reference Sites Following Storm Events.</a> 2015. Kenneth Schiff, Jeff Brown: Southern California Coastal Water Research Project (Costa Mesa, CA). Steen Trump: ADH Environmental (Arcata, CA), Dane Hardin: Applied Marine Sciences (Santa Cruz, CA).  Technical Report 853.</li><li>(0852) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/852_SouthCoastASBS_FinalRep.pdf'>South Coast Areas of Special Biological Significance Regional Monitoring Program Year 2 Results.</a> 2015. Kenneth Schiff, Jeff Brown. Technical Report 852. Southern California Coastal Water Research Project. Costa Mesa, CA.</li><li>(0816) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/816_ASBSBioaccumulation.pdf'>Areas of Special Biological Significance: Bioaccumulation Monitoring.</a> 2014. Nathan Dodder, Wayne Lao, David Tsukada, Dario Diehl, Kenneth Schiff. Technical Report 816. Southern California Coastal Water Research Project. Costa Mesa, CA.</li><li>(0818) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/818_ASBSRockyIntertidal.pdf'>Characterization of the Rocky Intertidal Ecological Communities Associated with Southern California Areas of Special Biological Significance: Phase II.</a> 2014. Pete Raimondi. Technical Report 818. University of California Santa Cruz. Santa Cruz, CA</li><li>(0817) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/817_ASBSPlumes.pdf'>Assessing Areas of Special Biological Significance Exposure to Stormwater Plumes Using a Surface Transport Model.</a> 2014. Peter Rogowski, Eric Terrill, Lisa Hazard: Coastal Observing Research and Development Center (La Jolla, CA), Kenneth Schiff: Southern California Coastal Water Research Project (Costa Mesa, CA). Technical Report 817. </li><li>(0858) <a target='_blank' href='http://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/858_ASBS_BMPRep.pdf'>Proposition 84 Grant Evaluation Report: Assessing Pollutant Reductions to Areas of Biological Significance.</a> 2015. Kenneth Schiff, Jeff Brown. Technical Report 858. Southern California Coastal Water Research Project. Costa Mesa, CA.</li><li>(0703) <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/703_ASBS_Characterization.pdf'>Characterization of the Rocky Intertidal Ecological Communities Associated with Southern California Areas of Special Biological Significance.</a> 2012. P Raimondi, K Schiff, D Gregorio. Technical Report 703. Southern California Coastal Water Research Project. Costa Mesa, CA. <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/703_ASBS_Characterization_ES.pdf'>ABSTRACT</a> <a target='_blank' href='https://mail.ucsd.edu/owa/redir.aspx?C=iOZfBMvdEE6rA5DDzA0xR-ykkm_UENEIot-3pDwy_zAPdXYblIChpNzW62jTVDpsEnyByxGut6I.&URL=http%3a%2f%2fdocs.google.com%2fviewer%3furl%3dhttp%3a%2f%2fwww.sccwrp.org%3a8060%2fpub%2fdownload%2fDOCUMENTS%2fTechnicalReports%2f703_ASBS_Characterization.pdf'>PREVIEW</a></li><li>(0685) <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/685_B08RockyReef.pdf'>Southern California Bight 2008 Regional Monitoring Program: V. Rocky Reefs.</a> 2012. D Pondella, J Williams, J Claisse, R Schaffner, K Ritter, K Schiff. Technical Report 685. Southern California Coastal Water Research Project. Costa Mesa, CA. <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/685_B08RockyReef_ES.pdf'>ABSTRACT</a> <a target='_blank' href='https://mail.ucsd.edu/owa/redir.aspx?C=iOZfBMvdEE6rA5DDzA0xR-ykkm_UENEIot-3pDwy_zAPdXYblIChpNzW62jTVDpsEnyByxGut6I.&URL=http%3a%2f%2fdocs.google.com%2fviewer%3furl%3dhttp%3a%2f%2fwww.sccwrp.org%3a8060%2fpub%2fdownload%2fDOCUMENTS%2fTechnicalReports%2f685_B08RockyReef.pdf'>PREVIEW</a></li><li>(0641) <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/641_B08ASBS.pdf'>Southern California Bight 2008 Regional Monitoring Program: II. Areas of Special Biological Significance.</a> 2011. K Schiff, B Luk, D Gregorio, S Gruber. Technical Report 641. Southern California Coastal Water Research Project. Costa Mesa, CA. <a target='_blank' href='ftp://ftp.sccwrp.org/pub/download/DOCUMENTS/TechnicalReports/641_B08ASBS_ES.pdf'>ABSTRACT</a> <a target='_blank' href='https://mail.ucsd.edu/owa/redir.aspx?C=iOZfBMvdEE6rA5DDzA0xR-ykkm_UENEIot-3pDwy_zAPdXYblIChpNzW62jTVDpsEnyByxGut6I.&URL=http%3a%2f%2fdocs.google.com%2fviewer%3furl%3dhttp%3a%2f%2fwww.sccwrp.org%3a8060%2fpub%2fdownload%2fDOCUMENTS%2fTechnicalReports%2f641_B08ASBS.pdf'>PREVIEW</a></ul>"}});
    var ecoDoc = new OpenLayers.Layer.Vector("Ecosystems Assessments", { styleMap: hiddenStyle, metadata: {"info":"<h2>Ecosystems Assessments Documents</h2><p><a target='_blank' href='./lib/docs/FnlBioacCircStdyLaJollaBay.pdf'>Final Bioaccumulation and Circulation Study</a> - (2007) La Jolla Bay</p>"}});
        
    ///order of items in addLayersArr doesn't matter, except for z-index (?)
    addLayersArr = [ecoDoc, regMonDoc, asbs31Doc
        , esriOcean, navCharts, gMap, gSat, gHyb, gTer, topo
    	, anSST, roms, ww3
    	, probExp, ASBSpoly
    	, namWinds, hfrVelo, HABs
    	, bactStations, outfalls, sioMx];
    	
    ///built in reverse order
    groups = { "Special Studies and Documents": [ecoDoc, regMonDoc, asbs31Doc], 
        "Models": [ww3, namWinds, anSST, roms],
    	"Spatial Observations": [hfrVelo], 
    	"Static Point Observations": [probExp, ASBSpoly],
    	"Near Real-Time Point Observations": [HABs, bactStations, outfalls, sioMx]
    	};	
    vectorsArr = [bactStations, HABs, ASBSpoly, outfalls, sioMx, probExp];
}
