/*eslint no-console: 0, no-alert: 0*/
define([
    'dojo/i18n!./nls/main'
], function (i18n) {

    return {
    	map: true,
        queries: [
            {
                description: 'Buildings',
                url: 'https://geobase-dev.local/arcgis/rest/services/afmc_cip_dyn/MapServer',
                layerIds: [ 1 ],
                searchFields: [ 'BUILDINGNUMBER', 'SDSFEATURENAME' ],
                minChars: 2,
                prompt: 'Bldg# or name',
                gridColumns: [
                    { field: 'BUILDINGNUMBER', label: 'Building No.', resizable: false, width: 75, visible: true },
                    { field: 'SDSFEATURENAME', label: 'Name', visible: true, get: function ( result ) {
                        var name = result.feature.attributes.SDSFEATURENAME;
                        if ( result.feature.attributes.BUILDINGSTATUS !== 'EXISTING' ) {
                            name += ' ( ' + result.feature.attributes.BUILDINGSTATUS + ' )';
                        }
                        return name;
                    } }
                ],
                sort: [
                    {
                        attribute: 'BUILDINGNUMBER',
                        descending: false
                    }
                ]
            }
			/*
			,
            {
                description: 'Building Entrances',
                url: 'https://localhost/arcgis/rest/services/BuildingEntrances/MapServer',
                layerIds: [ 0 ],
                searchFields: [ 'BUILDING_DOOR_SEARCH' ],
                minChars: 2,
                prompt: 'Bldg# Door#',
                gridColumns: [
                    { field: 'EQUIPMENT', label: 'Equipment No', resizable: false, width: 75 },
                    { field: 'BUILDING', label: 'Building', resizable: false, width: 75 },
                    { field: 'FLOOR', label: 'Floor', resizable: false, width: 50 },
                    { field: 'ASSET_NO', label: 'Door No', resizable: false, width: 50 },
                    { field: 'SORT_VAL', visible: false, get: function ( item ) {
                        return String( '0000' + item.feature.attributes.ASSET_NO ).slice( -4 );
                    } }
                ],
                sort: [
                    {
                        attribute: 'SORT_VAL',
                        descending: false
                    }
                ],
                customGridEventHandlers: [
                    {
                        event: 'dgrid-select',
                        handler: function ( event ) {
                            var result = event.rows;
                            console.log( result );
                        }
                    }
                ],
                selectionMode: 'single'
            }
			*/
        ],
        selectionSymbols: {
            polygon: {
                type: 'esriSFS',
                style: 'esriSFSSolid',
                color: [ 255, 0, 0, 62 ],
                outline: {
                    type: 'esriSLS',
                    style: 'esriSLSSolid',
                    color: [ 255, 0, 0, 255 ],
                    width: 3
                }
            },
            point: {
                type: 'esriSMS',
                style: 'esriSMSCircle',
                size: 25,
                color: [ 255, 0, 0, 62 ],
                angle: 0,
                xoffset: 0,
                yoffset: 0,
                outline: {
                    type: 'esriSLS',
                    style: 'esriSLSSolid',
                    color: [ 255, 0, 0, 255 ],
                    width: 2
                }
            }
        },
        selectionMode: 'extended'
    };
});