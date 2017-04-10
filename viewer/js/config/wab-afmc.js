define([
    'esri/units',
    'esri/geometry/Extent',
    'esri/config',
    'esri/urlUtils',
    'esri/tasks/GeometryService'
    // 'esri/layers/ImageParameters'
], function (esriUnits, Extent, esriConfig, urlUtils, GeometryService) {

    // url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
    esriConfig.defaults.io.proxyUrl = 'proxy/proxy.ashx';
    esriConfig.defaults.io.alwaysUseProxy = false;

    // add a proxy rule to force specific domain requests through proxy
    // be sure the domain is added in proxy.config
    /*
    urlUtils.addProxyRule({
        urlPrefix: 'sampleserver3.arcgisonline.com',
        proxyUrl: 'proxy/proxy.ashx'
    });
    */

    // url to your geometry server.
    esriConfig.defaults.geometryService = new GeometryService('https://ags103vm.whitcomb.dev/arcgis/rest/Utilities/Geometry/GeometryServer');

    // helper function returning ImageParameters for dynamic layers
    // example:
    /*
    imageParameters: buildImageParameters({
        layerIds: [0],
        layerOption: 'show'
    });
    function buildImageParameters (config) {
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
    */

    return {

        isDebug: true,

        mapOptions: {
            basemap: 'gray-vector',
            center: [-84.056921, 39.809530],
            zoom: 13,
            sliderStyle: 'small'
        },

        titles: {
            header: 'AFMC GeoBase',
            subHeader: 'CMV/WAB JavaScript Viewer',
            pageTitle: 'AFMC - CMV/WAB JavaScript Viewer',
            logoSource: './cmv/images/AFMC/AFMC.png',
            logoHref: '/',
            logoTitle: 'GeoBase Home'
        },

        panes: {
            left: {
                splitter: true,
                style: 'width:340px;'
            }
        },
        collapseButtonsPane: 'center', //center or outer

        operationalLayers: [
            {
                type: 'feature',
                url: 'https://ags103vm.whitcomb.dev/arcgis/rest/services/SampleTreesEdit/FeatureServer/0',
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
                    fieldInfos: [
                        {
                            fieldName: 'PLANTED',
                            label: 'Feature Name'
                        }
                    ]
                },
                legendLayerInfos: {
                    exclude: false,
                    layerInfo: {
                        title: 'Trees'
                    }
                }
            },
            {
                type: 'dynamic',
                url: 'https://ags103vm.whitcomb.dev/arcgis/rest/services/afmc_cip_dyn/MapServer',
                title: 'AFMC Common Installation Picture (CIP)',
                options: {
                    id: 'afmc_cip_dyn',
                    opacity: 1.0,
                    visible: true
                }
            }
        ],

        widgets: {
            /* *** OFF PANNEL WIDGETS *** */
            help: {
                include: true,
                id: 'help',
                type: 'floating',
                path: 'gis/dijit/Help',
                title: 'Help',
                options: {}
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
                        widgets: [
                            {
                                id: 'WABHome',
                                uri: 'wabwidgets/HomeButton/Widget'
                            }
                        ]
                    }
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

            /* *** PANNEL WIDGETS *** */
            layerList: {
                include: true,
                id: 'layerList',
                type: 'titlePane',
                position: 0,
                title: 'LayerList',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    style: 'min-height: 200px;',
                    config: {
                        widgets: [
                            {
                                id: 'WABLayerList',
                                uri: 'wabwidgets/LayerList/Widget'
                            }
                        ]
                    }
                }
            },
            identify: {
                include: true,
                id: 'identify',
                type: 'titlePane',
                path: 'gis/dijit/Identify',
                title: 'Identify',
                open: false,
                position: 1,
                options: 'config/identify'
            },
            bookmarks: {
                include: true,
                id: 'bookmark',
                type: 'titlePane',
                position: 0,
                title: 'Bookmarks',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    style: 'min-height: 200px;',
                    config: {
                        widgets: [
                            {
                                id: 'WABBookmarks',
                                uri: 'wabwidgets/Bookmark/Widget'
                            }
                        ]
                    }
                }
            },
            chart: {
                include: true,
                id: 'chart',
                type: 'titlePane',
                position: 1,
                title: 'Charts',
                open: false,
                canFloat: true,
                resizable: true,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    style: 'min-height: 400px;',
                    config: {
                        widgets: [
                            {
                                id: 'WABChart',
                                uri: 'wabwidgets/Chart/Widget',
                                version: '2.1',
                                config: {
                                    'charts': [
                                        {
                                            'url': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0',
                                            'filter': {
                                                'logicalOperator': 'AND',
                                                'parts': [],
                                                'expr': '1=1'
                                            },
                                            'name': 'Display values feature by feature',
                                            'description': '',
                                            'mode': 'feature',
                                            'symbol': {
                                                'color': [
                                                    0,
                                                    0,
                                                    128,
                                                    128
                                                ],
                                                'size': 18,
                                                'angle': 0,
                                                'xoffset': 0,
                                                'yoffset': 0,
                                                'type': 'esriSMS',
                                                'style': 'esriSMSCircle',
                                                'outline': {
                                                    'color': [
                                                        0,
                                                        0,
                                                        128,
                                                        255
                                                    ],
                                                    'width': 0.75,
                                                    'type': 'esriSLS',
                                                    'style': 'esriSLSSolid'
                                                }
                                            },
                                            'highLightColor': '#ff0000',
                                            'column': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'pie': {
                                                'colors': [
                                                    '#5d9cd3',
                                                    '#eb7b3a',
                                                    '#a5a5a5',
                                                    '#febf29',
                                                    '#4673c2',
                                                    '#72ad4c'
                                                ],
                                                'label': true
                                            },
                                            'bar': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'line': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'labelField': 'CITY_NAME',
                                            'valueFields': [
                                                'POP'
                                            ],
                                            'sortOrder': 'asc'
                                        },
                                        {
                                            'url': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0',
                                            'filter': {
                                                'logicalOperator': 'AND',
                                                'parts': [],
                                                'expr': '1=1'
                                            },
                                            'name': 'Display values by category',
                                            'description': '',
                                            'mode': 'category',
                                            'symbol': {
                                                'color': [
                                                    0,
                                                    0,
                                                    128,
                                                    128
                                                ],
                                                'size': 18,
                                                'angle': 0,
                                                'xoffset': 0,
                                                'yoffset': 0,
                                                'type': 'esriSMS',
                                                'style': 'esriSMSCircle',
                                                'outline': {
                                                    'color': [
                                                        0,
                                                        0,
                                                        128,
                                                        255
                                                    ],
                                                    'width': 0.75,
                                                    'type': 'esriSLS',
                                                    'style': 'esriSLSSolid'
                                                }
                                            },
                                            'highLightColor': '#ff0000',
                                            'column': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'pie': {
                                                'colors': [
                                                    '#5d9cd3',
                                                    '#eb7b3a',
                                                    '#a5a5a5',
                                                    '#febf29',
                                                    '#4673c2',
                                                    '#72ad4c'
                                                ],
                                                'label': true
                                            },
                                            'bar': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'line': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'categoryField': 'POP_RANK',
                                            'operation': 'sum',
                                            'valueFields': [
                                                'POP'
                                            ],
                                            'sortOrder': 'asc'
                                        },
                                        {
                                            'url': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0',
                                            'filter': {
                                                'logicalOperator': 'AND',
                                                'parts': [],
                                                'expr': '1=1'
                                            },
                                            'name': 'Display feature counts by category',
                                            'description': '',
                                            'mode': 'count',
                                            'symbol': {
                                                'color': [
                                                    0,
                                                    0,
                                                    128,
                                                    128
                                                ],
                                                'size': 18,
                                                'angle': 0,
                                                'xoffset': 0,
                                                'yoffset': 0,
                                                'type': 'esriSMS',
                                                'style': 'esriSMSCircle',
                                                'outline': {
                                                    'color': [
                                                        0,
                                                        0,
                                                        128,
                                                        255
                                                    ],
                                                    'width': 0.75,
                                                    'type': 'esriSLS',
                                                    'style': 'esriSLSSolid'
                                                }
                                            },
                                            'highLightColor': '#ff0000',
                                            'column': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'pie': {
                                                'colors': [
                                                    '#5d9cd3',
                                                    '#eb7b3a',
                                                    '#a5a5a5',
                                                    '#febf29',
                                                    '#4673c2',
                                                    '#72ad4c'
                                                ],
                                                'label': true
                                            },
                                            'bar': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'line': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'categoryField': 'POP_RANK',
                                            'sortOrder': 'asc'
                                        },
                                        {
                                            'url': 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0',
                                            'filter': {
                                                'logicalOperator': 'AND',
                                                'parts': [],
                                                'expr': '1=1'
                                            },
                                            'name': 'Display attribute values as charts',
                                            'description': '',
                                            'mode': 'field',
                                            'symbol': {
                                                'color': [0, 0, 128, 128],
                                                'size': 18,
                                                'angle': 0,
                                                'xoffset': 0,
                                                'yoffset': 0,
                                                'type': 'esriSMS',
                                                'style': 'esriSMSCircle',
                                                'outline': {
                                                    'color': [0, 0, 128, 255],
                                                    'width': 0.75,
                                                    'type': 'esriSLS',
                                                    'style': 'esriSLSSolid'
                                                }
                                            },
                                            'highLightColor': '#ff0000',
                                            'column': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'pie': {
                                                'colors': [
                                                    '#5d9cd3',
                                                    '#eb7b3a',
                                                    '#a5a5a5',
                                                    '#febf29',
                                                    '#4673c2',
                                                    '#72ad4c'
                                                ],
                                                'label': true
                                            },
                                            'bar': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'line': {
                                                'colors': [
                                                    '#5d9cd3'
                                                ],
                                                'horizontalAxis': true,
                                                'verticalAxis': true
                                            },
                                            'operation': 'sum',
                                            'valueFields': [
                                                'POP_RANK',
                                                'LABEL_FLAG'
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            },
            draw: {
                include: true,
                id: 'draw',
                type: 'titlePane',
                position: 3,
                title: 'Draw',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABDraw',
                                uri: 'wabwidgets/Draw/Widget'
                            }
                        ]
                    }
                }
            },
            legend: {
                include: true,
                id: 'legend',
                type: 'titlePane',
                position: 5,
                title: 'Legend',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABLegend',
                                uri: 'wabwidgets/Legend/Widget',
                                config: {
                                    legend: {
                                        arrangement: 0,
                                        autoUpdate: true,
                                        respectCurrentMapScale: true
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            measurement: {
                include: true,
                id: 'measurement',
                type: 'titlePane',
                position: 6,
                title: 'Measurement',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABMeasurement',
                                uri: 'wabwidgets/Measurement/Widget',
                                config: {
                                    measurement: {
                                        defaultLengthUnit: esriUnits.FEET,
                                        defaultAreaUnit: esriUnits.ACRES
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            print: {
                include: true,
                id: 'print',
                type: 'titlePane',
                position: 7,
                title: 'Print',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABPrint',
                                uri: 'wabwidgets/Print/Widget',
                                config: {
                                    serviceURL: '//utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
                                    defaultTitle: 'ArcGIS WebMap',
                                    defaultAuthor: '',
                                    defaultCopyright: '',
                                    defaultFormat: 'PDF',
                                    defaultLayout: 'Letter ANSI A Landscape'
                                }
                            }
                        ]
                    }
                }
            },
            query: {
                include: true,
                id: 'query',
                type: 'titlePane',
                position: 8,
                title: 'Query',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABQuery',
                                uri: 'wabwidgets/Query/Widget',
                                config: {
                                    queries: [
                                        {
                                            name: 'Cities',
                                            url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0',
                                            filter: {
                                                logicalOperator: 'AND',
                                                parts: [
                                                    {
                                                        fieldObj: {
                                                            name: 'POP_RANK',
                                                            label: 'POP_RANK',
                                                            shortType: 'number',
                                                            type: 'esriFieldTypeInteger'
                                                        },
                                                        operator: 'numberOperatorIs',
                                                        valueObj: {
                                                            isValid: true,
                                                            type: 'value',
                                                            value: 3
                                                        },
                                                        interactiveObj: '',
                                                        caseSensitive: false,
                                                        expr: 'POP_RANK = 3'
                                                    }
                                                ],
                                                expr: 'POP_RANK = 3'
                                            },
                                            popup: {
                                                title: '${CITY_NAME}',
                                                fields: [
                                                    {
                                                        name: 'CITY_NAME',
                                                        alias: 'CITY_NAME',
                                                        specialType: 'none'
                                                    }
                                                ]
                                            },
                                            resultsSymbol: {
                                                color: [
                                                    0,
                                                    0,
                                                    128,
                                                    128
                                                ],
                                                size: 18,
                                                angle: 0,
                                                xoffset: 0,
                                                yoffset: 0,
                                                type: 'esriSMS',
                                                style: 'esriSMSCircle',
                                                outline: {
                                                    color: [
                                                        0,
                                                        0,
                                                        128,
                                                        255
                                                    ],
                                                    width: 0.75,
                                                    type: 'esriSLS',
                                                    style: 'esriSLSSolid'
                                                }
                                            },
                                            objectIdField: 'OBJECTID',
                                            orderByFields: []
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
            

            /*
            coordinates: {
                include: true,
                id: 'coordinates',
                type: 'domNode',
                srcNodeRef: 'mapInfoDijit',
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABCoordinate',
                                uri: 'wabwidgets/Coordinate/Widget'
                            }
                        ]
                    }
                }
            },
            */

            /*
            directions: {
                include: true,
                id: 'direction',
                type: 'titlePane',
                position: 2,
                title: 'Directions',
                open: false,
                path: 'jimu/BaseWidgetPanel',
                options: {
                    widgetManager: true,
                    config: {
                        widgets: [
                            {
                                id: 'WABdirections',
                                uri: 'wabwidgets/Directions/Widget',
                                config: {
                                    routeTaskUrl: 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route',
                                    routeParams: {
                                        directionsLanguage: 'en-US',
                                        directionsLengthUnits: esriUnits.MILES
                                    },
                                    geocoderOptions: {
                                        geocoders: [
                                            {
                                                url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            */
        }
    };
});