/*eslint no-alert: 0*/
define([
	'dojo/on',
	'dojo/_base/lang',
	'dojo/date/locale',
	'esri/tasks/GeometryService'
], function(on, lang, locale, GeometryService) {

	function formatDateTime(value) {
		if (value instanceof Date) {
			return locale.format(value, {
				formatLength: 'short'
			});
		}
		return '';
	}

	function formatDate(value) {
		if (value instanceof Date) {
			return locale.format(value, {
				selector: 'date',
				formatLength: 'medium'
			});
		}
		return '';
	}

	function getDateTime(value) {
		if (isNaN(value) || value === 0 || value === null) {
			return null;
		}
		return new Date(value);
	}

	return {
		map: true,
		mapClickMode: true,
		
		/*
		    Define search layers and options
		*/
		layers: [{
			name: 'Find a Building',
			expression: '', // additional where expression applied to all queries
			queryParameters: {
				type: 'spatial', // spatial, relationship, table or database
				layerID: 'afmc_cip_dyn', // from operational layers
				sublayerID: 1,
				outFields: ['INSTALLATIONID','BUILDINGNUMBER','SDSFEATURENAME','BUILDINGSTATUS']
			},
			attributeSearches: [{
				searchFields: [
					{
						name: 'BUILDINGNUMBER',
						label: 'Building ID',
						placeholder: '1',
						required: true,
						minChars: 1
					},
	                {
	                    name: 'INSTALLATIONID',
	                    label: 'Installation',
	                    expression: '(INSTALLATIONID = \'[value]\')',
	                    values: ['*', 'ANZY', 'FSPM', 'FTFA', 'KRSM', 'MXRD', 'UHHZ', 'WWYK', 'ZHTV'],
						valueLabels: ['All AFMC Bases', 'Arnold AFB', 'Edwards AFB', 'Elgin AFB', 'Hill AFB', 'Hanscom AFB', 'Robins AFB', 'Tinker AFB', 'Wrigt-Patterson AFB']
	                },
					{
	                    name: 'SITEID',
	                    label: 'Site ID',
	                    expression: '(SITEID = \'[value]\')',
	                    values: ['*', 'ZHTV0001', 'ZHTV0002'],
	                    valueLabels: ['All AFMC Sites', 'Wrigt-Patterson AFB', 'Wrigt-Patterson AFB (Area 2)']
	                }
				],

				title: 'Building', //Tab title in attributes window
				topicID: 'findBuilding',
				gridOptions: {
					columns: [{
						field: 'INSTALLATIONID',
						label: 'Installation ID'
					}, {
						field: 'BUILDINGNUMBER',
						label: 'Building ID'
					}, {
						field: 'SDSFEATURENAME',
						label: 'Structure Name'
					}, {
						field: 'BUILDINGSTATUS',
						label: 'Status'
					}],
					sort: [{
						attribute: 'BUILDINGNUMBER',
						descending: false
					}]
				}
			}]
		}],

		/*
		   Show button to open the Query Builder widget
		   This new widget not yet been released
		*/
		enableQueryBuilder: false, // JW - not working when enabled

		/*
		    continue adding multiple shapes before searching
		*/
		enableDrawMultipleShapes: true,

		/*
		    add the results of a search to the existing results from a previous search
		*/
		enableAddToExistingResults: true,

		/*
		    use spatial filters in searches by attribute
		*/
		enableSpatialFilters: true,

		/*
		    control which spatial filters are available
		*/
		spatialFilters: {
			entireMap: true,
			currentExtent: true,
			identifiedFeature: true,
			searchFeatures: true,
			searchSelected: true,
			searchSource: true,
			searchBuffer: true
		},

		/*
		    Control which drawing tools are available to the user
		*/
		drawingOptions: {
			rectangle: true,
			circle: true,
			point: true,
			polyline: true,
			freehandPolyline: true,
			polygon: true,
			freehandPolygon: true,
			stopDrawing: true,
			identifiedFeature: true,
			selectedFeatures: true,

			// change the symbology for drawn shapes and buffer around them
			symbols: {}
		},

		/*
		    Override the options used for searching from the URL query string.
		*/
		queryStringOptions: {
			// what parameter is used to pass the layer index
			layerParameter: 'layer',

			// what parameter is used to pass the attribute search index
			searchParameter: 'search',

			// what parameter is used to pass the values to be searched
			valueParameter: 'values',

			// if passing multiple values, how are they delimited
			valueDelimiter: '|',

			// Should the widget open when the search is executed?
			openWidget: true
		},

		/*
		    Symbology for drawn shapes
		*/
		symbols: {
			point: {
				type: 'esriSMS',
				style: 'esriSMSCircle',
				size: 6,
				color: [0, 0, 0, 64],
				angle: 0,
				xoffset: 0,
				yoffset: 0,
				outline: {
					type: 'esriSLS',
					style: 'esriSLSSolid',
					color: [255, 0, 0],
					width: 2
				}
			},
			polyline: {
				type: 'esriSLS',
				style: 'esriSLSSolid',
				color: [255, 0, 0],
				width: 2
			},
			polygon: {
				type: 'esriSFS',
				style: 'esriSFSSolid',
				color: [0, 0, 0, 64],
				outline: {
					type: 'esriSLS',
					style: 'esriSLSSolid',
					color: [255, 0, 0],
					width: 1
				}
			},

			// symbology for buffer around shapes
			buffer: {
				type: 'esriSFS',
				style: 'esriSFSSolid',
				color: [255, 0, 0, 32],
				outline: {
					type: 'esriSLS',
					style: 'esriSLSDash',
					color: [255, 0, 0, 255],
					width: 1
				}
			}
		},

		/*
		    Override the units available for the buffer tool.
		*/
		bufferUnits: [{
			value: GeometryService.UNIT_FOOT,
			label: 'Feet',
			selected: true
		}, {
			value: GeometryService.UNIT_STATUTE_MILE,
			label: 'Miles'
		}, {
			value: GeometryService.UNIT_METER,
			label: 'Meters'
		}, {
			value: GeometryService.UNIT_KILOMETER,
			label: 'Kilometers'
		}, {
			value: GeometryService.UNIT_NAUTICAL_MILE,
			label: 'Nautical Miles'
		}, {
			value: GeometryService.UNIT_US_NAUTICAL_MILE,
			label: 'US Nautical Miles'
		}]
	};
});
