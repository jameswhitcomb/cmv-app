/*eslint no-console: 0, no-alert: 0*/
define({
    map: true,
    zoomExtentFactor: 2,
    queries: [
        {
            description: 'Find Building',
            url: 'http://ags103vm.whitcomb.dev/arcgis/rest/services/afmc_cip/MapServer',
            layerIds: [1],
            searchFields: ['buildingNumber', 'alternateBuildingNumber', 'narrative', 'installationName'],
            minChars: 3,
            gridColumns: [
                {
                    field: 'layerName',
                    label: 'Layer',
                    width: 100,
                    sortable: false,
                    resizable: false
                },
                {
                    field: 'installationName',
                    label: 'installationName'
                },
                {
                    field: 'buildingNumber',
                    label: 'buildingNumber'
                },
                {
                    field: 'alternateBuildingNumber',
                    label: 'alternateBuildingNumber'
                },
                {
                    field: 'narrative',
                    label: 'narrative'
                },
                {
                    field: 'SORT_VALUE',
                    visible: false,
                    get: function (findResult) {
                        return findResult.layerName + ' ' + findResult.feature.attributes.buildingNumber; //seems better to use attributes[ 'Fcode' ] but fails build.  Attribute names will be aliases and may contain spaces and mixed cases.
                    }
                }
            ],
            sort: [
                {
                    attribute: 'SORT_VALUE',
                    descending: false
                }
            ],
            prompt: 'Building name or number'
            /*,
            customGridEventHandlers: [
                {
                    event: '.dgrid-row:click',
                    handler: function (event) {
                        alert('You clicked a row!');
                        console.log(event);
                    }
                }
            ]*/
        }
    ],
    selectionSymbols: {
        polygon: {
            type: 'esriSFS',
            style: 'esriSFSSolid',
            color: [255, 0, 0, 62],
            outline: {
                type: 'esriSLS',
                style: 'esriSLSSolid',
                color: [255, 0, 0, 255],
                width: 3
            }
        },
        point: {
            type: 'esriSMS',
            style: 'esriSMSCircle',
            size: 25,
            color: [255, 0, 0, 62],
            angle: 0,
            xoffset: 0,
            yoffset: 0,
            outline: {
                type: 'esriSLS',
                style: 'esriSLSSolid',
                color: [255, 0, 0, 255],
                width: 2
            }
        }
    },
    selectionMode: 'extended'
});