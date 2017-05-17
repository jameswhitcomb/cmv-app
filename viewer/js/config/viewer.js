define([
	'esri/units',
	'esri/geometry/Extent',
	'esri/config',
	'esri/urlUtils',
	'esri/tasks/GeometryService',
	'esri/layers/ImageParameters'
], function(units, Extent, esriConfig, urlUtils, GeometryService, ImageParameters) {

	// url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
	esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
	esriConfig.defaults.io.alwaysUseProxy = false;

	// add a proxy rule to force specific domain requests through proxy
	// be sure the domain is added in proxy.config
	/*urlUtils.addProxyRule({
		urlPrefix: 'www.example.com',
		proxyUrl: 'proxy/proxy.ashx'
	});*/

	// url to your geometry server.
	esriConfig.defaults.geometryService = new GeometryService('https://geobase-dev.local/arcgis/rest/Utilities/Geometry/GeometryServer');

	// helper function returning ImageParameters for dynamic layers
	// example:
	// imageParameters: buildImageParameters({
	//     layerIds: [0],
	//     layerOption: 'show'
	// })
	function buildImageParameters(config) {
		config = config || {};
		var ip = new ImageParameters();
		//image parameters for dynamic services, set to png32 for higher quality exports
		ip.format = 'png32';
		for (var key in config) {
			if (config.hasOwnProperty(key)) {
				ip[key] = config[key];
			}
		}
		return ip;
	}

	return {
		//if no hit-counter service url, leave blank
		hitCounterUrl: '',
		hitCounterData: {
			Url: "/js_configurable_viewer/index.html"
		},

		// used for debugging your app
		isDebug: true,

		//default mapClick mode, mapClickMode lets widgets know what mode the map is in to avoid multipult map click actions from taking place (ie identify while drawing).
		defaultMapClickMode: 'identify',
		// map options, passed to map constructor. see: https://developers.arcgis.com/javascript/jsapi/map-amd.html#map1
		mapOptions: {
			basemap: 'topo',
			center: [-84.056921, 39.809530],
			zoom: 13,
		},
		panes: {
			left: {
				splitter: true,
				collapsible: true,
				open: true // 'none' // for closed
			},
			bottom: {
				id: 'sidebarBottom',
				placeAt: 'outer',
				splitter: true,
				collapsible: true,
				region: 'bottom',
				open: 'none', // using false doesn't work
				style: 'height:200px;',
				content: '<div id="attributesContainer"></div>'
			}
		},
		// collapseButtonsPane: 'center', //center or outer

		titles: {
			header: 'AFMC GeoBase',
			subHeader: 'CMV/WAB JavaScript Viewer',
			pageTitle: 'AFMC - GeoBase Viewer',
			logoSource: './images/geobase/AFMC/afmc.png',
			logoHref: '/',
			logoTitle: 'GeoBase Home'
		},

		operationalLayers: [
			{
				type: 'dynamic',
				url: 'https://geobase-dev.local/arcgis/rest/services/afmc_cip_dyn/MapServer',
				title: 'AFMC Common Installation Picture (CIP)',
				options: {
					id: 'afmc_cip_dyn',
					opacity: 1.0,
					visible: true
				}
			}//,
			/* {
				type: 'feature',
				url: 'https://geobase-dev.local/arcgis/rest/services/SampleTreesEdit/FeatureServer/0',
				title: 'WPAFB Trees',
				options: {
					id: 'Trees_WPAFB',
					opacity: 1.0,
					visible: true,
					outFields: ['*'],
					mode: 0
				},
				editorLayerInfos: {
					disableGeometryUpdate: false,
					fieldInfos: [{
						fieldName: 'PLANTED',
						label: 'Feature Name'
					}]
				},
				legendLayerInfos: {
					exclude: false,
					layerInfo: {
						title: 'Trees'
					}
				}
			}*/
		],


		// set include:true to load. For titlePane type set position the the desired order in the sidebar
		widgets: {

			/* ----- OFF PANNEL WIDGETS ----- */

			growler: {
				include: true,
				id: 'growler',
				type: 'domNode',
				path: 'gis/dijit/Growler',
				srcNodeRef: 'growlerDijit',
				options: {
					/* title: 'Startup Message...',
					message: 'Lorem ipsum dolor sit amet, no eum impetus aliquando, mei ea veri congue corpora. Minimum facilisi dignissim ex eum, elitr delenit et usu, et pertinax mediocrem mea. Vel nostrum electram in, munere moderatius vis ea. Propriae sensibus nam ex. Nisl munere alterum te per, ius ex posse sadipscing.',
					level: 'info', //possible classes are default, warning, success, error, info
					timeout: 100000, //seconds x 1000, or -1 for visible until clicked/closed
					opacity: 1.0 */
				}
			},
			basemaps: {
				include: true,
				id: 'basemaps',
				type: 'domNode',
				path: 'gis/dijit/Basemaps',
				srcNodeRef: 'basemapsDijit',
				options: 'config/basemaps'
			},
			scalebar: {
				include: true,
				id: 'scalebar',
				type: 'map',
				path: 'esri/dijit/Scalebar',
				options: {
					map: true,
					attachTo: 'bottom-left',
					scalebarStyle: 'line',
					scalebarUnit: 'dual'
				}
			},
			mapButtons: {
				include: true,
				id: 'mapButtons',
				type: 'domNode',
				srcNodeRef: 'homeButton',
				path: 'jimu/BaseWidgetPanel',
				options: {
					widgetManager: true,
					config: {
						// a BaseWidgetPanel can have multiple widgets
						widgets: [{
								id: 'WABHome',
								uri: 'wabwidgets/HomeButton/Widget'
							}/*,
							{
								id: 'WABMyLocation',
								uri: 'wabwidgets/MyLocation/Widget'
							}*/
						]
					}
				}
			},
			overviewMap: {
				include: true,
				id: 'overviewMap',
				type: 'map',
				path: 'esri/dijit/OverviewMap',
				options: {
					map: true,
					attachTo: 'bottom-right',
					color: '#006699',
					height: 100,
					width: 125,
					opacity: 0.25,
					visible: false
				}
			},
			help: {
				include: true,
				id: 'help',
				type: 'floating',
				path: 'gis/dijit/Help',
				title: 'Help',
				options: {}
			},
			coordinates: {
				include: true,
				id: 'coordinates',
				type: 'domNode',
				srcNodeRef: 'mapInfoDijit',
				path: 'jimu/BaseWidgetPanel',
				options: {
					widgetManager: true,
					config: {
						widgets: [{
							id: 'WABCoordinate',
							uri: 'wabwidgets/Coordinate/Widget',
						}]
					}
				}
			},
			attributesTable: {
				include: true,
				id: 'attributesContainer',
				type: 'domNode',
				srcNodeRef: 'attributesContainer',
				path: 'gis/widgets/AttributesTable',
				options: {
					map: true,
					mapClickMode: true,
					// use a tab container for multiple tables or
					// show only a single table
					useTabs: true,
					// used to open the sidebar after a query has completed
					sidebarID: 'sidebarBottom'
				}
			},
			exportDialog: {
				include: true,
				id: 'export',
				type: 'floating',
				path: 'gis/widgets/Export',
				title: 'Export',
				options: {}
			},


			/* ----- PANNEL WIDGETS ----- */

			layerControl: {
				include: true,
				id: 'layerControl',
				type: 'titlePane',
				path: 'gis/dijit/LayerControl',
				title: 'Layers',
				open: false,
				position: 5,
				options: {
					map: true,
					layerControlLayerInfos: true,
					separated: true,
					vectorReorder: true,
					overlayReorder: true
				}
			},
			legend: {
				include: true,
				id: 'legend',
				type: 'titlePane',
				path: 'esri/dijit/Legend',
				title: 'Legend',
				open: false,
				position: 10,
				options: {
					map: true,
					legendLayerInfos: true
				}
			},
			identify: {
				include: true,
				id: 'identify',
				type: 'titlePane',
				path: 'gis/dijit/Identify',
				title: 'Identify',
				open: false,
				position: 20,
				options: 'config/identify'
			},
			CoordinateFind: {
				include: true,
				id: 'coordinateFind',
				type: 'titlePane',
				position: 30,
				canFloat: false,
				path: 'gis/widgets/CoordinateFind',
				title: '<i class="fa fa-location-arrow"></i>&nbsp;&nbsp;Find Coordinate',
				options: {
					map: true,
					zoomScale: 14
				}
			},
			bookmarks: {
				include: true,
				id: 'bookmarks',
				type: 'titlePane',
				canFloat: true,
				path: 'gis/dijit/Bookmarks',
				title: 'Bookmarks',
				open: false,
				position: 50,
				options: 'config/bookmarks'
			},
			search: {
				include: true,
				id: 'search',
				type: 'titlePane',
				path: 'gis/widgets/Search',
				canFloat: true,
				title: 'Search',
				open: false,
				position: 60,
				options: 'config/search'
			},
			draw: {
				include: true,
				id: 'draw',
				type: 'titlePane',
				canFloat: true,
				position: 70,
				title: 'Draw',
				open: false,
				path: 'jimu/BaseWidgetPanel', // Note the path
				options: {
					// use the WAB WidgetManager (required)
					widgetManager: true,
					config: {
						widgets: [
							// minimum configuration for the WAB Widget
							{
								id: 'WABDraw',
								uri: 'wabwidgets/Draw/Widget' // Note the path
							}
						]
					}
				}
			},
			/* featureStatus: {
				include: true,
				id: 'featureStatus',
				type: 'titlePane',
				path: 'gis/widgets/FeatureStatus',
				canFloat: true,
				title: 'Feature Status',
				open: false,
				position: 74,
				options: {
					map: true,
					demoMode: true,
					drillDownIdentify: true,
					displayTime: 30000,
					featureServiceURL: 'https://geobase-dev.local/arcgis/rest/services/afmc_cip_dyn/MapServer',
					featureServiceLayers: [{
						layerId: 1,
						layerName: 'BuildingArea',
						layerAlias: 'Building',
						idField: 'buildingNumber',
						statusFields: [{
							name: 'buildingStatus',
							label: 'Status'
						}]
					}, {
						layerId: 15,
						layerName: 'InstallationBoundaryArea',
						layerAlias: 'Installation',
						idField: 'sdsFeatureName',
						statusFields: [{
							name: 'siteID',
							label: 'Site ID'
						}, {
							name: 'wacInnrCode',
							label: 'WAC Code'
						}]

					}]
				}
			},*/
			simpleBuffer: {
				include: true,
				id: 'simpleBuffer',
				type: 'titlePane',
				path: 'gis/widgets/SimpleBuffer',
				canFloat: true,
				title: 'Draw Buffer',
				open: false,
				position: 75,
				options: {
					map: true,
					featureServiceURL: 'https://geobase-dev.local/arcgis/rest/services/afmc_cip_dyn/MapServer',
					featureServiceLayers: [0,1],
					bufferedGraphicFillColor: [0, 0, 255, 0.15],
					bufferedGraphicLineColor: [0, 0, 255, 0.5],
					bufferFillColor: [0, 255, 0, 0.25],
					bufferLineColor: [0, 255, 0, 0.5],
					bufferedGeodesic: true
				}
			},
			measure: {
				include: true,
				id: 'measurement',
				type: 'titlePane',
				canFloat: true,
				path: 'gis/widgets/Measurement',
				title: 'Measurement',
				open: false,
				position: 80,
				options: {
					map: true,
					mapClickMode: true,
					defaultAreaUnit: units.SQUARE_MILES,
					defaultLengthUnit: units.MILES
				}
			},
			print: {
				include: true,
				id: 'print',
				type: 'titlePane',
				canFloat: true,
				path: 'gis/dijit/Print',
				title: 'Print',
				open: false,
				position: 90,
				options: {
					map: true,
					printTaskURL: 'https://geobase-dev.local/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
					copyrightText: 'Copyright',
					authorText: 'GeoBase',
					defaultTitle: 'GeoBase Web Mapping',
					defaultFormat: 'PDF',
					defaultLayout: 'Letter ANSI A Landscape'
				}
			},
			/* editor: {
				include: true,
				id: 'editor',
				type: 'titlePane',
				path: 'gis/dijit/Editor',
				title: 'Editor',
				open: false,
				canFloat: true,
				position: 110,
				options: {
					map: true,
					mapClickMode: true,
					editorLayerInfos: true,
					settings: {
						toolbarVisible: true,
						showAttributesOnClick: true,
						enableUndoRedo: true,
						createOptions: {
							polygonDrawTools: ['freehandpolygon', 'autocomplete']
						},
						toolbarOptions: {
							reshapeVisible: true,
							cutVisible: true,
							mergeVisible: true
						}
					}
				}
			},*/
			alohaThreat: {
				include: true,
				id: 'alohaThreat',
				type: 'titlePane',
				position: 130,
				title: 'Aloha Threat Zone',
				canFloat: true,
				resizable: true,
				open: false,
				path: 'jimu/BaseWidgetPanel',
				options: {
					widgetManager: true,
					style: 'height:400px;',
					config: {
						widgets: [{
							id: 'WABWidget',
							uri: 'widgets/AlohaThreatZone/Widget'
						}]
					}
				}
			},
			nexrad: {
				include: true,
				id: 'nexrad',
				type: 'titlePane',
				canFloat: true,
				position: 140,
				path: 'gis/widgets/Nexrad',
				title: 'Nexrad',
				options: {
					map: true
				}
			}
		}
	};
});
