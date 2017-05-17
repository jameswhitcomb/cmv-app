define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',

	'dojo/on',
	'dojo/_base/lang',
	'dojo/aspect',
	'dojo/topic',
	'dojo/dom',
	'dojo/query',
	'dojo/dom-class',
	'dojo/dom-style',

	'esri/SpatialReference',
	'esri/geometry/Point',

	'esri/tasks/IdentifyTask',
	'esri/tasks/IdentifyParameters',

	'dojo/text!./FeatureStatus/templates/FeatureStatus.html',
	'xstyle/css!./FeatureStatus/css/FeatureStatus.css',

	'dojo/NodeList-traverse'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,

	on,
	lang,
	aspect,
	topic,
	dom,
	query,
	domClass,
	domStyle,

	SpatialReference,
	Point,

	IdentifyTask,
	IdentifyParameters,

	template
) {

	return declare([_WidgetBase, _TemplatedMixin], {
		baseClass: 'gis_FeatureStatusDijit',
		featureServiceURL: null,
		featureServiceLayers: null,
		demoMode: false,
		drillDownIdentify: true,
		displayTime: 30000,
		templateString: template,
		title: 'Feature Status Widget',
		draggable: true,
		mapClickMode: null,

		postCreate: function () {
			this.inherited(arguments);
			this.own(topic.subscribe('mapClickMode/currentSet', lang.hitch(this, 'setMapClickMode')));
			if (this.parentWidget && this.parentWidget.toggleable) {
				this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
					this.onLayoutChange(this.parentWidget.open);
				})));
			}
			// set required options...
			if (this.params.featureServiceURL) this.featureServiceURL = this.params.featureServiceURL;
				else console.log('ERROR Loading FeatureStatus Widget: The featureServiceURL option needs to be declared in widget configuration.');
			if (this.params.featureServiceLayers) this.featureServiceLayers = this.params.featureServiceLayers;
				else console.log('ERROR Loading FeatureStatus Widget: The featureServiceLayers option needs to be declared in widget configuration.');

			// set the layerIds to be searched...
			for(var i = 0, len = this.featureServiceLayers; i < len; i++){
				this.featureServiceLayerIds.push(this.featureServiceLayers[i].layerId);
			}

			this._initWidget();

			// if open at startup, disable other map click events and tools
			if(this.parentWidget.open) {
				// delayed to ensure the default tool is set before changing it...
				setTimeout(lang.hitch(this, function() {
					topic.publish('mapClickMode/setCurrent', 'featureStatus');
					this.map.setInfoWindowOnClick(false);
				}), 6000);
			}
		},

		onLayoutChange: function (open) {
			// end edit on close of title pane
			if (!open) {
				this._deactivateTools();
				//this._showInfo('Deactivating Buffer tool!','error');
				topic.publish('mapClickMode/setDefault');
				this.map.setInfoWindowOnClick(true);
				setTimeout(lang.hitch(this, function() {
					// re-set width of growler window after all pop-ups have been clearled...
					var statusDiv = query('#growler_widget').parent('div')[0];
					domStyle.set(statusDiv, 'width', '250px');
					domStyle.set(statusDiv, 'right', '18px');
				}), this.displayTime);
			} else {
				//this._showInfo('ACTIVATING Buffer tool!','success');
				topic.publish('mapClickMode/setCurrent', 'featureStatus');
				this.map.setInfoWindowOnClick(false);
			}
		},

		setMapClickMode: function (mode) {
			this.mapClickMode = mode;
		},

		_initWidget: function() {
			//click event to activate feature select tool.
			on(this.featureselect, 'click', lang.hitch(this, function() {
				var isActive = domClass.contains(this.featureselect, 'active');
				// deactivate all tools
				this._deactivateTools();
				if (!isActive) {
					// activate the target tool
					domClass.add(this.featureselect, 'active');
					this.locatefeatureClickEvent = on(this.map, 'click', lang.hitch(this, this._onMapClick));
					this.map.setMapCursor('crosshair');
				}
			}));
		},

		_showInfo: function(msg,level) {
			topic.publish('growler/growl', {
				title: 'Notice:',
				message: msg,
				level: level,
				timeout: 5000,
				opacity: 1.0
			});
		},

		_showFeatureStatus: function(featureName, statusLabels, statusValues) {
			var msg = '<table align="center"><tr>';
			// add table headers for status field...
			for(var i = 0, len = statusLabels.length; i < len; i++){
				msg += '<th>'+statusLabels[i]+'</th>';
			}
			msg += '</tr><tr>';
			// add values for status...
			for(var i = 0, len = statusValues.length; i < len; i++){
				msg += '<td class="'+statusValues[i]+'"></td>';
			}
			msg += '</tr><table>';
			topic.publish('growler/growl', {
				title: featureName,
				message: msg,
				level: 'info',
				timeout: this.displayTime,
				opacity: 1.0
			});
			// re-set width of growler window...
			var statusDiv = query('#growler_widget').parent('div')[0];
			domStyle.set(statusDiv, 'min-width', '250px');
			domStyle.set(statusDiv, 'max-width', '50%');
			domStyle.set(statusDiv, 'width', 'auto');
			domStyle.set(statusDiv, 'right', '18px');
		},

		_activateTool: function(e){
			domClass.add(e.target, 'active');
		},

		_deactivateTools: function(){
			// deactivate the target tool
			domClass.remove(this.featureselect, 'active');
			if (this.locatefeatureClickEvent) this.locatefeatureClickEvent.remove();
			this.map.setMapCursor('auto');
		},

		_onMapClick: function(evt) {
			var point = new Point(evt.mapPoint.x, evt.mapPoint.y, this.map.spatialReference);
			if (!this.demoMode) {
				// find features at the point location...
				this._identifyFeatures(point);
			} else {
				this._showFeatures([]);
			}
		},

		_identifyFeatures: function (geom) {
			this.IdentifyFeaturesTask = this.IdentifyTask || new IdentifyTask(this.featureServiceURL);
			var identifyParams = this.IdentifyFeatureParams;
			if(!identifyParams){
				identifyParams = new IdentifyParameters();
				identifyParams.tolerance = 3;
				identifyParams.returnGeometry = true;
				identifyParams.layerIds = this.featureServiceLayerIds;
				if (this.drillDownIdentify) {
					identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
				} else {
					identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_TOP;
				}
				this.IdentifyFeatureParams = identifyParams;
			}
			identifyParams.width = this.map.width;
			identifyParams.height = this.map.height;
			identifyParams.mapExtent = this.map.extent;
			identifyParams.geometry = geom;
			this.IdentifyFeaturesTask.execute(identifyParams, lang.hitch(this, '_showFeatures'), lang.hitch(this, '_identifyTaskError'));
		},

		_showFeatures: function (results) {
			var statusFieldLabels = [];
			var statusFieldValues = [];
			var resultAlias = '';
			var idFeature = null;
			var resultName = null;
			if (!this.demoMode) {
				if (results.length >= 1) {
					for(var r = 0, res = results.length; r < res; r++){
						// empty status arrays...
						statusFieldLabels = [];
						statusFieldValues = [];
						resultAlias = '';
						idFeature = results[r].feature;
						resultName = results[r].layerName;
						// determine the layer the result belongs to...
						for(var l = 0, lyrsLen = this.featureServiceLayers.length; l < lyrsLen; l++) {
							if (resultName == this.featureServiceLayers[l].layerName) {
								// if more than one layer configured, add layer info to each result...
								if (this.featureServiceLayers.length > 1) {
									resultAlias = ' ('+this.featureServiceLayers[l].layerAlias+')';
								}
								var statusFields = this.featureServiceLayers[l].statusFields;
								var labelFeature = idFeature.attributes[this.featureServiceLayers[l].idField];
								// fill in the label and field value arrays...
								for(var i = 0, len = statusFields.length; i < len; i++) {
									var cssName = '_'+idFeature.attributes[statusFields[i].name];
									statusFieldLabels.push(statusFields[i].label);
									statusFieldValues.push(cssName.replace(/[^a-zA-Z0-9-_]/gi, ''));
								}
								// send it all to a growler popup.
								this._showFeatureStatus(labelFeature + resultAlias, statusFieldLabels, statusFieldValues);
								// console.log(statusFieldValues.join(' | '))
							}
						}
					}
				} else {
					this._showInfo('<strong>No Feature Found</strong><p>Unable to locate a feature at the location.</p>','error');
				}
			} else {
				// Demo with fixed values...
				statusFieldLabels = ['Status A', 'Status B', 'Status C', 'Status D','Status Unknown'];
				statusFieldValues = ['BOMB', 'SAD', 'MEH', 'HAPPY','null'];
				this._showFeatureStatus('DemoMode Site #1', statusFieldLabels, statusFieldValues);
			}
		},

		_identifyTaskError: function(results) {
			this._showInfo('<strong>Identify Task Error!</strong><p>Unable to locate a feature at the location. See console for task results.</p>','error');
			console.dir(results);
		}

	});
});
