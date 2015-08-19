/*----------------------------------------------
Author: Sarah Heim

currently using t1  & td for vectors (met)
but may want to just use t0 & T1 
----------------------------------------------*/
var ht, wd;
var chart;
var utcData, adjData;

var chartUrl, chartFun;
var t0, t1; ///start and end times in milliseconds
var td; ///seconds between start and end times 
var exy;
var unitAlias = {"meters":"m", "c":"°C", "gallons":"gal", "hits/cm2/h":"hits/cm2/hr"};
var conversions = {"°C": ["°F", 3.28084],
    "m/s": ["knots", 1.94384],
    "cm/s": ["knots", 0.0194384449],
    "knots": ["m/s", 0.51444],
    "mm": ["in", 0.0393701],
    "mm/h": ["in/hr", 0.0393701],
    "mL": ["oz", 0.033814],
    "m": ["ft", 3.28084],
    "hits/cm2": ["hits/in2", 0.155],
    "hits/cm2/hr": ["hits/in2/hr", 0.155],
    "gal" : ["L", 3.78541],
    "gal/min" : ["L/min", 3.78541],
    // "mg/m3": [],
};

///
function chartError(msg) {
    chartBusyDone();
    //if chart empty, hide south?
    // console.log("chart error:", msg);
    alert(msg);
}

//Converts number w/ unit to a corresponding number/unit, uses "conversions" variable
function convert(preNum, preUnits) {
    var postNum = parseFloat(preNum*conversions[preUnits][1]).toFixed(2);
    var postUnits = conversions[preUnits][0];
    return [postNum, postUnits];
}

//Called when the timezone dropdown is changed
function changedTZO() {
    setBrowserTimes();
    changedMapTime();
	if ((typeof chart != 'undefined') && (chart.series[0].data.length > 0) && (document.getElementById("localGraph").checked)) {
		var seriesData = adjustDataToTZO(utcData);
		// var newDataOpts = chart.options;
		// newDataOpts.series[0].data = seriesData;
		chart.options.series[0].data = seriesData;
		chart = new Highcharts.Chart(chart.options);
		setChartSize();
	}
}

//Called when the "Display time" radio option under Graphs is changed 
function changedDisplayTimeRadio() {
    if ((typeof chart != 'undefined') && (chart.series[0].data.length > 0)) {
        if (document.getElementById("localGraph").checked) {
            var seriesData = adjustDataToTZO(utcData);
            chart.options.series[0].data = seriesData;
        } else {
            chart.options.series[0].data = utcData;
        }
            chartBusyProc();
            chart = new Highcharts.Chart(chart.options);
            setChartSize();
    }
}

function adjustDataToTZO(data) {
	if ($('#tzoSel').val() == 0) {
		return data; //data in utc
	} else {
		adjData = [];
		var adjustMS = $('#tzoSel').val()*60*1000;
		$.each(data, function(i, val) {
			var utcTime = val[0];
			tzoSelTime = utcTime+adjustMS;
			if (val.length == 3) {
			    adjData.push([tzoSelTime, val[1], val[2]]);
			} else {
			    adjData.push([tzoSelTime, val[1]]);
			}
			
		});
		return adjData;
	}
}

function showChartData(){
    try {
        if (document.getElementById("localGraph").checked) {
            var adjustStr = (/:00/.test($('#tzoSel option:selected').text())) ? $('#tzoSel option:selected').text().split(':')[0]: $('#tzoSel option:selected').text();
            console.log("use adjData", adjData.length);
            dlData = adjData;
            timeTxt = "(UTC"+" "+adjustStr+")";
            
        } else {
            console.log("use utcData", utcData.length);
            dlData = utcData;
            timeTxt = "UTC";
        }
        var dataStr = "<table border='1'>"+chart.title.textStr+"<br>"+chart.subtitle.textStr+"<br><br>";
        // dataStr += "epoch ms "+timeTxt+", time string "+timeTxt+", data, unit\n"
        dataStr += "<tr><th>time string "+timeTxt+"</th><th>data</th><th>unit</th></tr>";
        $.each(dlData, function(i, pt) {
           // console.log(i, pt);
           var tmp = new Date(pt[0]).toISOString().split(":");
           dateStr = tmp[0]+":"+tmp[1]+" "+adjustStr;
           // dataStr += "<tr><td>"+pt[0]+"</td><td>"+dateStr+"</td><td>"+pt[1]+"</td><td>"+chart.series[0].yAxis.axisTitle.textStr+"</td></tr>";
           dataStr += "<tr><td>"+dateStr+"</td><td>"+pt[1]+"</td><td>"+chart.series[0].yAxis.axisTitle.textStr+"</td></tr>";
        });
        dataStr += "</table>";
        
        var lyrInfo = document.createElement('div');
        lyrInfo.id = "chartDataDialog";
        lyrInfo.title = "Chart Data"
        lyrInfo.innerHTML = dataStr;
        $("#map").append(lyrInfo);
        $("#chartDataDialog").dialog({ modal:true,
            resizeable: true,
            draggable: false,
            height:"auto",
            maxHeight:500,
            width: 400,
            dialogClass: "dialogBox" 
        });   
    } catch(err) {chartError("Can not show graph data")}
}

