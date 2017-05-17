(function () {
    var path = location.pathname.replace(/[^\/]+$/, '');
    window.dojoConfig = {
		locale: 'en-us',
        async: true,
        packages: [
            {
                name: 'viewer',
                location: path + 'js/viewer'
            }, {
                name: 'gis',
                location: path + 'js/gis'
            }, {
                name: 'config',
                location: path + 'js/config'
            }, {
            	name: 'widgets',
            	location: path + 'js/gis/widgets'
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
			    name: 'jimu',
			    location: path + 'js/gis/wab/2.3/jimu.js'
			}, {
			    name: 'libs',
			    location: path + 'js/gis/wab/2.3/libs'
			}, {
			    name: 'wabwidgets',
			    location: path + 'js/gis/wab/2.3/widgets'
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

	    'viewer/_WABMixin' // cusom mix-in to use WAB widgets

    ], function (
        declare,

        _ControllerBase,
        _ConfigMixin,
        _LayoutMixin,
        _MapMixin,
        _WidgetsMixin,

	    _WABMixin

    ) {
        var App = declare([
	        _LayoutMixin,
	        _WidgetsMixin,
	        _MapMixin,
	        _WABMixin,
	        _ConfigMixin,
	        _ControllerBase
        ]);
        var app = new App();
        app.startup();
    });
})();
