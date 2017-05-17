/**
 * @Name: Query widget for ArcGIS Server JavaScript API
 * @Author: Jonathan Meyer
 * @Company: Woolpert, Inc
 * @Description:
 * 		Widget for querying data from the dynamic map layers added to the map. Query results are displayed on the data grid.
 */

define([
    'esri/request',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/Color',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/data/ItemFileWriteStore',
    'dojox/grid/DataGrid',
    'dojox/grid/EnhancedGrid',
    'dojox/grid/enhanced/plugins/Pagination',
    'dijit/registry',
    'dijit/Tooltip',
    'dijit/Dialog',
    'dijit/form/TextBox',
    'dijit/form/DateTextBox',
    'dijit/form/NumberSpinner',
    'dijit/form/Select',
    'dijit/form/Button',
    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',
    'dijit/ProgressBar',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin', // need this if adding widgets to the template file.
    'dijit/_TemplatedMixin',
    'dojo/text!./QueryFeaturesWidget/templates/QueryFeaturesWidget.html',
    'xstyle/css!./QueryFeaturesWidget/css/QueryFeaturesWidget.css'
], function (esriRequest, Query, QueryTask, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, arrayUtils, declare, domConstruct, lang, On,
      ItemFileWriteStore, DataGrid, EnhancedGrid, Pagination, registry, Tooltip, Dialog, TextBox, DateTextBox, NumberSpinner, Select, Button,
      ContentPane, TabContainer, ProgressBar, _WidgetBase, widgetsInTemplateMixin, _TemplatedMixin, template, css) {

    return declare('gis.dijit.QueryFeaturesWidget', [_WidgetBase, _TemplatedMixin, widgetsInTemplateMixin], {

        templateString: template,
        baseClass: 'gis_QueryFeaturesWidget',
        fieldSelectList: [],
        selectedLayerDomains: [],

        map: null,
        dbType: 'SQL_SERVER',
        dataGridID: null,

        /**
         * Constructor: Params map, parentControlID, and dbType are required. If the dataGridID are not passed
         * 				the results are only displayed as highlighted features on the map.
         */
        constructor: function (params) {
            this.inherited(arguments);

            this.map = params.map;
            this.dbType = params.dbType;
            this.dataGridID = params.dataGridID;
        },

        /**
         * Post create: Will add the widget controls to the passed parentControlID.
         */
        postCreate: function () {
            //make sure any parent widget's postCreate functions get called.
            this.inherited(arguments);
        },

        /**
         *  Startup: Calls function to gather map layers on startup.
         */
        startup: function () {
            if (typeof this._started === "undefined") {
                this.inherited(arguments);

                this.getMapLayers();
                this.resetQueryDataStore();

                On(this.queryGrid, "rowClick", lang.hitch(this, this.queryGridRowClicked));
            }
        },

        /**
         *  Destory: 
         */
        destroy: function () {
            this.inherited(arguments);
        },

        /**
         *  queryGridRowClicked: Handles click event of the query grid control.
         *                      This will enable or disable the remove button.
         */
        queryGridRowClicked: function (evt) {
            var selectedItems = this.queryGrid.selection.getSelected();

            if (selectedItems) {
                if (selectedItems.length == 0) {
                    this.cmdRemoveQuery.set('disabled', true);
                }
                else {
                    this.cmdRemoveQuery.set('disabled', false);
                }
            }
        },

        /**
         *  resetQueryDataStore: Resets the data store for the query data grid.
         */
        resetQueryDataStore: function () {

            var data = {
                items: []
            };

            var fieldList = [
                {
                    name: 'Field',
                    field: 'Field'
                },
                {
                    name: 'Alias',
                    field: 'Alias',
                    hidden: true
                },
                {
                    name: 'Operator',
                    field: 'Operator'
                },
                {
                    name: 'Value',
                    field: 'Value'
                },
                {
                    name: 'Where',
                    field: 'Where',
                    hidden: true
                }
            ];

            var store = new ItemFileWriteStore({ data: data });

            var layout = [];
            layout[0] = fieldList;

            this.queryGrid.setStore(store);
            this.queryGrid.setStructure(layout);
        },

        /**
         *  getMapLayers: Builds a list of map services (dynamic and tiled) from the map and
         * 					populates the service drop list.
         */
        getMapLayers: function () {

            // Get a list of all dynamic and tiled map service layers
            // and populate the service drop list
            var serviceLayerIDS = this.map.layerIds;

            this.serviceSelect.options = [];

            this.serviceSelect.emptyLabel = "- Select One -";
            this.serviceSelect.addOption({ disabled: false, label: "", selected: true, value: "" });

            for (var i = 0; i < serviceLayerIDS.length; i++) {

                var layer = this.map.getLayer(serviceLayerIDS[i]);

                // Only list layers in drop down that are not base map layers or have the custom property displayInDropLists set to true
                if (this.isBaseMapLayer(serviceLayerIDS[i]) == false && layer.hasOwnProperty("displayInDropLists") && layer.displayInDropLists == true) {
                    this.serviceSelect.addOption({ disabled: false, label: serviceLayerIDS[i], selected: false, value: serviceLayerIDS[i] });
                }
            }
        },

        /**
         *  serviceSelectChange: Handles the selection change event of the service drop list. On change,
         * 						a list of the layers within the selected service is created and used to
         * 						populate the layer list.
         */
        serviceSelectChange: function (selectedVal) {

            // Get all the layerInfos for the selected service
            // and populate the layer select drop list
            if (selectedVal) {
                var selectedServiceID = selectedVal;

                var layer = this.map.getLayer(selectedServiceID);
                var layerInfos = layer.layerInfos;

                // Reset the layer and field drop lists
                this.resetLayerSelect();
                this.resetQueryFieldSelect();
                this.resetQueryDataStore();

                var firstLayerAdded = true;

                for (var i = 0; i < layerInfos.length; i++) {
                    // Only add layers that do not have subLayerIds
                    // Layers with subLayerIds indicate a group layer which would have no fields to query
                    if (!layerInfos[i].subLayerIds) {

                        if (firstLayerAdded == true) {
                            this.layerSelect.addOption({ disabled: false, label: layerInfos[i].name, selected: true, value: layerInfos[i].id.toString() });
                            firstLayerAdded = false;
                            this.layerSelectChange(i);
                        }
                        else {
                            this.layerSelect.addOption({ disabled: false, label: layerInfos[i].name, selected: false, value: layerInfos[i].id.toString() });
                        }
                    }
                }
            }
        },

        /**
         *  layerSelectChange: Handles the selection change event of the layer drop list. On change,
         * 						an esriRequest is created to gather field information about the selected service layer.
         * 						On success the requestLayerInfoSecceeded function is called.
         */
        layerSelectChange: function (selectedVal) {

            // Build request to gather fields for the selected layer
            if (selectedVal != null) {

                this.resetQueryFieldSelect();
                this.resetQueryDataStore();

                var selectedService = this.serviceSelect.value;
                var selectedLayerInfoID = selectedVal;

                var serviceLayer = this.map.getLayer(selectedService);

                var layerURL = serviceLayer.url + "/" + selectedVal.toString();

                var requestHandle = esriRequest({
                    "url": layerURL,
                    "content": {
                        "f": "json"
                    },
                    "callbackParamName": "callback"
                });
                requestHandle.then(lang.hitch(this, this.requestLayerInfoSucceeded), lang.hitch(this, this.requestLayerInfoFailed));
            }
        },

        /**
         *  requestLayerInfoSucceeded: Handles the successful return from an esriRequest call to a map service.
         * 						From the response the fields associated with the requested service are used to
         * 						populate the field select drop list.
         */
        requestLayerInfoSucceeded: function (response, io) {

            if (response != null) {

                var layerFields = response.fields;

                this.fieldSelectList = layerFields;

                // Sort the list by alias
                this.fieldSelectList.sort(function (a, b) {
                    var nameA = a.alias.toLowerCase(), nameB = b.alias.toLowerCase()
                    if (nameA < nameB) //sort string ascending
                        return -1
                    if (nameA > nameB)
                        return 1
                    return 0 //default return value (no sorting)
                })

                // Build the list of coded value domains
                // This is used later in formatting and populating
                // values in the data grid that are domain values
                this.selectedLayerDomains = [];
                arrayUtils.forEach(this.fieldSelectList, lang.hitch(this, function (f) {
                    if (f.domain != null) {
                        this.selectedLayerDomains[f.name] = f.domain.codedValues;
                    }
                }));

                this.resetQueryFieldSelect();

                for (var i = 0; i < layerFields.length; i++) {

                    if (i == 0) {
                        this.queryFieldSelect.addOption({ disabled: false, label: layerFields[i].alias, selected: true, value: i.toString() });
                        this.fieldSelectChange(0);
                    }
                    else {
                        this.queryFieldSelect.addOption({ disabled: false, label: layerFields[i].alias, selected: false, value: i.toString() });

                    }
                }
            }
        },

        /**
         *  requestLayerInfoFailed: Handles the failed return from an esriRequest call to a map service.
         */
        requestLayerInfoFailed: function (err) {

            console.log("Failed to gather information for the selected service. " + err);
        },

        /**
         *  fieldSelectChange: Handles the selection change event of the fields drop list. On change
         * 				we will create a control based on the type of field selected. Domain types will
         * 				get drop lists or number selectors based on the type of domain.
         */
        fieldSelectChange: function (selectedVal) {

            // Delete the existing value control
            var queryFeatureControl = registry.byId("queryFeatureValueControl");

            if (queryFeatureControl) {
                queryFeatureControl.destroy();
            }

            // Dynamically create the value control based on the type.
            //
            if (selectedVal != null) {
                var selectedField = this.fieldSelectList[selectedVal];

                if (selectedField.domain) {

                    if (selectedField.domain.type == 'codedValue') {

                        var codedValueSelect = new Select({ id: "queryFeatureValueControl", style: "width: 180px;" });

                        codedValueSelect.emptyLabel = "- Select One -";
                        codedValueSelect.addOption({ disabled: false, label: "", selected: true, value: "" });

                        for (var i = 0; i < selectedField.domain.codedValues.length; i++) {
                            codedValueSelect.addOption({ disabled: false, label: selectedField.domain.codedValues[i].name, selected: false, value: selectedField.domain.codedValues[i].code.toString() });
                        }

                        codedValueSelect.placeAt(this.queryValueContainer);
                        codedValueSelect.startup();
                    }
                    else if (selectedField.domain.type == 'range') {
                        var rangeValueSelect = new NumberSpinner({ id: "queryFeatureValueControl", style: "width: 180px;", constraints: { min: selectedField.domain.range[0], max: selectedField.domain.range[1] } });

                        rangeValueSelect.placeAt(this.queryValueContainer);
                        rangeValueSelect.startup();
                    }
                    else {
                        // 'inherited' domain types not implemented  
                        console.log('Inherited field type not supported');
                    }
                }
                else if (selectedField.type == 'esriFieldTypeDate') {
                    // Create date picker
                    var datePickBox = new DateTextBox({ id: "queryFeatureValueControl", value: new Date(), style: "width: 180px;" });
                    datePickBox.placeAt(this.queryValueContainer);
                    datePickBox.startup();
                }
                else if (selectedField.type == 'esriFieldTypeInteger' || selectedField.type == 'esriFieldTypeSmallInteger') {
                    var rangeValueSelect = new NumberSpinner({ id: "queryFeatureValueControl", value: 0, style: "width: 180px;", constraints: { places: 0 } });

                    rangeValueSelect.placeAt(this.queryValueContainer);
                    rangeValueSelect.startup();
                }
                else if (selectedField.type == 'esriFieldTypeDouble' || selectedField.type == 'esriFieldTypeSingle') {
                    var rangeValueSelect = new NumberSpinner({ id: "queryFeatureValueControl", value: 0, style: "width: 180px;" });

                    rangeValueSelect.placeAt(this.queryValueContainer);
                    rangeValueSelect.startup();
                }
                else {
                    // Create text box
                    var valueTextbox = new TextBox({ id: "queryFeatureValueControl", style: "width: 180px;" });
                    valueTextbox.placeAt(this.queryValueContainer);
                    valueTextbox.startup();
                }

                // Load operator drop list
                if (selectedField.type == 'esriFieldTypeString') {
                    this.buildOperatorPickList(true);
                }
                else {
                    this.buildOperatorPickList(false);
                }
            }
        },

        /**
         *  buildOperatorPickList: Builds the items to be displayed in the operator selector. If the query
         * 						is a string query the 'Like' operator is added.
         */
        buildOperatorPickList: function (isStringQuery) {

            this.queryOperatorSelect.options = [];

            this.queryOperatorSelect.addOption({ disabled: false, label: '=', selected: false, value: '=' });
            this.queryOperatorSelect.addOption({ disabled: false, label: '&lt;', selected: false, value: '<' });
            this.queryOperatorSelect.addOption({ disabled: false, label: '&lt;=', selected: false, value: '<=' });
            this.queryOperatorSelect.addOption({ disabled: false, label: '&gt;', selected: false, value: '>' });
            this.queryOperatorSelect.addOption({ disabled: false, label: '&gt;=', selected: false, value: '>=' });
            this.queryOperatorSelect.addOption({ disabled: false, label: '&lt;&gt;', selected: false, value: '<>' });

            if (isStringQuery) {
                this.queryOperatorSelect.addOption({ disabled: false, label: 'Like', selected: false, value: 'Like' });
		this.queryOperatorSelect.addOption({ disabled: false, label: 'Contains', selected: false, value: 'Contains' });
            }
        },

        /**
         *  resetLayerSelect: Resets the layer select drop list to empty.
         */
        resetLayerSelect: function () {
            this.layerSelect.options = [];
        },

        /**
         *  resetQueryFieldSelect: Resets the field select drop list to empty.
         */
        resetQueryFieldSelect: function () {
            this.queryFieldSelect.options = [];
        },

        /**
         *  addQuery: Adds a query definition to the data grid.
         */
        addQuery: function () {

            if (!this.validateInputs()) {
                var errorDialog = new Dialog({
                    title: "Query Tool Validation",
                    content: "Invalid or missing query options entered. Please verify values are set or selected for all query options.",
                    style: "width: 350px;"
                });
                errorDialog.startup();
                errorDialog.show();
            }
            else {

                var queryOperator = this.queryOperatorSelect.value;
                var queryFeatureControl = registry.byId("queryFeatureValueControl");
                var compareValue = queryFeatureControl.value;

                var queryField = this.fieldSelectList[this.queryFieldSelect.value];
                var whereClause = '';
                
                if (queryField) {

                    whereClause = this.createWhereClause(queryField, queryOperator, compareValue);
                }
                
                var item = {
                    Field: this.fieldSelectList[this.queryFieldSelect.value].name,
                    Alias: this.fieldSelectList[this.queryFieldSelect.value].alias,   //todo this is not correct
                    Operator: this.queryOperatorSelect.value,
                    Value: compareValue,
                    Where: whereClause
                };

                this.queryGrid.store.newItem(item);
                this.resetQueryButtons();
            }
        },

        /**
         *  removeQuery: Removes a query definition from the data grid.
         */
        removeQuery: function () {
           
            var items = this.queryGrid.selection.getSelected();
            if (items.length) {
                /* Iterate through the list of selected items.
                   The current item is available in the variable
                   "selectedItem" within the following function: */
                arrayUtils.forEach(items, lang.hitch(this, function (selectedItem) {
                    if (selectedItem !== null) {
                        /* Delete the item from the data store: */
                        this.queryGrid.store.deleteItem(selectedItem);
                    }
                }));
            }
            this.resetQueryButtons();
        },

        /**
        *  resetQueryButtons: Resets the add, remove, and search buttons.
        */
        resetQueryButtons: function () {
            this.queryGrid.store.fetch({ query: {}, onBegin: lang.hitch(this, this.queryResult), start: 0, count: 0 });
        },

        /**
        *  queryResult: Callback function for searching for data in the data grid's data store.
        */
        queryResult: function size(size, request) {
            if (size == 0) {
                this.cmdStartFeatureSearch.set('disabled', true);
                this.cmdRemoveQuery.set('disabled', true);
            }
            else {

                var selectedItems = this.queryGrid.selection.getSelected();

                if (selectedItems) {
                    if (selectedItems.length == 0) {
                        this.cmdRemoveQuery.set('disabled', true);
                    }
                    else {
                        this.cmdRemoveQuery.set('disabled', false);
                    }
                }

                this.cmdStartFeatureSearch.set('disabled', false);
            }
        },

        /**
         *  startFeatureSearch: Handles the click event of the search button.  This will create and call a QueryTask
         * 					based on the items the user has selected form the screen. On success the queryTaskComplete
         * 					function is called.
         */
        startFeatureSearch: function () {

            if (this.queryGrid.rowCount == 0 ) {
                var errorDialog = new Dialog({
                    title: "Query Tool Validation",
                    content: "At least one query must be added to execute a search. Please add a query to start your search.",
                    style: "width: 350px;"
                });
                errorDialog.startup();
                errorDialog.show();
            }
            else {

                try {
                    // Create progress bar	
                    var myProgressBar = new ProgressBar({
                        style: "width: 180px",
                        value: Infinity,
                        label: "Searching..."
                    }).placeAt(this.progressBarContainer);

                    this.cmdStartFeatureSearch.disabled = true;

                    var serviceLayer = this.map.getLayer(this.serviceSelect.value);
                    var layerID = this.layerSelect.value;
                    var layerURL = serviceLayer.url + "/" + layerID.toString();

                    var queryTask = new QueryTask(layerURL);

                    var query = new Query();
                    query.returnGeometry = true;
                    query.outFields = ["*"];
                    query.outSpatialReference = this.map.spatialReference;
 
                    for (var i = 0; i < this.queryGrid.rowCount; i++) {
                        
                        var queryItem = this.queryGrid.getItem(i);
                        query.where += queryItem.Where;

                        if (i != this.queryGrid.rowCount - 1) {
                            query.where += " and "
                        }
                    }

                    queryTask.on("complete", lang.hitch(this, this.queryTaskComplete));
                    queryTask.on("error", lang.hitch(this, this.showQueryFailureError));

                    queryTask.execute(query);
                }
                catch (err) {
                    this.showQueryFailureError(err);
                }

            }
        },

        /**
         *  createWhereClause: Creates a where clause string for the provided input values.
         */
        createWhereClause: function(queryField, queryOperator, compareValue){

            var whereClause = '';

            if (queryField.type == "esriFieldTypeString") {
                if (queryOperator == "Contains") {
                whereClause = "CONTAINS(" + queryField.name + ",'" + compareValue.trim().toUpperCase() + "')";
                }
                else
                {
                whereClause = "Upper(" + queryField.name + ") " + queryOperator + " '" + compareValue.trim().toUpperCase() + "'";
                }
            }
            else if (queryField.type == "esriFieldTypeDate") {

                // Format date string
                var date = compareValue;
                var month = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1);
                var day = (date.getDate() + 1) > 9 ? (date.getDate() + 1) : "0" + (date.getDate() + 1);
                var hours = (date.getHours()) > 9 ? (date.getHours()) : "0" + (date.getHours());
                var minutes = (date.getMinutes()) > 9 ? (date.getMinutes()) : "0" + (date.getMinutes());
                var seconds = (date.getSeconds()) > 9 ? (date.getSeconds()) : "0" + (date.getSeconds());

                var dateString =
                    month + "/" +
                    day + "/" +
                    date.getFullYear() + " " +
                    hours + ":" +
                    minutes + ":" +
                    seconds;

                // Handle DB specific date strings
                if (this.dbType == "SQL_SERVER") {
                    whereClause = queryField.name + " " + queryOperator + " '" + dateString + "'";
                }
                else {
                    whereClause = queryField.name + " " + queryOperator + " date '" + dateString + "'";
                }
            }
            else {
                whereClause = queryField.name + " " + queryOperator + " " + compareValue;
            }
            
            return whereClause;
        },


        /**
         *  showQueryFailureError: Handles the failure of the query task.
         */
        showQueryFailureError: function (err) {
            console.log("Query Task failed. " + err);
            // delete progress bar
            domConstruct.empty(this.progressBarContainer);

            var errorDialog = new Dialog({
                title: "Query Failure",
                content: "Failed to query features with selected options. Please verify inputs. <p/>" + err.error,
                style: "max-width: 400px;"
            });
            errorDialog.startup();
            errorDialog.show();

            this.cmdStartFeatureSearch.disabled = false;
        },

        /**
         *  queryTaskComplete: Handles the success of the query task.  Will draw the result features to the map and also add them to 
         * 					the data grid if required.
         */
        queryTaskComplete: function (results) {

            this.cmdStartFeatureSearch.disabled = false;
            this.map.graphics.clear();
            // delete progress bar
            domConstruct.empty(this.progressBarContainer);

            // Add a unique ID to fields
            var ctr = 0;
            var items = arrayUtils.map(results.featureSet.features, lang.hitch(this, function (result) {

                // Must create a new graphic or printing will fail as using the graphic for both the map
                // and data grid causes printing to fail
                var graphic = new esri.Graphic(result.toJson());

                switch (graphic.geometry.type) {
                    case "point":
                        var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([98, 194, 204]), 3), new Color([98, 194, 204]));
                        break;
                    case "polyline":
                        var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([98, 194, 204]), 3), new Color([0, 0, 0, 0]));
                        break;
                    case "polygon":
                        var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([98, 194, 204]), 3), new Color([0, 0, 0, 0]));
                        break;
                }
                
                graphic.setSymbol(symbol);

                graphic.attributes['ROWID'] = ctr;
                result.attributes['ROWID'] = ctr;

                this.map.graphics.add(graphic);

                ctr++;
                return result.attributes;
            }));

            // set up data store for the grid
            var data = {
                identifier: "ROWID",
                items: items
            };

            var layout = [];
            var fieldList = [];
            var rowIDField = [];
            rowIDField['name'] = 'ROWID';
            rowIDField['field'] = 'ROWID';
            rowIDField['hidden'] = true;
            fieldList.push(rowIDField);

            for (var i = 0; i < results.featureSet.fields.length; i++) {
                var field = [];
                field['name'] = results.featureSet.fields[i].alias;
                field['field'] = results.featureSet.fields[i].name;
                field['width'] = '125px';

                // If a date field set the formatter to the date format function
                if (results.featureSet.fields[i].type == "esriFieldTypeDate") {
                    field['formatter'] = this.formatDataGridDate;
                }

                // If field name is found in the list of domain values set
                // formatter to coded domain format function
                if (results.featureSet.fields[i].name in this.selectedLayerDomains) {
                    field['formatter'] = lang.hitch(this, this.formatCodedDomainGridValue);
                }

                fieldList.push(field);
            }

            layout[0] = fieldList;

            var store = new ItemFileWriteStore({ data: data });

            var dataGrid = registry.byId(this.dataGridID);

            if (dataGrid) {

                dataGrid.setStore(store);
                dataGrid.setStructure(layout);
                dataGrid.on("rowclick", lang.hitch(this, this.onRowClickHandler));

                // Must call resize on grid for it to display correctly
                // after data has been loaded.
                dataGrid.resize();
            }
            

            // Show message if no results were returned from query
            if (results.featureSet.features.length == 0) {
                var errorDialog = new Dialog({
                    title: "No Results Found",
                    content: "No Results Found.",
                    style: "width: 350px;"
                });
                errorDialog.startup();
                errorDialog.show();
            }
        },

        /**
         *  formatCodedDomainGridValue: Formats the domain values stored in the DB as their
         * 								coded value.
         */
        formatCodedDomainGridValue: function (value, rowIndex, column) {
            // look up column field value against list of domains from there determine what value should be	returned for display
            if (value) {

                if (column.field in this.selectedLayerDomains) {

                    var codedValue = "";
                    arrayUtils.forEach(this.selectedLayerDomains[column.field], function (domainVal) {
                        if (domainVal.code != null && domainVal.code == value) {
                            codedValue = domainVal.name;
                        }
                    });

                    return codedValue;
                }
            }
            else {
                return "";
            }
        },

        /**
         *  formatDataGridDate: Formats the date values stored in the DB as values since 1970 into 
         * 						their string values.
         */
        formatDataGridDate: function (milliSecUnix) {
            var d, mm, dd, h, period;
            if (milliSecUnix) {
                d = new Date(milliSecUnix);
                mm = d.getUTCMonth() + 1;
                dd = d.getUTCDate();

                hMilitary = d.getUTCHours();

                m = d.getUTCMinutes();
                s = d.getUTCSeconds();

                if (hMilitary = 12) {
                    h = hMilitary;
                    period = "PM";
                }
                else if (hMilitary > 12) {
                    h = hMilitary - 12;
                    period = "PM";
                }
                else {
                    h = hMilitary;
                    period = "AM";
                }

                return (
                        ((mm < 10) ? "0" + mm : mm) + "/" +
                        ((dd < 10) ? "0" + dd : dd) + "/" +
                        d.getUTCFullYear() + "  " +
                        ((h < 10) ? "0" + h : h) + ":" +
                        ((m < 10) ? "0" + m : m) + ":" +
                        ((s < 10) ? "0" + s : s) + " " + period);
            }
            else {
                return "";
            }
        },


        /**
         *  clearBufferGraphics: Handles the clear buffer graphics button click event.  On click, the buffered graphics
         * 						on the map and optionally the data grid will be cleared.
         */
        clearResults: function () {

            this.map.graphics.clear();
            
            var emptyData = {
                items: []
            };

            var store = new ItemFileWriteStore({ data: emptyData });

            var dataGrid = registry.byId(this.dataGridID);

            if (dataGrid) {
                dataGrid.setStore(store);
            }
        },

        /**
         *  onRowClickHandler: Handles the row click event of the datagrid.  On row click, the map is zoomed to the extent
         * 					of the associated graphic on the map.
         */
        onRowClickHandler: function (evt) {
            try {
                var clickedFeatureRow = evt.grid.getItem(evt.rowIndex);
                var selectedFeature = arrayUtils.filter(this.map.graphics.graphics, function (graphic) {
                    return ((graphic.attributes) && (graphic.attributes.ROWID == clickedFeatureRow.ROWID[0]));
                });
                var unselectedFeatures = arrayUtils.filter(this.map.graphics.graphics, function (graphic) {
                    return ((graphic.attributes) && (graphic.attributes.ROWID != clickedFeatureRow.ROWID[0]));
                });


                if (selectedFeature.length) {

                    this.setFeatureSelected(selectedFeature[0]);

                    // Points don't have an extent so must create one from the point
                    if (selectedFeature[0].geometry.type == "point") {
                        var factor = 2;
                        var point = selectedFeature[0].geometry;
                        var extent = new esri.geometry.Extent(point.x - factor, point.y - factor, point.x + factor, point.y + factor, point.spatialReference);
                        this.map.setExtent(extent, true);
                    }
                    else {
                        this.map.setExtent(selectedFeature[0].geometry.getExtent(), true);
                    }
                }

                if (unselectedFeatures.length) {

                    for (var i = 0; i < unselectedFeatures.length; i++) {
                        this.setFeatureHighlighted(unselectedFeatures[i]);
                    }
                }

                // Must redraw or change to graphics colors will not show
                this.map.graphics.redraw();

            }
            catch (ex) {
                console.log("Error finding selected graphic for the clicked row. " + err);
            }

        },

        /**
         *  setFeatureHighlighted: Highlights a feature outline in blue.
         */
        setFeatureHighlighted: function(feature){

            switch (feature.geometry.type) {
                case "point":
                    var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([98, 194, 204]), 3), new Color([98, 194, 204]));
                    break;
                case "polyline":
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([98, 194, 204]), 3), new Color([0, 0, 0, 0]));
                    break;
                case "polygon":
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([98, 194, 204]), 3), new Color([0, 0, 0, 0]));
                    break;
            }

            feature.symbol = symbol;
        },

        /**
         *  setFeatureSelected: Highlights a feature outline in red.
         */
        setFeatureSelected: function(feature){

            switch (feature.geometry.type) {
                case "point":
                    var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 3), new Color([255, 0, 0]));
                    break;
                case "polyline":
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 3), new Color([0, 0, 0, 0]));
                    break;
                case "polygon":
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 3), new Color([0, 0, 0, 0]));
                    break;
            }

            feature.symbol = symbol;
        },

        /**
         *  validateInputs: Validates the users inputs for creating the query request.
         */
        validateInputs: function () {

            var inputsAreValid = true;

            var queryFeatureControl = registry.byId("queryFeatureValueControl");

            if (this.serviceSelect.value && this.serviceSelect.value != "") {
            }
            else {
                inputsAreValid = false;
            }

            if (this.layerSelect.value && this.layerSelect.value != "") {
            }
            else {
                inputsAreValid = false;
            }

            if (this.queryFieldSelect.value && this.queryFieldSelect.value != "") {
            }
            else {
                inputsAreValid = false;
            }

            if (queryFeatureControl) {

                // If value of queryFeatureControl is a number spinner or drop select user must set a value.
                // Text boxes we will allow to be empty
                if (queryFeatureControl.declaredClass == "dijit.form.NumberSpinner" && isNaN(queryFeatureControl.value)) {
                    inputsAreValid = false;
                }
                else if (queryFeatureControl.declaredClass == "dijit.form.Select" && queryFeatureControl.value == "") {
                    inputsAreValid = false;
                }

            }
            else {
                inputsAreValid = false;
            }

            return inputsAreValid;
        },

        /**
         *  isBaseMapLayer: Checks a layer ID to determine if it is a basemap layer.
         */
        isBaseMapLayer: function (layerID) {

            var baseMapLayerIDs = this.map.basemapLayerIds;

            var isBaseMap = false;

            for (var i = 0; i < baseMapLayerIDs.length; i++) {

                if (baseMapLayerIDs[i] == layerID) {
                    isBaseMap = true;
                    break;
                }
            }

            return isBaseMap;
        }

    });

});