function downloadChartData() {
    try {
        if (document.getElementById("localGraph").checked) {
            var adjustStr = (/:00/.test($('#tzoSel option:selected').text())) ? $('#tzoSel option:selected').text().split(':')[0]: $('#tzoSel option:selected').text();
            console.log("use adjData", adjData.length);
            dlData = adjData;
            timeTxt = "(UTC"+" "+adjustStr+")";
            
        } else {
            console.log("use utcData", utcData.length);
            dlData = utcData;
            timeTxt = "UTC";
        }
        var metaStr = chart.title.textStr+"\n"+chart.subtitle.textStr;
        var now = new Date()
        metaStr += "\nrequested: "+now.toISOString()+"\n"+now.toString();
        dataStr = metaStr+"\n\n"
        dataStr += "epoch ms "+timeTxt+", time string "+timeTxt+", data, unit\n"
        $.each(dlData, function(i, pt) {
           // console.log(i, pt);
           var tmp = new Date(pt[0]).toISOString().split(":");
           dateStr = tmp[0]+":"+tmp[1]+" "+adjustStr;
           dataStr += pt[0]+", "+dateStr+", "+pt[1]+", "+chart.series[0].yAxis.axisTitle.textStr+"\n";
        });
        
        var encodedUri = encodeURI(dataStr);
        if (/Trident/.test(navigator.userAgent)) { //For IE
            var blob = new Blob([dataStr],{ type: "text/csv;charset=utf-8;" });
            navigator.msSaveBlob(blob, "graph_data.csv");
        } else { // All other browsers
            $("#dnld").attr("href", "data:text/csv;charset=utf-8,"+encodedUri).attr("download", "graph_data.csv");
        }
    } catch(err) { chartError("Can not download graph data"); }
}

