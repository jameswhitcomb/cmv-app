define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'esri/dijit/Measurement',
    'dojo/text!./Measurement/templates/Measurement.html',
    'dojo/i18n!./Measurement/nls/resource',
    'dojo/aspect',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/dom',
    'dojo/fx/Toggler',
    'esri/geometry/Point',
    'esri/SpatialReference',
    'esri/geometry/webMercatorUtils',

    'dijit/form/Form',
    'dijit/form/Select',
    'dijit/form/DropDownButton',
    'dijit/form/Button',
    'dijit/form/ValidationTextBox',
    'xstyle/css!./Measurement/css/Measurement.css'
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Measurement, MeasureTemplate, i18n, aspect, lang, domConstruct, topic, dom, Toggler, Point, SpatialReference, webMercatorUtils) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: MeasureTemplate,
        i18n: i18n,
        baseClass: 'gis_MeasurementDijit',
        //declaredClass: 'gis.dijit.Measurement',
        mapClickMode: null,
        postCreate: function () {
            this.inherited(arguments);
            this.measure = new Measurement({
                map: this.map,
                defaultAreaUnit: this.defaultAreaUnit,
                defaultLengthUnit: this.defaultLengthUnit
            }, this.measureWidgetDom);
            this.measure.startup();
            aspect.after(this.measure, 'setTool', lang.hitch(this, 'checkMeasureTool'));
            aspect.after(this.measure, 'closeTool', lang.hitch(this, 'checkMeasureTool'));
            this.own(topic.subscribe('mapClickMode/currentSet', lang.hitch(this, 'setMapClickMode')));

            if (this.parentWidget && this.parentWidget.toggleable) {
                this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
                    this.onLayoutChange(this.parentWidget.open);
                })));
            }

            this.ddToggler = new Toggler({
                node: this.ddBlock
            });

            this.dmsToggler = new Toggler({
                node: this.dmsBlock
            });
            this.dmsToggler.hide();
        },
        checkMeasureTool: function () {
            // no measurement tool is active
            if (!this.measure.activeTool || this.measure.activeTool === '') {
                this.addCoordinateDijit.setDisabled(true);
                //this.endCoordinateDijit.setDisabled(true);
                if (this.mapClickMode === 'measure') {
                    this.connectMapClick();
                }
                // a measurement tool is active
            } else {
                this.addCoordinateDijit.setDisabled(false);
                //this.endCoordinateDijit.setDisabled(false);
                if (this.mapClickMode !== 'measure') {
                    this.disconnectMapClick();
                }
            }
        },
        disconnectMapClick: function () {
            topic.publish('mapClickMode/setCurrent', 'measure');
        },
        connectMapClick: function () {
            topic.publish('mapClickMode/setDefault');
        },
        onLayoutChange: function (open) {
            // end measurement on close of title pane
            if (!open && this.mapClickMode === 'measure') {
                this.connectMapClick();
            }
        },
        setMapClickMode: function (mode) {
            this.mapClickMode = mode;
            if (mode !== 'measure') {
                this.measure.setTool('area', false);
                this.measure.setTool('distance', false);
                this.measure.setTool('location', false);
                this.measure.clearResult();
            }
        },
        onCoordTypeChange: function (val) {
            //console.log(val);
            switch (val) {
                case "DD":
                    this.ddToggler.show();
                    this.dmsToggler.hide();
                    dojo.setStyle(this.ddBlock, "height", "30px");
                    dojo.setStyle(this.ddBlock, "display", "block");
                    dojo.setStyle(this.dmsBlock, "height", "0");
                    dojo.setStyle(this.dmsBlock, "display", "none");
                    break;
                case "DMS":
                    this.dmsToggler.show();
                    this.ddToggler.hide();
                    dojo.setStyle(this.ddBlock, "height", "0");
                    dojo.setStyle(this.ddBlock, "display", "none");
                    dojo.setStyle(this.dmsBlock, "height", "102px");
                    dojo.setStyle(this.dmsBlock, "display", "block");
                    break;
            }
        },
        getPoint: function () {
            if (this.coordTypeSelectDijit.value == "DD" && this.xCoordDijit.value.length > 0 && this.yCoordDijit.value.length > 0) {
                var pt = new Point(this.xCoordDijit.value, this.yCoordDijit.value, new SpatialReference({ wkid: 4326 }));
                //this.map.emit("click", { bubbles: true, cancelable: true, mapPoint: webMercatorUtils.geographicToWebMercator(pt) });
                return (webMercatorUtils.geographicToWebMercator(pt));
            }
            if (this.coordTypeSelectDijit.value === "DMS" && this.degLongCoordDijit.value.length > 0 && this.minLongCoordDijit.value.length > 0 && this.secLongCoordDijit.value.length > 0
                    && this.degLatCoordDijit.value.length > 0 && this.minLatCoordDijit.value.length > 0 && this.secLatCoordDijit.value.length > 0) {
                var x = parseFloat(this.degLongCoordDijit.value) + parseFloat(this.minLongCoordDijit.value) / 60 + parseFloat(this.secLongCoordDijit.value) / 3600;
                var y = parseFloat(this.degLatCoordDijit.value) + parseFloat(this.minLatCoordDijit.value) / 60 + parseFloat(this.secLatCoordDijit.value) / 3600;
                var pt = new Point(x, y, new SpatialReference({ wkid: 4326 }));
                //this.map.emit("click", { bubbles: true, cancelable: true, mapPoint: webMercatorUtils.geographicToWebMercator(pt) });
                return (webMercatorUtils.geographicToWebMercator(pt));
            }
        },
        addCoord: function () {
            if (this.coordFormDijit.isValid()) {
                var pt = this.getPoint();
                if (pt) {
                    this.map.emit("click", { bubbles: true, cancelable: true, mapPoint: pt });
                    this.map.centerAt(pt);
                }
            }
            
        }
        //endCoord: function () {
        //    var pt = this.getPoint();
        //    this.map.emit("dbl-click", { bubbles: true, cancelable: true, mapPoint: pt });
        //}
    });
});