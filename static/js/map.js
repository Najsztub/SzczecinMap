// Nearly all code from here:  http://www.delimited.io/blog/2013/12/1/hexbins-with-d3-and-leaflet-maps
//**********************************************************************************
//********  LEAFLET HEXBIN LAYER CLASS *********************************************
//**********************************************************************************
L.HexbinLayer = L.Class.extend({
    includes: L.Mixin.Events,
    initialize: function(rawData, options) {
	this.levels = {};
	this.layout = d3.hexbin().radius(10);
	this.rscale = d3.scale.sqrt().range([0, 10]).clamp(true);
	this.rwData = rawData;
	this.config = options;
    },
    project: function(x) {
	var point = this.map.latLngToLayerPoint([x[1], x[0]]);
	return [point.x, point.y];
    },
    getBounds: function(d) {
	var b = d3.geo.bounds(d)
	return L.bounds(this.project([b[0][0], b[1][1]]), this.project([b[1][0], b[0][1]]));
    },
    update: function() {
	var pad = 100, xy = this.getBounds(this.rwData), zoom = this.map.getZoom();

	this.container
	    .attr("width", xy.getSize().x + (2 * pad))
	    .attr("height", xy.getSize().y + (2 * pad))
	    .style("margin-left", (xy.min.x - pad) + "px")
	    .style("margin-top", (xy.min.y - pad) + "px");

	if (!(zoom in this.levels)) {
	    this.levels[zoom] = this.container.append("g").attr("class", "zoom-" + zoom);
	    this.genHexagons(this.levels[zoom]);
	    this.levels[zoom].attr("transform", "translate(" + -(xy.min.x - pad) + "," + -(xy.min.y - pad) + ")");
	}
	if (this.curLevel) {
	    this.curLevel.style("display", "none");
	}
	this.curLevel = this.levels[zoom];
	this.curLevel.style("display", "inline");
    },
    genHexagons: function(container) {
	var data = this.rwData.features.map(function(d) {
	    var coords = this.project(d.geometry.coordinates)
	    return [coords[0],coords[1], d.properties];
	}, this);

	var bins = this.layout(data);
	var hexagons = container.selectAll(".hexagon").data(bins);

	var counts = [];
	bins.map(function(elem) { counts.push(elem.length) });
	this.rscale.domain([0, (d3.mean(counts) + (d3.deviation(counts) * 3))]);

	var path = hexagons.enter()
			   .append("path")
			   .attr("class", "hexagon");
	this.config.style.call(this, path);

	that = this;
	// that.rscale(d.length) <- goes into layout.hexagon() to scale
	// hexagons according to size
	hexagons.attr("d", function(d){ return that.layout.hexagon();})
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .on("mouseover", function(d) {
	            var pr=0, ar=0, pr_sq=0;
	            d.map(function(e){
	                if (e.length === 3) {
	                    pr += e[2].price;
	                    ar += e[2].area;
	                    pr_sq += e[2].price_sq;
	                }
	            });
	            that.config.mouse.call(this, [d.length, pr / d.length, ar / d.length, pr_sq / d.length]);
	            d3.select("#tooltip")
	              .style("visibility", "visible")
	              .style("top", function() { return (d3.event.pageY - 130)+"px";})
		      .style("left", function() { return (d3.event.pageX - 130)+"px";})
	        }).on("mouseout", function(d) { d3.select("#tooltip").style("visibility", "hidden") });
    },
    addTo: function(map) {
	map.addLayer(this);
	return this;
    },
    onAdd: function(map) {
	this.map = map;
	var overlayPane = this.map.getPanes().overlayPane;

	if (!this.container || overlayPane.empty) {
	    this.container = d3.select(overlayPane)
			       .append('svg')
			       .attr("id", "hex-svg")
			       .attr('class', 'leaflet-layer leaflet-zoom-hide');
	}
	map.on({ 'moveend': this.update }, this);
	this.update();
    }
});

L.hexbinLayer = function(data, styleFunction) {
    return new L.HexbinLayer(data, styleFunction);
};

