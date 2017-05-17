define([
    'esri/dijit/Basemap',
    'esri/dijit/BasemapLayer',
    'esri/layers/osm'
], function (Basemap, BasemapLayer, osm) {

    return {
        map: true, // needs a reference to the map
        mode: 'agol', // mut be either 'agol' or 'custom'
        title: 'Basemaps', // title for widget

        /* optional starting basemap
        / otherwise uses the basemap from the map
        / must match one of the keys in basemaps object below
        */
        mapStartBasemap: 'topo',

        /* optional array of  basemaps to show in menu.
        / otherwise uses keys in basemaps object below
        / values in array must match keys in basemaps object
        */
        basemapsToShow: ['streets', 'satellite', 'hybrid', 'topo', 'gray', 'national-geographic', 'osm'],

        // define all valid basemaps here.
        basemaps: { // agol basemaps
            streets: {
                title: 'Streets'
            },
            satellite: {
                title: 'Satellite'
            },
            hybrid: {
                title: 'Hybrid'
            },
            topo: {
                title: 'Topo'
            },
            gray: {
                title: 'Gray'
            },
            'usatopomaps': {
                title: 'USA Topo Maps'
            },
            'national-geographic': {
                title: 'Nat Geo'
            },
            osm: {
                title: 'Open Street Map'
            }
        }
    }
});