//Puts data in chart under Graphs
//Various functions that take data in different formats (JSON, WMS getFeatureInfo), call this
function makeStandardChart(title, subtitle, units, utcData) {
	window.utcData = utcData;
	dataVals = (document.getElementById("utcGraph").checked) ? utcData : adjustDataToTZO(utcData);
	console.log($("#duration").val(), dataVals.length );
	markerRadius = (utcData.length > 200) ? 1 : 2;
	units = $.trim(units).toLowerCase();
	if (units.toLowerCase() in unitAlias) {
	    console.log(units, unitAlias[units.toLowerCase()]); 
	    units = unitAlias[units.toLowerCase()]; 
	}
	var yAxisArr = [{
            title: { 
                    text: units,
                    align: 'high',
                    rotation:0,
                    offset: 10,
                    y: -10
            } 
    }];
    //Have two y-axises if there is a conversion
    if (units in conversions) {
        yAxisArr.push({
            title: {
                text: conversions[units][0],
                align: 'high',
                rotation:0,
                offset: 20,
                y: -10
            },
            opposite: true,
            linkedTo:0,
            labels: {
                formatter: function() {
                    // console.log("label converted:", this.value, convert(this.value, units)[0]);
                    return convert(this.value, units)[0];
                }
            }       
        });
    }
    /// define the options
	var options = {
		chart: 
			{ 
				renderTo: 'chart',
				events: {
					load: function(event) {
					    chartBusyDone(); 
					}
				} 
			},
		title: { text: title },
		subtitle: { text: subtitle },
		xAxis: { type: 'datetime' },
        yAxis: yAxisArr,
		// yAxis: [
			// {  title: 
				// { 
					// text: unitStr,
					// align: 'high',
					// rotation:0,
					// offset: 10,
					// y: -10
				// } 
			// }],
		legend: { enabled: false },
		tooltip: {
			shared: true,
			crosshairs: true,
			pointFormat: '{series.name}: <b>{point.y}</b> '+units,
			formatter: function () {
			    thisDate = Highcharts.dateFormat('%a %b %e %Y %H:%M', this.x)+"<br>";
			    var value = ((typeof this.y == 'number') && (this.y % 1 != 0))? this.y.toFixed(2) : this.y;
                if (units in conversions) {
                    post = convert(this.y, units);
                    // var post = parseFloat(this.y*conversions[units][1]).toFixed(1);
                    // var postUnit = conversions[units][0];
                    thisDate += title+": <b>"+value+units+"</b>,<b>"+post[0]+post[1]+"</b>";
                } else {
                    thisDate += title+": <b>"+value+units+"</b>";
                } 
                if (dataVals[0].length == 3) {
                    thisDate += "<br>Direction: <b>"+this.points[0].key+"\u00B0</b>"; //\u00B0 is degree symbol
                }
                return thisDate;
			},
			dateTimeLabelFormats: {
				millisecond: '%b %e %y %H:%M:%S.%L',
				second: '%b %e %y %H:%M:%S',
				minute: '%b %e %y %H:%M',
				hour: '%b %e %y %H:%M',
				day: '%b %e %y %H:%M',
				month: '%b \'%y',
				year: '%Y'
			}
		},
		plotOptions: { 
			line: {
				marker: { radius: markerRadius}
			}
		},
		series: [{ 
					name: title,
					// data: dataVals
					data:[] 
				}]
	};

    //Direction
    if ((typeof dataVals[0] != 'undefined') && (dataVals[0].length == 3)) {
        for (i in dataVals){
            arr = dataVals[i];
            //only use marker symbol if less than 50 points
            if (dataVals.length > 100) { //50?!!!
                options.series[0].data.push({ x: arr[0], y: arr[1], name: arr[2].toFixed().toString() });
            } else {
                if(/wind/i.test(title) || /wind/i.test(subtitle)) {
                    dirMarker = 'url(http://neocoweb.ucsd.edu/cgi-bin/asbs/barb.py?sp='+arr[1]+'&dir='+arr[2]+')'
                } else {
                    //ocean current
                    dirMarker = 'url(http://neocoweb.ucsd.edu/cgi-bin/asbs/arrow.py?dir='+arr[2]+')'
                }
                options.series[0].data.push({ x: arr[0], y: arr[1], marker: {symbol: dirMarker}, name: arr[2].toFixed().toString()});                
            }
        }
    } else {
        options.series[0].data = dataVals;
        // options.tooltip.formatter = function () {}
    }
    
    
	ht = $("#chartWrapper").height();
	wd = $("#chartWrapper").width();
	myLayout.south.options.onresize_end = function () {setChartSize();}
	
	// if (myLayout.state.south.isVisible == false) {
		// myLayout.open('south', false);
	// }

	noDataMsg = 'No data is available at the selected location and/or with in the "Time Span"';
	if (dataVals.length == 0) {
		orig = $("#duration").val();
		var loop = ((typeof chart == 'undefined') || (loop == true)) ? true: false;
		if ((document.getElementById("now").checked == true) && (orig != 31536000) && (typeof loop != 'undefined') && (loop)) {
			$("#duration option").each(function(){
				optVal = parseInt($(this).val())
				if (optVal > orig) {
					var step = function (optVal) {
						var dfrd = $.Deferred();
						$("#duration").val(optVal.toString());
						console.log("setting duration:", optVal);
						timeSpan();
						setGraph();
						dfrd.resolve(); // use Deferred??
						return dfrd.promise();
					}
					var callstep = step(optVal);
					step.done(); //Doesn't work with callstep.done()??
					// step.done(function() {console.log("post setGraph");}); //Not right console log
				} //else { console.log("ignore - smaller duration");}
			});
			loop = false;
		} else {
			chartError(noDataMsg);
		}
		delete loop;
		// chartError(noDataMsg);
	}	
	chart = new Highcharts.Chart(options);
	setChartSize();
	$("#chart").val("usingChart");

}

//Takes json data returned and puts data in chart
function makeJsonChart(jsn) {
    $.each(jsn, function(mainKey, mainVal){
    	// console.log("main key", mainKey);
    	if (mainKey.toLowerCase() != 'meta') {
    		if (jsn[mainKey]["station"]) {
    			var subTitle = mainKey+' - '+jsn[mainKey]["station"];
    		} else {subTitle = mainKey}
    		// chTitle = jsn[mainKey]["station"];
    		$.each(jsn[mainKey], function(key, val){
    			if (key != 'station') {
    				var title = ("stats_interval" in val) ? val["title"]+" ("+val["stats_interval"]+" data)" : val["title"];
		    		makeStandardChart(title, subTitle, val["unit"], val["data"]);
					$("#vectOpt").removeAttr('disabled');
					$("#vectOpt").attr('selected', 'selected');
					$("#chartLayer").attr('disabled', 'disabled');
		        }
	        });
    	} 
    });
}

