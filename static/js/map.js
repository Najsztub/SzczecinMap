// Nearly all code from here:  http://www.delimited.io/blog/2013/12/1/hexbins-with-d3-and-leaflet-maps
//**********************************************************************************
//********  LEAFLET HEXBIN LAYER CLASS *********************************************
//**********************************************************************************
L.HexbinLayer = L.Layer.extend({
	includes: L.Evented.prototype,
	initialize: function (rawData, options) {
		this.levels = {};
		this.layout = d3.hexbin().radius(10);
		this.rscale = d3.scaleSqrt().range([0, 10]).clamp(true);
		this.rwData = rawData;
		this.config = options;
	},
	project: function (x) {
		var point = this.map.latLngToLayerPoint([x[1], x[0]]);
		return [point.x, point.y];
	},
	getBounds: function (d) {
		var b = d3.geoBounds(d)
		return L.bounds(this.project([b[0][0], b[1][1]]), this.project([b[1][0], b[0][1]]));
	},
	refresh: function () {
		this.levels = {};
		this.onRemove();
		var overlayPane = this.map.getPanes().overlayPane;
		this.container = d3.select(overlayPane)
			.append('svg')
			.attr("id", "hex-svg")
			.attr('class', 'leaflet-layer leaflet-zoom-hide');


		this.update();
	},
	update: function () {
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
	genHexagons: function (container) {
		var data = this.rwData.features.map(function (d) {
			var coords = this.project(d.geometry.coordinates)
			return [coords[0], coords[1], d.properties];
		}, this);

		var bins = this.layout(data);
		var hexagons = container.selectAll(".hexagon").data(bins);

		var counts = [];
		bins.map(function (elem) { counts.push(elem.length) });
		this.rscale.domain([0, (d3.mean(counts) + (d3.deviation(counts) * 3))]);

		var path = hexagons.enter()
			.append("path")
			.attr("class", "hexagon");
		this.config.style.call(this, path);

		that = this;
		// that.rscale(d.length) <- goes into layout.hexagon() to scale
		// hexagons according to size
		path.attr("d", function (d) { return that.layout.hexagon(); })
			.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

	},
	addTo: function (map) {
		map.addLayer(this);
		return this;
	},
	onAdd: function (map) {
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
	},
	onRemove: function () {
		d3.select('#hex-svg').remove();
	},
	isHexLayer: true
});

L.hexbinLayer = function (data, styleFunction) {
	return new L.HexbinLayer(data, styleFunction);
};

var STATE = {};
STATE.style = {
	palete: {
		range: [3000, 4000, 7000],
		colors: ["blue", "yellow", "red"]
	},
	styleVar: 'price_sq',
	stat: 'mean'
};

// Hexbin map
// http://www.delimited.io/blog/2013/12/1/hexbins-with-d3-and-leaflet-maps

// load the external data
STATE.mymap = L.map('mapid').setView([53.45, 14.57], 12);
L.tileLayer('https://api.mapbox.com/styles/v1/mnajsztub/cinwvybx6002qbunmn2hafrtp/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibW5hanN6dHViIiwiYSI6ImNpbnd2dmxzbTAwcjR2c2tsNnBza2J2OWkifQ.3MQPtu81nKJ5aG1dkvfQag', {
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	maxZoom: 18
}).addTo(STATE.mymap);

// Update the statistics panel
var updateStistics = function (data, container) {
	var divStats = document.getElementById(container);
	divStats.innerHTML = '';
	var N = document.createElement("p");
	N.innerHTML = "Liczba obserwacji: " + data.length;
	divStats.appendChild(N);

	var sums = data.reduce((acc, item) => {
		return { price: acc.price + +item.price || 0, pow: acc.pow + +item.pow || 0 }
	});
	//means.price = means.price / data.length;
	//means.pow = means.pos / data.length;

	var m_price = document.createElement("p");
	m_price.innerHTML = "Średnia cena:<br>" + (sums.price / data.length).toFixed(0) + ' zł';
	divStats.appendChild(m_price);

	var m_price_sq = document.createElement("p");
	m_price_sq.innerHTML = "Średnia cena/m²:<br>" + (sums.price / sums.pow).toFixed(2) + ' zł/m²';
	divStats.appendChild(m_price_sq);


	var m_area = document.createElement("p");
	m_area.innerHTML = "Średnia powierzchnia:<br>" + (sums.pow / data.length).toFixed(2) + ' m²';
	divStats.appendChild(m_area);

}

// Plot map 
var plot_data = function (date) {
	d3.json("/date/" + date).then(data => {
		updateStistics(data, 'data-stats');
		addGeoData(data);
	});
}

/* redraw on date change */
var dateChange = function (selectObj) {
	var idx = selectObj.selectedIndex;
	var new_date = selectObj.options[idx].value;
	plot_data(new_date);
}

var varChange = function (selectObj) {
	var idx = selectObj.selectedIndex;
	switch (selectObj.options[idx].value) {
		case "mean_price_sqm":
			palete = {
				range: [3000, 4000, 7000],
				colors: ["blue", "yellow", "red"]
			};
			STATE.style = {
				palete: palete,
				styleVar: 'price_sq',
				stat: 'mean'
			};
			break;
		case "mean_price":
			palete = {
				range: [50e3, 300e3, 500e3],
				colors: ["blue", "yellow", "red"]
			};
			STATE.style = {
				palete: palete,
				styleVar: 'price',
				stat: 'mean'
			};
			break;
		case "mean_pow":
			palete = {
				range: [30, 50, 100],
				colors: ["blue", "yellow", "red"]
			};
			STATE.style = {
				palete: palete,
				styleVar: 'area',
				stat: 'mean'
			};
			break;
		case "N":
			palete = {
				range: [1, 25, 100],
				colors: ["blue", "yellow", "red"]
			};
			STATE.style = {
				palete: palete,
				styleVar: "N",
				stat: 'sum'
			};
			break;
	}
	hexLayer.config.style = styleFunc(STATE.style);
	hexLayer.refresh();
}

var hexLayer = [];

// Add data to map
var addGeoData = function (data) {
	// Clear hexbin Layers
	STATE.mymap.eachLayer(function (l) {
		if (l.isHexLayer === true) {
			l.remove();
		}
	});

	// Reformat data for hexbin layer
	function reformat(array) {
		var data = [];
		array.map(function (d) {
			data.push({
				properties: {
					_id: d._id,
					price: d.price,
					area: d.pow,
					price_sq: d.price / d.pow
				},
				type: "Feature",
				geometry: {
					coordinates: [d.data_lon, d.data_lat],
					type: "Point"
				}
			});
		});
		return data;
	}
	var geoData = { type: "FeatureCollection", features: reformat(data) };
	//**********************************************************************************
	//********  ADD HEXBIN LAYER TO MAP AND DEFINE HEXBIN STYLE FUNCTION ***************
	//**********************************************************************************

	hexLayer = L.hexbinLayer(geoData, {
		style: styleFunc(STATE.style),
		mouse: makeInfo,
	});
	// Change scale
	hexLayer.rscale = d3.scaleSqrt().range([1, 10]).clamp(true);
	//hexLayer.rscale = function() {return ;
	hexLayer.addTo(STATE.mymap);

	//**********************************************************************************
	//********  PIE CHART ROLL-OVER ****************************************************
	//**********************************************************************************

	function makeInfo(data) {
		// TODO Change info from SVG to simple HTML
		d3.select("#tooltip").selectAll(".arc").remove()
		d3.select("#tooltip").selectAll(".pie").remove()
		var names = ['N: ', 'cena: ', 'pow: ', 'PLN/m²: '];

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
			.text(function (d, i) {
				return d.value === 0 ? "" : names[i] + d.toFixed(2);
			})
			.attr("transform", function (d, i) { return "translate(0," + i * 18 + ")"; });
	}
}

// Get initial data
fetch("/dates").then(dates => dates.json()).then(dates => {
	var max_date = dates[0]['$date'];
	plot_data(max_date);
});


/* Create date selector */
window.onload = function () {
	fetch('/dates').then(dates => dates.json()).then(dates => {
		var newSelect = document.getElementById('data-dates');
		index = 1;
		for (element in dates) {
			var opt = document.createElement("option");
			var date = dates[element]['$date'];
			opt.value = date;
			var ts = new Date(date);
			opt.innerHTML = ts.getDate() + '-' + ts.getMonth() + '-' + ts.getFullYear(); // whatever property it has
			// then append it to the select element
			newSelect.appendChild(opt);
			index++;
		}
	});

}


var styleFunc = function (style) {
	var_name = style.styleVar;
	palete = style.palete;

	var color = d3.scaleLinear()
		.domain(palete.range)
		.range(palete.colors)
		.interpolate(d3.interpolateLab);

	function hexbinStyle(hexagons) {
		var stats = {
			mean: function (d, key) {
				return this.sum(d, key) / d.length;
			},
			sum: function (d, key) {
				if (key === "N") return d.length;
				else {
					var res = 0
					for (i = 0; i < d.length; i++) {
						res += d[i][2][key];
					}
					return res;
				}
			}
		};
		hexagons.attr("stroke", "black")
			.style("fill", function (d) {
				return color(stats[style.stat](d, var_name));
			});
	};
	drawLegend(color);
	return hexbinStyle;
}

var drawLegend = function (scale) {
	// Code based on: https://bl.ocks.org/starcalibre/6cccfa843ed254aa0a0d
	// add the legend now

	d3.select('#legend-svg').selectAll('*').remove();
	var legendFullHeight = 50;
	var legendFullWidth = 200;

	var legendMargin = { top: 0, bottom: 20, left: 15, right: 15 };

	// use same margins as main plot
	var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
	var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

	var legendSvg = d3.select('#legend-svg')
		.attr('width', legendFullWidth)
		.attr('height', legendFullHeight)
		.append('g')
		.attr('transform', 'translate(' + legendMargin.left + ',' +
			legendMargin.top + ')');

	// append gradient bar
	var gradient = legendSvg.append('defs')
		.append('linearGradient')
		.attr('id', 'gradient')
		.attr('x1', '0%') // bottom
		.attr('y1', '0%')
		.attr('x2', '100%') // to top
		.attr('y2', '0%')
		.attr('spreadMethod', 'pad');

	// programatically generate the gradient for the legend
	// this creates an array of [pct, colour] pairs as stop
	// values for legend
	domain = scale.domain();
	var pct = domain.map(function (d) {
		return Math.round(100 * (d - d3.min(domain)) / (d3.max(domain) - d3.min(domain))) + '%';
	});

	var colourPct = d3.zip(pct, scale.range());

	colourPct.forEach(function (d) {
		gradient.append('stop')
			.attr('offset', d[0])
			.attr('stop-color', d[1])
			.attr('stop-opacity', 1);
	});

	legendSvg.append('rect')
		.attr('x1', 0)
		.attr('y1', 0)
		.attr('width', legendWidth)
		.attr('height', legendHeight)
		.style('fill', 'url(#gradient)');

	// create a scale and axis for the legend
	var legendScale = d3.scaleLinear()
		.domain([d3.min(domain), d3.max(domain)])
		.range([0, legendWidth]);

	var legendAxis = d3.axisBottom()
		.scale(legendScale)
		.tickValues(domain)
		.tickFormat(d3.format("d"));

	legendSvg.append("g")
		.attr("class", "legend axis")
		.attr("transform", "translate(0, " + legendHeight + ")")
		.call(legendAxis);
}
