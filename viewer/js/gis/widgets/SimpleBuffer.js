define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	"dijit/_TemplatedMixin",

	'dojo/dom-construct',
	'dijit/registry',
	'dijit/TooltipDialog',
	'dijit/popup',

	'dojo/on',
	'dojo/_base/lang',
	'dojo/aspect',
	'dojo/topic',
	"dojo/query",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/dom-class",

	"esri/Color",
	"esri/graphic",
	"esri/SpatialReference",
	"esri/geometry/Point",
	"esri/geometry/normalizeUtils",
	"esri/geometry/webMercatorUtils",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/PictureMarkerSymbol",
	"esri/layers/GraphicsLayer",
	"esri/toolbars/draw",
	'esri/config',

	"esri/tasks/GeometryService",
	"esri/tasks/BufferParameters",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",

	"libs/usng/usng",

	"dojo/text!./SimpleBuffer/templates/SimpleBuffer.html",
	'xstyle/css!./SimpleBuffer/css/simpleBuffer.css'
], function(
	declare,
	_WidgetBase,
	_TemplatedMixin,

	domConstruct,
	registry,
	TooltipDialog,
	popup,

	on,
	lang,
	aspect,
	topic,
	query,
	dom,
	domStyle,
	domClass,

	Color,
	Graphic,
	SpatialReference,
	Point,
	normalizeUtils,
	webMercatorUtils,
	SimpleFillSymbol,
	SimpleLineSymbol,
	SimpleMarkerSymbol,
	PictureMarkerSymbol,
	GraphicsLayer,
	Draw,
	esriConfig,

	GeometryService,
	BufferParameters,
	IdentifyTask,
	IdentifyParameters,

	usng,

	template
) {

	/**
	 * CoordinateLocation constructor.
	 * @param props
	 * @constructor
	 */
	var CoordinateLocation = function(props) {
		this.point = null;
		this.success = false;
		this.message = "";
		this.setProperties = function(props) {
			for (var prop in props) {
				this[prop] = props[prop];
			}
		};

		if (props) this.setProperties(props);
	};

	return declare([_WidgetBase, _TemplatedMixin], {
		baseClass: 'gis_simpleBufferDijit',
		bufferFillColor: [168, 0, 132, 0.25],
		bufferLineColor: [168, 0, 132, 0.5],
		bufferedGraphicFillColor: [0, 0, 255, 0.15],
		bufferedGraphicLineColor: [0, 0, 255, 0.5],
		bufferedGeodesic: true,
		rootFolder: "js/gis/widgets/SimpleBuffer/",
		mapIcons: {
			crosshair: {
				url: 'images/crosshair_red.png',
				height: 30,
				width: 30
			}
		},
		featureServiceURL: null,
		featureServiceLayers: null,
		templateString: template,
		title: 'Simple Buffer Widget',
		draggable: true,
		mapClickMode: null,

		postCreate: function() {
			this.inherited(arguments);
			this.own(topic.subscribe('mapClickMode/currentSet', lang.hitch(this, 'setMapClickMode')));

			if (this.parentWidget && this.parentWidget.toggleable) {
				this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function() {
					this.onLayoutChange(this.parentWidget.open);
				})));
			}
			// set required options...
			if (this.params.featureServiceURL) {
				this.featureServiceURL = this.params.featureServiceURL;
			} else {
				console.log("ERROR Loading SimpleBuffer Widget: The featureServiceURL option needs to be declared in widget configuration.");
			}
			if (this.params.featureServiceLayers) {
				this.featureServiceLayers = this.params.featureServiceLayers;
			} else {
				console.log("ERROR Loading SimpleBuffer Widget: The featureServiceLayers option needs to be declared in widget configuration.");
			}

			this.bufferLayer = this.map.getLayer("GEO_BufferLayer");
			if (this.bufferLayer === undefined) {
				this.bufferLayer = new GraphicsLayer({
					id: "GEO_BufferLayer"
				});
				this.map.addLayer(this.bufferLayer);
			}

			this.mapCoorPlacemarksLayer = this.map.getLayer("GEO_MapCoorPlacemarks");
			if (this.mapCoorPlacemarksLayer === undefined) {
				this.mapCoorPlacemarksLayer = new GraphicsLayer({
					id: "GEO_MapCoorPlacemarks"
				});
				this.map.addLayer(this.mapCoorPlacemarksLayer);
			}

			// override the alerts from the USNG widget to show the messages in the tools message center.
			window.alert = lang.hitch(this, function(message) {
				message = message || "An error occurred converting the MGRS value.";
				this._showInfo(message, 'error');
			});

			this._initWidget();
			this._createToolbar();

			// if open at startup, disable other map click events and tools
			if (this.parentWidget.open) {
				// delayed to ensure the default tool is set before changing it...
				setTimeout(lang.hitch(this, function() {
					//this._showInfo('STARTUP Active Buffer tool!','success');
					topic.publish('mapClickMode/setCurrent', 'simplebuffer');
					this.map.setInfoWindowOnClick(false);
				}), 5000);
			}
		},


		onLayoutChange: function(open) {
			// end edit on close of title pane
			if (!open) {
				//this._showInfo('Deactivating Buffer tool!','error');
				topic.publish('mapClickMode/setDefault');
				this._deactivateEditing();
				this.map.setInfoWindowOnClick(true);
			} else {
				//this._showInfo('ACTIVATING Buffer tool!','success');
				topic.publish('mapClickMode/setCurrent', 'simplebuffer');
				this.map.setInfoWindowOnClick(false);
			}
		},

		setMapClickMode: function(mode) {
			this.mapClickMode = mode;
			//this._showInfo('mapClickMode: '+this.mapClickMode,'info');
		},

		_initWidget: function() {

			// click event for clear buffers button.
			on(this.clearBuffers, "click", lang.hitch(this, function() {
				if (this.bufferLayer) {
					this.bufferLayer.clear();
					this._showInfo("Buffer Layer Cleared", 'success');
				}
			}));

			// click event to show MGRS input.
			on(this.mgrspoint, "click", lang.hitch(this, function() {
				var isActive = domClass.contains(this.mgrspoint, 'active');
				// deactivate all tools
				this._deactivateTools();
				if (!isActive) {
					// activate the target tool
					domClass.add(this.mgrspoint, "active");
					// open mgrs input
					domStyle.set(this.mgrsinput, "display", "block");
				}
			}));

			// click event to hide MGRS input.
			on(this.sbtClose, "click", lang.hitch(this, function() {
				this._resetMgrsInput();
			}));

			// click event to locate MGRS point.
			on(this.sbtGosubmit, "click", lang.hitch(this, function() {
				// check if point is already mapped
				if (this.mgrsLocation === null) {
					if (this.sbtMGRSValue.value) {
						// map the point
						var _location = this._parseMGRS(this.sbtMGRSValue.value);
						if (_location.success) {
							// hide input form
							domStyle.set(this.sbtMGRSValue, "display", "none");
							// show the point on the map
							this.map.centerAt(_location.point);
							var _lat = _location.point.getLatitude();
							var _lon = _location.point.getLongitude();
							this._mgrsLocate(_lat, _lon);
							// change button text to 'submit'
							this.sbtGosubmit.innerHTML = 'Buffer MGRS Point';
						} else {
							// the error is intercepted in the postCreate
							// function from usng's window.alert message
						}
					} else {
						this._showInfo('An MGRS location is required!', 'warning');
						this.mgrsLocation = null;
					}
				} else {
					// buffer the mapped point
					this._doBufferGeom(this.mgrsLocation);
					// close mgrs input
					domStyle.set(this.mgrsinput, "display", "none");
					// reset MGRS value
					this._getRegionMGRS();
					this._resetMgrsInput();
				}
			}));

			// click event to activate feature select tool.
			on(this.featureselect, "click", lang.hitch(this, function() {
				var isActive = domClass.contains(this.featureselect, 'active');
				// deactivate all tools
				this._deactivateTools();
				if (!isActive) {
					// activate the target tool
					domClass.add(this.featureselect, "active");
					// IF & WHEN Built... open select options...
					//domStyle.set(this.selectOptions, "display", "block");
					this.locatefeatureClickEvent = on(this.map, "click", lang.hitch(this, this._onMapClick));
					this.map.setMapCursor("crosshair");
				}
			}));

			this.helpTooltip = new TooltipDialog({
				id: this.baseClass + '_helpTooltip',
				style: 'width: 300px;',
				content: '',
				onBlur: lang.hitch(this, function() {
					popup.close(this.helpTooltip);
				})
			});

			on(this.questionIconNode, 'click', lang.hitch(this, '_showCoordHelp'));

			on(this.unit, 'focus', lang.hitch(this, function() {
				this.unit.blur();
			}));

			// set MGRS prifix
			this._getRegionMGRS();
			this.mgrsLocation = null;
		},

		_showInfo: function(msg, level) {
			topic.publish('growler/growl', {
				title: 'Notice:',
				message: msg,
				level: level,
				timeout: 5000,
				opacity: 1.0
			});
		},

		_showCoordHelp: function() {
			var helpString = '<p>The Military Grid Reference System (MGRS) input accepts a grid zone designator (4Q), grid square id (FJ), and an even number of additional precision numbers (12345678).<br/><strong>E.g.,</strong></p><ul>';
			helpString += '<li>18SUJ23480647</li></ul>';
			helpString += '<p>See <a href="http://en.wikipedia.org/wiki/Military_grid_reference_system" target="_blank">wikipedia entry</a> for additional info.</p>';
			this.helpTooltip.set('content', helpString);
			popup.open({
				popup: this.helpTooltip,
				around: this.questionIconNode
			});
			this.helpTooltip.focus();
		},

		_resetMgrsInput: function() {
			// close mgrs input
			domStyle.set(this.mgrsinput, "display", "none");
			// show input form
			domStyle.set(this.sbtMGRSValue, "display", "inline");
			// deactivate the target tool
			domClass.remove(this.mgrspoint, "active");
			// clear mapped location
			this.mapCoorPlacemarksLayer.clear();
			// change button text back to 'go'
			this.sbtGosubmit.innerHTML = 'go';
			// clear the value
			// set MGRS prifix
			this._getRegionMGRS();
			this.mgrsLocation = null;
		},

		_resetFeatureSelect: function() {
			// close options
			//domStyle.set(this.featureselectOptions, "display", "none");
			// deactivate the target tool
			domClass.remove(this.featureselect, "active");
			if (this.locatefeatureClickEvent) this.locatefeatureClickEvent.remove();
			this.map.setMapCursor("auto");
		},

		_getRegionMGRS: function() {
			var center = this.map.extent.getCenter();
			var mgrs = usng.LLtoUSNG(center.getLatitude(), center.getLongitude(), 5);
			this.sbtMGRSValue.value = mgrs.replace(/ /g, "").substring(0, 5); // Pre-populate with the region designator and 100,000 meter square values.
			this.mgrsLocation = null;
		},

		_parseMGRS: function(mgrsVal) {
			var location = new CoordinateLocation();
			// As helpful as the USNG plugin is, the mgrs value it creates in utm zones < 10 do not have the 0 prepended
			// which triggers an invalid MGRS later when we check since the USNG validator function checks that the first
			// 2 characters of the MGRS string are integers 0 - 9
			if (!mgrsVal[1].match("^[0-9]")) {
				mgrsVal = "0" + mgrsVal;
			}
			if (this._validateMGRS(mgrsVal) !== 0) {
				try {
					// However when converting an MGRS value to LatLong, it cannot have the leading 0 so we must remove it.
					if (mgrsVal[0] == "0") mgrsVal = mgrsVal.substring(1, mgrsVal.length);
					var latlong = [];
					usng.USNGtoLL(mgrsVal, latlong);
					if (!isNaN(latlong[0]) || !isNaN(latlong[1])) {
						location.point = new Point(parseFloat(latlong[1]), parseFloat(latlong[0]));
						location.success = true;
					} else {
						throw "Please enter a valid MGRS value.";
					}
				} catch (e) {
					location.success = false;
					location.message = e;
				}
			} else {
				location.success = false;
				location.message = "Please enter a valid MGRS value.";
			}
			return location;
		},

		_mgrsLocate: function(latitude, longitude) {
			if (this.mapCoorPlacemarksLayer) {
				this.mapCoorPlacemarksLayer.clear();
			}

			var ptGeo = new Point(longitude, latitude, new SpatialReference({
				wkid: '4326'
			}));
			this.sbtMGRSValue.value = usng.LLtoMGRS(latitude, longitude, 5);

			this.mgrsLocation = ptGeo;

			if (ptGeo !== null) {
				/*
				// normalize the initial geometry...
				this.normalizeGeometry(esriConfig.defaults.geometryService.url, ptGeo).then(function (geom) {
					if (geom.type == "point") {
						ptGeo = geom;
					}
				});
				*/

				var pt = webMercatorUtils.geographicToWebMercator(ptGeo);

				this.CrosshairSymbol = this.CrosshairSymbol || new PictureMarkerSymbol({
					url: this.rootFolder + this.mapIcons.crosshair.url,
					height: this.mapIcons.crosshair.height,
					width: this.mapIcons.crosshair.width
				});
				var location = new Point(pt.x, pt.y, new SpatialReference({
					wkid: this.map.spatialReference.wkid
				}));
				var coorGraphic = new Graphic(location, this.CrosshairSymbol);
				this.mapCoorPlacemarksLayer.add(coorGraphic);
				if (this.map.getLevel() < this.zoomScale) {
					this.map.centerAndZoom(pt, this.zoomScale);
				} else {
					this.map.centerAt(pt);
				}
			} else { // error converting point...
				this._showInfo('Unable to locate coordinates... Verify your coordinates were entered correctly.', 'warning');
				this.mgrsLocation = null;
			}
		},

		_validateMGRS: function(value) {
			var mgrs = usng.isUSNG(value);
			return mgrs !== 0; // The plugin returns 0 if it is invalid
		},

		_createToolbar: function() {
			//  activate drawing tools...
			this.tb = new Draw(this.map);
			this.tb.on("draw-complete", lang.hitch(this, function(evtObj) {
				this._doBufferGeom(evtObj.geometry);
			}));
			query(".tool", this.simpleBufferDijit).on("click", lang.hitch(this, "_activateTool"));
		},

		_activateTool: function(e) {
			var toolType = e.target.attributes["data-shapetype"].value;
			if (this.tb) {
				this.tb.activate(toolType);
			}
			// deactivate all tools
			this._deactivateTools();
			// activate the target tool
			domClass.add(e.target, "active");
		},

		_deactivateTools: function() {
			// remove active class from other buttons to "deactivate" them
			var tools = query(".tool", this.simpleBufferDijit);
			for (var i = 0, len = tools.length; i < len; i++) {
				domClass.remove(tools[i], "active");
			}
			// even the mgrs tool and featueselect tool
			this._resetMgrsInput();
			this._resetFeatureSelect();
		},

		_deactivateEditing: function(geometry) {
			this.tb.finishDrawing();
			this.tb.deactivate();
		},

		_doBufferGeom: function(geometry) {
			this.tb.finishDrawing();
			this.tb.deactivate();

			//this._showInfo("Buffering Markup",'info'); // just notify if there are issues
			//domStyle.set(query(".sbtStatus", this.simpleBufferDijit)[0], "display", "block");

			this.bufferLayer.setVisibility(true);

			// show/hide buffer layer in TOC
			//domClass.toggle(query(".markupLayerToggle .toc-checkbox")[0], 'checked', this.bufferLayer.visible);

			var symbol;
			switch (geometry.type) {
				case "point":
					symbol = this.MarkerSymbol;
					if (!symbol) {
						symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(this.bufferedGraphicLineColor), 2), new Color(this.bufferedGraphicFillColor));
						this.MarkerSymbol = symbol;
					}
					break;
				case "polyline":
					symbol = this.LineSymbol;
					if (!symbol) {
						symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color(this.bufferedGraphicLineColor), 1);
						this.LineSymbol = symbol;
					}
					break;
				case "polygon":
				default:
					symbol = this.PolygonSymbol;
					if (!symbol) {
						symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color(this.bufferedGraphicLineColor), 1), new Color(this.bufferedGraphicFillColor));
						this.PolygonSymbol = symbol;
					}
			}
			if (geometry.spatialReference.wkid == '4326') {
				// convert to web mercator...
				geometry = webMercatorUtils.geographicToWebMercator(geometry);
			}
			this.bufferLayer.add(new Graphic(geometry, symbol));

			// setup the buffer parameters
			var params = new BufferParameters();
			params.distances = [this.distance.value];
			params.outSpatialReference = this.map.spatialReference;
			params.unit = GeometryService[this.unit.value];
			params.geodesic = (typeof this.bufferGeodesic != 'undefined') ? this.bufferGeodesic : true;

			params.geometries = [geometry];

			if (geometry.type === "polygon") {
				// if geometry is a polygon then simplify polygon.  This will make the user drawn polygon topologically correct.
				this.simplifyGeometry(esriConfig.defaults.geometryService.url, [geometry], function(geometries) {
					params.geometries = geometries;
				});
			}
			this.bufferGeometry(esriConfig.defaults.geometryService.url, params, lang.hitch(this, "_bufferSuccess"), lang.hitch(this, "_bufferError"));
		},

		_bufferSuccess: function(bufferedGeometries) {
			this.FillSymbol = this.FillSymbol || new SimpleFillSymbol(
				SimpleFillSymbol.STYLE_SOLID,
				new SimpleLineSymbol(
					SimpleLineSymbol.STYLE_SOLID,
					new Color(this.bufferLineColor), 2
				),
				new Color(this.bufferFillColor)
			);

			for (var i = 0, len = bufferedGeometries.length; i < len; i++) {
				this.bufferLayer.add(new Graphic(bufferedGeometries[i], this.FillSymbol));
			}
			//this._showInfo("Buffering Markup",'success'); // no need to notify of success
			this.tb.finishDrawing();
			this.tb.deactivate();
		},

		_bufferError: function(err) {
			this._showInfo("ERROR Buffering Markup!", 'error');
			this.tb.finishDrawing();
			this.tb.deactivate();
		},
		bufferGeometry: function(serviceUrl, params, success, fail) {
			var geoService = new GeometryService(serviceUrl);
			return geoService.buffer(params, success, fail);
		},
		simplifyGeometry: function(serviceUrl, geom, callback) {
			var geoService = new GeometryService(serviceUrl);
			geoService.simplify(geom, callback);
		},
		normalizeGeometry: function(serviceUrl, geom) {
			var geoService = new GeometryService(serviceUrl);
			geom = (typeof geom == "object" && geom.length != null ? geom : [geom]);
			return normalizeUtils.normalizeCentralMeridian(geom, geoService,
				function(geometries) {
					return geometries[0];
				},
				function(err) {
					return err;
				}
			);
		},

		_onMapClick: function(evt) {
			var point = new Point(evt.mapPoint.x, evt.mapPoint.y, this.map.spatialReference);
			// find features at the point location...
			this._identifyFeatureForCordon(point);
		},

		_identifyFeatureForCordon: function(geom) {
			this.IdentifyFeaturesTask = this.IdentifyTask || new IdentifyTask(this.featureServiceURL);
			var identifyParams = this.IdentifyFeatureParams;
			if (!identifyParams) {
				identifyParams = new IdentifyParameters();
				identifyParams.tolerance = 3;
				identifyParams.returnGeometry = true;
				identifyParams.layerIds = this.featureServiceLayers;
				identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
				this.IdentifyFeatureParams = identifyParams;
			}
			identifyParams.width = this.map.width;
			identifyParams.height = this.map.height;
			identifyParams.mapExtent = this.map.extent;
			identifyParams.geometry = geom;
			this.IdentifyFeaturesTask.execute(identifyParams, lang.hitch(this, "_bufferFeatures"), lang.hitch(this, "_identifyTaskError"));
		},

		_bufferFeatures: function(results) {
			//console.log("Identify Results...");
			//console.dir(results);
			if (results.length >= 1) {
				if (results.length = 1) {
					// send geometry to be buffered...
					this._doBufferGeom(results[0].feature.geometry);
					//this._showInfo("<strong>" + results[0].feature.attributes['installationID'] + "</strong>", 'success');
				} else {
					this._showInfo("<strong>Multiple Features Found</strong><p>Try zooming in and clicking on a singe feature.</p>", 'error');
				}
			} else {
				this._showInfo("<strong>No Feature Found</strong><p>Unable to locate a feature at that location.</p>", 'error');
			}
		},

		_identifyTaskError: function(results) {
			this._showInfo('<strong>Identify Task Error!</strong><p>Unable to locate a feature at the location. See console for task results.</p>','error');
			console.dir(results);
		}

	});
});