//Creates a chart with values from a WMS getFeatureInfo
function makeWMSchart(event, lyrName) {
	if (event.request.status == 200){
		var doc = event.request.responseXML;
        if (event.request.responseText.match(/ServiceException/g)) {
            chartError("Error: WMS getFeatureInfo ServiceException");
        } else {		
    		makeXMLChart(doc, lyrName);
    	}
	} 
	else { 
		chartBusyDone();
		console.log(event);
		chartError("Error: WMS get feature info");
	}
}

function makeXMLChart(xml, lyrName) {
    // if (xml.getElementsByTagName("ServiceExceptionReport").length > 0) {
    timeValsArr = [];
    // xml.text() += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
    // var pts = xml.getElementsByTagName("Point");
    // if (pts.length == 0) pts = xml.getElementsByTagName("FeatureInfo");
    var pts = $(xml).find("Point")
    if (pts.length == 0) pts = $(xml).find("FeatureInfo");
    // console.log("js:", pts);
    // console.log("jq", $(xml).find("Point"));
    var ptTime;
    var ptVal;
    var ptDir = false;
    var xmlTitle;
    var xmlUnits;
    $(pts).each(function(i, pt){
        // console.log(pt);
        $(pt.childNodes).each(function(j, kid){
            if (kid.firstChild) {
                kidVals = kid.firstChild; 
                if (kid.getAttribute('Var') == "Direction") {
                    ptDir = parseFloat(kidVals.nodeValue);
                }
                else {
                    // console.log(kidVals.parentElement.tagName, kidVals.nodeValue);
                    if (kidVals.parentNode.tagName.toLowerCase() == "time") {
                        //Convert string time ("%m-%d-%Y %H:%M:%S") to UTC epoch
                        var nodeTime = kidVals.nodeValue;
                        if (nodeTime.indexOf('Z') == -1) {nodeTime += "Z";} //FF assumes local otherwise
                        ptTime = new Date(parseDate(nodeTime)).getTime()
                        // console.log(kidVals.nodeValue, ptTime);
                    } else if (kidVals.parentNode.tagName.toLowerCase() == "value") {
                        ptVal = parseFloat(kidVals.nodeValue);
                        xmlTitle = kid.getAttribute('Var');
                        xmlUnits = kid.getAttribute('Unit');
                        // console.log(xmlTitle, ptVal, xmlUnits);
                    }           
                } 
            }
        });
        if (ptDir) {
            timeValsArr.push([ptTime, ptVal, ptDir])
        } else {
            timeValsArr.push([ptTime, ptVal])
        }
    });
    // console.log(xmlTitle, lyrName, xmlUnits, timeValsArr);
    makeStandardChart(xmlTitle, lyrName, xmlUnits, timeValsArr);
    $("#chartLayer").removeAttr('disabled');
    $("#vectOpt").attr('disabled', 'disabled');
}

//Takes the timespan, and puts into format for WMSFeatInfo - WMS getFeatureInfo
function wmsTimeSpan() {
	timeSpan();
	if (td > 604800) {
	    alert("Time span for WMS has been reduced to 1 week");
	    $("#duration").val("604800");
	    timeSpan();
	}
	var wmsStart = new Date(t0);
	var wmsEnd = new Date(t1);
	   /// !!!Currently for HFR, only takes time w/ mins, secs set to zero
        wmsStart.setUTCMinutes(0);
        wmsStart.setUTCSeconds(0);
        wmsStart.setUTCMilliseconds(0);
        wmsEnd.setUTCMinutes(0);
        wmsEnd.setUTCSeconds(0);
        wmsEnd.setUTCMilliseconds(0);
	var wmsTimeStr = wmsStart.toISOString()+'/'+wmsEnd.toISOString(); 
	// console.log(wmsTimeStr);
	return wmsTimeStr;
}

//Updates global variables: "t0", "t1", "td", according to selected "Time span" in Graphs section
function timeSpan() {
	if (document.getElementById("now").checked) {
		t1 = new Date().getTime();
		td = $("#duration").val();
		t0 = t1 - (td*1000);
	} else {
		// reDate = RegExp(/^\d{2}\/\d{2}\/\d{4}$/); /// mm/dd/yyyy
		try {
			dpStart = $( "#datepickerSt" ).datepicker("getDate").getTime();
			dpEnd = $( "#datepickerEnd" ).datepicker("getDate").getTime();
			t0 = dpStart - (TZoffset*60*1000);
			t1 = dpEnd - (TZoffset*60*1000);
			td = (t1-t0)/1000;
		} catch(err) {
			// alert("unexpected date format (use: mm/dd/yyyy)");
			chartError("Error:  date input:"+ error.message);
			console.log(dpStart, dpEnd);
		}
	}
	// console.log(t0, t1, td);
}

