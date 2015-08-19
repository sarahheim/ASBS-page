var defDefault = {
	pointRadius: 4,
	graphicName: "${type}",
	strokeWidth: 2,
	// fillOpacity: 0.6,
	fillOpacity: 1,
	// graphicZIndex: 1,
    graphicZIndex: 15
};
var defHover = {
    pointRadius: 6,
	strokeWidth: 2,
	label : "${lbl}",
	labelAlign: "lc",
	labelXOffset: 10,
	labelOutlineColor: "white",
	labelOutlineWidth: 3,
	fontSize: "12px",
	fillOpacity: 1,
	graphicZIndex: 16
};
var defSelect = {
    pointRadius: 8,
	strokeWidth: 4,
	fillOpacity: 1,
	graphicZIndex: 20
};

var defLabel = {
	context: {
		lbl: function(feature) {
		    // console.log("lbl", feature);
			if (feature.attributes.name) return feature.attributes.name;
			else if (feature.fid) return feature.fid;
			else return "";
		}
	}
}

var defPoint = {
	context: {
		type: function(feature) {
			if (feature.attributes.type) return feature.attributes.type;
			else return "circle";
		}
	}
};

function colorPoint(inner, outer) {
	var custom = new OpenLayers.StyleMap({
	    "default": new OpenLayers.Style(new OpenLayers.Util.applyDefaults({
			// fillColor: "#378F1E",
			fillColor: inner,
			strokeColor: outer
	    }, defDefault), defPoint),
	    "hover": new OpenLayers.Style(defHover, defLabel),
	    "select": new OpenLayers.Style(defSelect)
	});
	return custom;
}

function colorLine(color) {
	var customLn = new OpenLayers.StyleMap({
	    "default": new OpenLayers.Style({
			// fillColor: "#378F1E",
			strokeWidth: 2,
			strokeColor: color,
			graphicZIndex: 10
		}),
	    "hover": new OpenLayers.Style(defHover, defLabel),
	    "select": new OpenLayers.Style(defSelect)
	});
	return customLn;
}

function colorPoly(inner, outer) {
	var customPoly = new OpenLayers.StyleMap({
	    "default": new OpenLayers.Style({
			// fillColor: "#378F1E",
			strokeWidth: 2, 
			fillColor: inner,
			strokeColor: outer, 
			fillOpacity: 0.6,
			// fillOpacity: 1.0,
			graphicZIndex: 5
		}),
		"hover": new OpenLayers.Style(defHover, defLabel),
	    // "hover": new OpenLayers.Style(new OpenLayers.Util.applyDefaults({
	        // fillColor: inner,
	    // }, defHover), defLabel),
	    "select": new OpenLayers.Style(defSelect)
	    // "select": new OpenLayers.Style(new OpenLayers.Util.applyDefaults({
	        // fillColor: inner
	    // }, defSelect))
	});
	return customPoly;
}
var hiddenStyle = colorPoint("#FFF", "#FFF");
var redStyle = colorPoint("#FF7777", "#CC0000");
var grnStyle = colorPoint("#00CC00", "#235A15");
var blueStyle = colorPoint("#0000FF", "#0000CC");
var magStyle = colorPoint("#EE00EE", "#AA00AA");
var orngStyle = colorPoint("#FFAA00", "#BB7700");
var cyanStyle = colorPoint("#00FFFF", "#009999");
var scale9rainbow = ["#8000FF", "#00F", "#0080FF", "#0FF", "#0F0", "#FF0", "#FF8000", "#F00", "#C00"];
// var secs3 = ["#00F", "#0F0", "#FF0"];
var secs3 = ["#0F0", "#0FF", "#FF0"];
var scaleWhToBlu = ["#FFF", "#DDF", "#BBF", "#99F", "#66F", "#33F", "#00F", "#00D", "#00B", "#008"];

function customGroupStyleMap(value, group, colorScale, style) {

    lblContext = { lblVal: function(feature) {
        // console.log(value, feature.attributes[value]);
        if (typeof feature.attributes[value] != 'undefined') return "${"+value+"}";
        else return "";
    }}
    switch (style) {
        case "noLbl":
            var custStyleMap = new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    strokeWidth: 1,
                    fillOpacity: 0.8
                }, { rules: groupScaleRules(group, colorScale)}) });
            break;
        case "lblOnHover":
            var custStyleMap = new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    strokeWidth: 1,
                    fillOpacity: 0.6
                }, { 
                    rules: groupScaleRules(group, colorScale)
                }),
                "hover": new OpenLayers.Style({
                    fontSize: "11px",
                    label:"${lbl}",
                    labelOutlineColor: "white",
                    labelOutlineWidth: 3,
                    fillOpacity: 1,
                    strokeWidth: 2
                }, defLabel),
                "select": new OpenLayers.Style({
                    fillOpacity: 1,
                    strokeWidth: 3
                }, defLabel)
            });
        break;
        case "smallPointLbl":
            var custStyleMap = new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    strokeColor: "#000",
                    strokeOpacity: 1,
                    strokeWidth: 1,
                    fillOpacity: 0.8,
                    pointRadius: 7,
                    pointerEvents: "visiblePainted",
                    // label: "${"+value+"}",
                    label: "${lblVal}",
                    fontColor: "#000",
                    fontSize: "9px",
                    fontWeight: "bold",
                    labelAlign: "cm"
                }, {
                    rules: groupScaleRules(group, colorScale),
                    context: lblContext
                }),
                "hover": new OpenLayers.Style({
                    pointRadius: 8,
                    fontSize: "10px",
                    // label:"${name}",
                    label:"${lbl}\n\n${"+value+"}",
                    labelAlign:"cb",
                    // fontWeight: "bold",
                    labelYOffset: -3,
                    strokeWidth: 2
                }, defLabel),
                "select": new OpenLayers.Style({
                    label:"${lbl}\n\n${"+value+"}",
                    labelAlign:"cb",
                    // fontWeight: "bold",
                    labelYOffset: -3,
                    pointRadius: 11,
                    fontSize: "11px",
                    strokeWidth: 4
                }, defLabel)
            });
    }

    return custStyleMap;
}

function groupScaleRules(property, colorscale){
	rulesArr = [];
	for (s in colorscale) {
		// console.log(property, s, colorscale[s]);
		var scaleRule = new OpenLayers.Rule({
		    filter: new OpenLayers.Filter.Comparison({ type: OpenLayers.Filter.Comparison.EQUAL_TO, property: property, value: s }), 
		    symbolizer: { fillColor: colorscale[s] }
		});
		rulesArr.push(scaleRule);
	}
	var elseRule = new OpenLayers.Rule({
		// apply this rule if no others apply
	    elseFilter: true,
	    symbolizer: { fillColor: "#999" }
	});
	rulesArr.push(elseRule);
	// console.log("groupScaleRules", rulesArr);
	return rulesArr;
}