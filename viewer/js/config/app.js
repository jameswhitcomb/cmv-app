(function () {
    var path = location.pathname.replace(/[^\/]+$/, '');
    window.dojoConfig = {
        async: true,
        packages: [
            {
                name: 'viewer',
                location: path + 'js/viewer'
            }, {
                name: 'gis',
                location: path + 'js/gis'
            }, {
                name: 'proj4js',
                location: path + 'js/libs/proj4js-2.3.15'
            }, {
                name: 'flag-icon-css',
                location: path + 'js/libs/flag-icon-css-2.8.0'
            }, {
		        name: 'put-selector',
		        main: 'put',
		        location: path + 'js/libs/put-selector-0.3.6'
		    }, {
		        name: 'xstyle',
		        main: 'css',
		        location: path + 'js/libs/xstyle-0.3.2'
		    }, {
	            name: 'widgets',
	            location: path + 'js/gis/widgets'
	        }, {
	            name: 'jimu',
	            location: path + 'js/gis/wab/2.3/jimu.js'
	        }, {
	            name: 'libs',
	            location: path + 'js/gis/wab/2.3/libs'
	        }, {
	            name: 'wabwidgets',
	            location: path + 'js/gis/wab/2.3/widgets'
	        }, {
                name: 'config',
                location: path + 'js/config'
            }
        ]
    };

    require(window.dojoConfig, [
        'dojo/_base/declare',

        // minimal Base Controller
        'viewer/_ControllerBase',

        // *** Controller Mixins
        // Use the core mixins, add custom mixins
        // or replace core mixins with your own
        'viewer/_ConfigMixin', // manage the Configuration
        'viewer/_LayoutMixin', // build and manage the Page Layout and User Interface
        'viewer/_MapMixin', // build and manage the Map
        'viewer/_WidgetsMixin', // build and manage the Widgets

        // 'viewer/_WebMapMixin' // for WebMaps
        //'config/_customMixin',

        'viewer/_WABMixin' // cusom mix-in to use WAB widgets

    ], function (
        declare,

        _ControllerBase,
        _ConfigMixin,
        _LayoutMixin,
        _MapMixin,
        _WidgetsMixin,

        _WebMapMixin
        //_MyCustomMixin

    ) {
        var controller = new (declare([
            _LayoutMixin,
            _MapMixin,
            _WidgetsMixin,

            _WebMapMixin,
            _ConfigMixin,
            _ControllerBase
        ]))();
        controller.startup();
    });
})();