//Converts time in string from WMS getFeatureInfo to JS time
function parseDate(input) {
  // var parts = input.match(/(\d+)/g);
  // // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  // return new Date(parts[1]-1, parts[2], parts[0], parts[3]-1, parts[4], parts[5]); // months are 0-based
  ///Expected format: mm-dd-yyyy HH:MM:ss
  ///Adjust wms date/time format to js format
  return new Date(input.replace(/(\d+)\-(\d+)\-(\d+) (\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6')).getTime();
}

//Sets chart's size
function setChartSize() {
	// console.log("south onresize wrapper", $("#chartWrapper").width(), $("#chartWrapper").height());
	// console.log('--chart', $("#chart").width(), $("#chart").height());
	if (myLayout.state.south.isVisible == true) {
    	setTimeout(function(){
    		if (typeof chart != 'undefined') {
	    		if (($("#chartWrapper").height() != ht) || ($("#chartWrapper").width() != wd)) {
	    			// console.log("reset chart size");
	    			chart.setSize($("#chart").width(), $("#chart").height(), false);
	    			ht = $("#chartWrapper").height();
					wd = $("#chartWrapper").width();
					// console.log('--chart', $("#chart").width(), $("#chart").height());
	    		}
	    		if ($("#chartWrapper").height() != $("#chart").height()) {
	    			// console.log($("#chart").width(), $("#chartWrapper").height());
	    			chart.setSize($("#chart").width(), $("#chartWrapper").height(), false);
	    		}
	    	}
    	}, 300);
	}
}

//If parameter exists in a url, adjusts value otherwise adds parameter to url 
function urlAdjVar(varUrl, varType, varVal) {
	var re = new RegExp("&?"+varType+"=\\d+", 'i');
	if (re.test(varUrl)) {
		splitter = re.exec(varUrl);
		tmpArr = varUrl.split(splitter);
		newUrl = tmpArr[0]+'&'+varType+'='+varVal+tmpArr[1];
	} else {
		newUrl = varUrl+'&'+varType+'='+varVal;
	}
	// chartUrl = newUrl;
//	console.log(varType, chartUrl);
	return newUrl;
}

//adds global timespan values to url
function adjustTdT1() {
	if (chartUrl && chartFun) {
		chartUrl = urlAdjVar(chartUrl, 't1', t1);
		chartUrl = urlAdjVar(chartUrl, 'td', td);
	} else { chartError("Error: updating chart");}
}

//Use URL (to in-house python script) to query and get results in JSON (to make chart)
function jsonPlot(pyUrl) {
	timeSpan();
	chartUrl = pyUrl;
	chartFun = "jsonPlot";
	$("#chartLayer").val('x');
	adjustTdT1();
	console.log(chartUrl);
	$.ajax({
        url: chartUrl,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        success: function(data) {
       		makeJsonChart(data);
        },
        error: function(request,error) { 
        	// console.log(pyUrl);
 			chartError ( "Error: ajax json: " + error ); 
        }
    });	
}

//Update chart (mostly for WMS if a graph setting was changed)
function setGraph() {
	chartBusyProc();
	var lyrId = $("#chartLayer").val();
	// console.log(lyrId);
	if (lyrId == 'x') {
		if (typeof chartFun == 'undefined') {
			// chartBusyDone();
			chartError('Selection required to display graph');
		}
		eval(chartFun+'("'+ newUrl+'")');
	} else { /// assuming wms layer
		var lyr = map.getLayer(lyrId);
		if (typeof markers == 'undefined') {
			// chartBusyDone();
			chartError("A location on the map needs to be selected.");
		} else {
			WMSFeatInfo(lyr);
		} 
	}
}

//Removes chart
function remGraph() {
	// console.log("removing Graph", $("#chartLayer option").length);
	// $("#chart").highcharts().destroy();
	chart.destroy();
	utcData = undefined;
	chart = undefined;
	chartUrl = undefined;
	chartFun = undefined;
	$("#chartLayer").attr('disabled', 'disabled');
	$("#chart").text("Selection required to display graph");
	if (typeof markers != 'undefined') {
		markers.destroy();
		markers = undefined;
	}
}

//Use JQuery's datepicker for Graph start and end dates
$(function() {$( "#datepickerSt" ).datepicker()});
$(function() {$( "#datepickerEnd" ).datepicker()});