$(window).on('load', function() {
      
ymaps.ready(init);

function init() {
	var dataObj, dataJSON, statSelector, 
	listBCtype, filterMonitorType,
	listBCstatus, filterMonitorStatus,
	listBCfixage, filterMonitorFixage,
	listBCauthor, filterMonitorAuthor, author = {},
	objectManager = CreateObjectManager(),
    mhMap = new ymaps.Map('map', {
      center: [37.64, 55.76],
      zoom: 10,
      controls: ["rulerControl", "searchControl", "zoomControl", "geolocationControl", "fullscreenControl"]
    }, {
      searchControlProvider: 'yandex#map'
    });
	mhMap.geoObjects.add(objectManager);

	ymaps.modules.require(['plugin.AuthorListBoxControl', 'DatasetOps',
		'plugin.FixageListBoxControl', 'plugin.StatusListBoxControl', 'plugin.TypeListBoxControl', 
		'plugin.FileOpenButton', 'plugin.StatusTypeSelector', 'plugin.GridSizeChanger', 
		'plugin.CustomItemContentLayout'])
        .spread(function ( AuthorListBoxControl, DatasetOps,
			FixageListBoxControl, StatusListBoxControl, TypeListBoxControl, 
			FileOpenButton, StatusTypeSelector, GridSizeChanger, 
			CustomItemContentLayout) {
			statSelector = new StatusTypeSelector(objectManager);
			mhMap.controls.add(statSelector,{ float: 'left', floatIndex: 10});
			mhMap.controls.add(new GridSizeChanger(objectManager),{ float: 'left', floatIndex: 6});
			mhMap.controls.add(new FileOpenButton(), { float: 'left', floatIndex: 11});
			
			listBCtype = new TypeListBoxControl();
			mhMap.controls.add(listBCtype, {float: 'left', floatIndex: 8});
			filterMonitorType = new ymaps.Monitor(listBCtype.state);
			
			listBCstatus = new StatusListBoxControl();
			mhMap.controls.add(listBCstatus, { float: 'left', floatIndex: 9});
			filterMonitorStatus = new ymaps.Monitor(listBCstatus.state);

			listBCfixage = new FixageListBoxControl();
			mhMap.controls.add(listBCfixage, { float: 'left',floatIndex: 7});
			filterMonitorFixage = new ymaps.Monitor(listBCfixage.state);
			
			listBCauthor = new AuthorListBoxControl(author);
			filterMonitorAuthor = new ymaps.Monitor(listBCauthor.state);
			
			var ds = new DatasetOps({map:mhMap, om:objectManager});
			// ds.updateAuthorsList({author:author, list:listBCauthor});
			ds.setFilter2Monitor({om:objectManager, fm:filterMonitorAuthor, author:author,
				listBCstatus:listBCstatus, listBCtype:listBCtype, listBCfixage:listBCfixage, listBCauthor:listBCauthor});
			ds.setFilter2Monitor({om:objectManager, fm:filterMonitorType, author:author,
				listBCstatus:listBCstatus, listBCtype:listBCtype, listBCfixage:listBCfixage, listBCauthor:listBCauthor});
			ds.setFilter2Monitor({om:objectManager, fm:filterMonitorStatus, author:author,
				listBCstatus:listBCstatus, listBCtype:listBCtype, listBCfixage:listBCfixage, listBCauthor:listBCauthor});
			ds.setFilter2Monitor({om:objectManager, fm:filterMonitorFixage, author:author,
				listBCstatus:listBCstatus, listBCtype:listBCtype, listBCfixage:listBCfixage, listBCauthor:listBCauthor});

			
        },
        function (error) {
			console.log(error);
        },this);

    var searchControl = mhMap.controls.get('searchControl'),
    type = SetArrays("type"),
    status = SetArrays("status"),
    fixage = SetArrays("fixage"),
    getDataSet = function(dataSetUrl) {
      $.ajax({
        url: dataSetUrl,
        accepts: {
          encoding: 'gzip, deflate'
        }
      }).done(function(data) {
        dataObj = JSON.parse(data);
        fillPlacemarks(dataObj, false);
        boundMap(mhMap, objectManager.getBounds());
      });
    },
    fillPlacemarks = function(obj, clear = true) {
      var path, ttf, date, features = obj.features;
      if (clear) objectManager.removeAll();
      obj.features = [];
      for (var f of features) {
        try {
          author[f.properties.data.moshelper.uid] = f.properties.data.moshelper;
          path = f.properties.data.photo.substring(0, f.properties.data.photo.indexOf("small"));
          f.properties.balloonContentHeader = type[f.properties.data.type].name + ": <a href=pakpm://" + f.id + ">" + f.properties.data.auto_number.toUpperCase() + "</a>";
		  ttf = (f.properties.data.updated - f.properties.data.date)/1000;
		  date = new Date(f.properties.data.date);	
          f.properties.balloonContentBody = status[f.properties.data.status].name + "</br>Зафиксирован за "+ ttf +" сек.</br>" + date.toLocaleString() + "</br><img class='img' src=" + f.properties.data.photo + "></br><img class='img' src=" + path + "/full/number_plate.jpeg" + ">" + (((f.properties.data.type == 1) || (f.properties.data.type == 2)) ? "</br><img class='img' src=" + path + "/small/traffic_sign.jpeg" + ">" : "");
          f.properties.balloonContentFooter = "Автор: " + f.properties.data.moshelper.name;
          f.properties.clusterCaption = type[f.properties.data.type].name + ": <a href=pakpm://" + f.id + ">" + f.properties.data.auto_number.toUpperCase() + "</a>";
          f.properties.hintContent = type[f.properties.data.type].name + ": " + status[f.properties.data.status].name;
          f.properties.iconContent = f.properties.data.auto_number.toUpperCase();
          f.options = {};
          f.options.balloonContentLayout = 'mh#featureBCLayout';
          f.options.preset = "islands#" + ((statSelector.isSelected()) ? type[f.properties.data.type].color : status[f.properties.data.status].color) + "StretchyIcon";
          obj.features.push(f);
        } catch (e) {
			console.log(e);
        }
      }
      objectManager.add(JSON.stringify(obj));
      // updateAuthorsList(mhMap, filterMonitorAuthor);
    };

  searchControl.events.add(['submit', 'clear'], function(e) {
    //console.log(e.originalEvent.type + ": " + searchControl.getRequestString());
    var re = /JSON:/i;
    var r = searchControl.getRequestString();
    if (re.test(r)) {
      searchControl.clear();
      getDataSet(r.replace(re, ''));
    } else {
      var filters = ymaps.util.extend({}, 
                                      listBCauthor.state.get('filters'), 
                                      listBCstatus.state.get('filters'), 
                                      listBCtype.state.get('filters'),
                                      listBCfixage.state.get('filters'));
      objectManager.setFilter(getFilterFunction(filters));
      boundMap(mhMap, objectManager.getBounds());
    }
  }, this);
}
});