// Hexbin map
// http://www.delimited.io/blog/2013/12/1/hexbins-with-d3-and-leaflet-maps
//Width and height
var w = 600;
var h = 600;
var margin = {top: 20, right: 20, bottom: 30, left: 40};
w = w - margin.right - margin.left;
h = h - margin.top - margin.bottom;
// load the external data
var myjson = "mongo/data";
d3.json(myjson, function(error, coords) {
    //console.log(dd);
    //Create SVG element

    // Leaflet map
    var cscale = d3.scale.linear().domain([0,1]).range(["#00FF00","#FFA500"]);
    var mymap = L.map('mapid').setView([53.45, 14.57], 12);
    L.tileLayer('https://api.mapbox.com/styles/v1/mnajsztub/cinwvybx6002qbunmn2hafrtp/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibW5hanN6dHViIiwiYSI6ImNpbnd2dmxzbTAwcjR2c2tsNnBza2J2OWkifQ.3MQPtu81nKJ5aG1dkvfQag', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	maxZoom: 18
    }).addTo(mymap);

    function reformat (array) {
	var data = [];
	array.map(function(d){
	    data.push({
	        properties: {
	            _id: d._id,
	            price: d.price,
	            area: d.pow,
	            price_sq: d.price / d.pow
	        },
	        type: "Feature",
	        geometry: {
	            coordinates:[+d.data_lon,+d.data_lat],
	            type:"Point"
	        }
	    });
	});
	return data;
    }
    var geoData = { type: "FeatureCollection", features: reformat(coords) };
    //**********************************************************************************
    //********  ADD HEXBIN LAYER TO MAP AND DEFINE HEXBIN STYLE FUNCTION ***************
    //**********************************************************************************

    var hexLayer = L.hexbinLayer(geoData, {
	style: hexbinStyle,
	mouse: makeInfo,
    });
    // Change scale
    hexLayer.rscale = d3.scale.sqrt().range([10, 10]).clamp(true);
    //hexLayer.rscale = function() {return ;
    hexLayer.addTo(mymap);

    function hexClicked(d) {
	function linkMsg(dt) {
	    //console.log(dt);
	    var msg = dt.price / 1000 + "k zł, " + dt.pow +" m², " + dt.rooms +"pok.";
	    return msg;
	}
	// TODO Change tooltip text from SVG to simple HTML
	function clickTooltip(data) {
	    d3.select("#tooltip").style("visibility", "hidden");
	    d3.select("#tooltip-text").selectAll(".arc").remove();
	    d3.select("#tooltip-text").selectAll(".pie").remove();
	    d3.select("#tooltip-text")
	      .style("visibility", "visible")
	      .style("top", function() {
	          return (d3.event.pageY - 130) + "px";
	      })
	      .style("left", function() { return (d3.event.pageX - 150)+"px";});

	    var svg = d3.select("#tooltip-text")
		        .select("svg")
		        .append("g")
		        .attr("class", "pie")
		        .attr("transform", "translate(8,16)");

	    var g = svg.selectAll(".arc")
		       .data(data)
		       .enter().append("g")
		       .attr("class", "arc");

	    g.append("svg:a")
	     .attr("xlink:href", function(d){ return d.url;})
	     .attr("xlink:show","new")
	     .append("svg:text")
	     .style("text-anchor", "left")
	     .text(function(d, i) {
	         return d.value === 0 ? "" : linkMsg(d); })
	     .attr("transform", function(d, i){return "translate(0," + i * 10 + ")";} )
	     .attr("font-size", "11px");

	    d3.select("#tooltip-text").select("svg")
	      .on("mouseleave", function(d) { d3.select("#tooltip-text").style("visibility", "hidden") });

	    //console.log(data);
	};

	//console.log("clicked! There are "+d.length+" items");
	var q = [];
	d.map(function(e){
	    q.push(e[2]._id);
	});
	// Only couple first attempts
	var maxAt = 10;
	if (q.length > maxAt ){
	    q = q.slice(0, maxAt);
	}

	$.ajax({
	    url: 'mongo/item',
	    type: 'POST',
	    data: JSON.stringify(q),
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    async: false,
	    success: function(msg) {
	        clickTooltip(msg);
	    }
	});
    };

    function hexbinStyle(hexagons) {

	var color = d3.scale.linear()
		      .domain([3000, 4000, 7000])
		      .range(["blue", "yellow", "red"])
		      .interpolate(d3.interpolateLab);
	var meanDat = function(d, key){
	    var res = 0
	    for(i = 0; i< d.length; i++){
	        res += d[i][2][key];
	    }
	    return res / d.length;
	};
	hexagons.attr("stroke", "black")
		.style("fill", function(d) {
	            //console.log(d3.mean(d.price_sq));
	            //console.log(d);
	            //return color(d.length); });
	            return color(meanDat(d, 'price_sq')); })
		.on("click", function(d) {
	            if (d3.event.defaultPrevented) return; // click suppressed
	            hexClicked(d);
	        });
    };
    //****************************************
    // On click
    //****************************************

    //**********************************************************************************
    //********  PIE CHART ROLL-OVER ****************************************************
    //**********************************************************************************

    function makeInfo (data) {
	// TODO Change info from SVG to simple HTML
	d3.select("#tooltip").selectAll(".arc").remove()
	d3.select("#tooltip").selectAll(".pie").remove()
	var names = ['N: ', 'cena: ', 'pow: ', 'PLN/m2: '];

	var svg = d3.select("#tooltip").select("svg")
		    .append("g")
		    .attr("class", "pie")
		    .attr("transform", "translate(10,20)");

	var g = svg.selectAll(".arc")
		   .data(data)
		   .enter().append("g")
		   .attr("class", "arc");

	g.append("text")
	 .style("text-anchor", "left")
	 .text( function (d, i) {
	     return d.value === 0 ? "" : names[i]+d.toFixed(2);})
	 .attr("transform", function(d, i){return "translate(0," + i * 18 + ")";} );
    }
});