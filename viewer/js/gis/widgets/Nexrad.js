define([
	'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'esri/layers/WebTiledLayer',
    'dojo/_base/lang',
    'dojo/text!./Nexrad/templates/Nexrad.html',
    'dojox/timing',
    'dijit/form/Button',
    'dijit/form/HorizontalSlider',
    'dojo/domReady!'


], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
 WebTiledLayer, lang, template, timing, Button, HorizontalSlider) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

        widgetsInTemplate: true,
        templateString: template,

        postCreate: function () {
            this.inherited(arguments);
            map = this.map;

            this._init();
            m = 0
            t = new timing.Timer(1500);
            t.onTick = lang.hitch(this, '_ticker', m);
            //auto start if widget is defaulted to open
            if (this.parentWidget.open)
                t.start();
        },

        _startTicker: function () {
            t.start();
        },

        _stopTicker: function(){
            t.stop();
            nexrad45m.hide();
            nexrad40m.hide();
            nexrad35m.hide();
            nexrad30m.hide();
            nexrad25m.hide();
            nexrad20m.hide();
            nexrad15m.hide();
            nexrad10m.hide();
            nexrad5m.hide();
            nexrad.hide();
            this.timeStampTextNode.innerText = "";
        },

        _sliderChange: function(value) {
            nexrad45m.setOpacity(value);
            nexrad40m.setOpacity(value);
            nexrad35m.setOpacity(value);
            nexrad30m.setOpacity(value);
            nexrad25m.setOpacity(value);
            nexrad20m.setOpacity(value);
            nexrad15m.setOpacity(value);
            nexrad10m.setOpacity(value);
            nexrad5m.setOpacity(value);
            nexrad.setOpacity(value);
        },

        _ticker: function (n) {
            m = m + 1
            var n = parseInt(m.toString().slice(-1));
            //console.log(n);

            var msPerMinute = 60000;
            var currentTime = new Date();

            if (n == 1) {
                nexrad5m.hide();
                nexrad.hide();
                nexrad45m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 45 * msPerMinute);
            }
            else if (n == 2) {
                nexrad40m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 40 * msPerMinute);
            }
            else if (n == 3) {
                nexrad45m.hide();
                nexrad35m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 35 * msPerMinute);
            }
            else if (n == 4) {
                nexrad40m.hide();
                nexrad30m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 30 * msPerMinute);
            }
            else if (n == 5) {
                nexrad35m.hide();
                nexrad25m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 25 * msPerMinute);
            }
            else if (n == 6) {
                nexrad30m.hide();
                nexrad20m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 20 * msPerMinute);
            }
            else if (n == 7) {
                nexrad25m.hide();
                nexrad15m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 15 * msPerMinute);
            }
            else if (n == 8) {
                nexrad20m.hide();
                nexrad10m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 10 * msPerMinute);
            }
            else if (n == 9) {
                nexrad15m.hide();
                nexrad5m.show();
                this.timeStampTextNode.innerText = new Date(currentTime - 5 * msPerMinute);
            }
            else if (n == 0) {
                nexrad10m.hide();
                nexrad.show();
                this.timeStampTextNode.innerText = currentTime;
            };
        },



        _init: function () {

            var subs = ["mesonet", "mesonet1", "mesonet2", "mesonet3"];
            nexrad50m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m50m/${level}/${col}/${row}.png", {
                id: "nexrad50",
                subDomains: subs
            });
            map.addLayer(nexrad50m);
            nexrad50m.hide();
            nexrad45m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m45m/${level}/${col}/${row}.png", {
                id: "nexrad45",
                subDomains: subs
            });
            map.addLayer(nexrad45m);
            nexrad45m.hide();
            nexrad40m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m40m/${level}/${col}/${row}.png", {
                id: "nexrad40",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad40m);
            nexrad40m.hide();
            nexrad35m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m35m/${level}/${col}/${row}.png", {
                id: "nexrad35",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad35m);
            nexrad35m.hide();
            nexrad30m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m30m/${level}/${col}/${row}.png", {
                id: "nexrad30",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad30m);
            nexrad30m.hide();
            nexrad25m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m25m/${level}/${col}/${row}.png", {
                id: "nexrad25",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad25m);
            nexrad25m.hide();
            nexrad20m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m20m/${level}/${col}/${row}.png", {
                id: "nexrad20",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad20m);
            nexrad20m.hide();
            nexrad15m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m15m/${level}/${col}/${row}.png", {
                id: "nexrad15",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad15m);
            nexrad15m.hide();
            nexrad10m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m10m/${level}/${col}/${row}.png", {
                id: "nexrad10",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad10m);
            nexrad10m.hide();
            nexrad5m = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m05m/${level}/${col}/${row}.png", {
                id: "nexrad5",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad5m);
            nexrad5m.hide();
            nexrad = new esri.layers.WebTiledLayer("http://${subDomain}.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/${level}/${col}/${row}.png", {
                id: "nexrad",
                subDomains: subs,
                opacity: 0.8
            });
            map.addLayer(nexrad);
            nexrad.hide();
            
        },
        

    });
});
