$(window).on('load', function() {
      
ymaps.ready(init);

function init() {
	var dataObj, dataJSON, statSelector, 
	listBCtype, filterMonitorType,
	listBCstatus, filterMonitorStatus,
	objectManager = CreateObjectManager(),
    mhMap = new ymaps.Map('map', {
      center: [37.64, 55.76],
      zoom: 10,
      controls: ["rulerControl", "searchControl", "zoomControl", "geolocationControl", "fullscreenControl"]
    }, {
      searchControlProvider: 'yandex#map'
    });
	
	ymaps.modules.require([
		'plugin.StatusListBoxControl', 'plugin.TypeListBoxControl', 
		'plugin.FileOpenButton', 'plugin.StatusTypeSelector', 'plugin.GridSizeChanger', 
		'plugin.CustomItemContentLayout'])
        .spread(function (StatusListBoxControl, TypeListBoxControl, 
			FileOpenButton, StatusTypeSelector, GridSizeChanger, 
			CustomItemContentLayout) {
			statSelector = new StatusTypeSelector();
			mhMap.controls.add(statSelector,{ float: 'left', floatIndex: 10});
			mhMap.controls.add(new GridSizeChanger(),{ float: 'left', floatIndex: 6});
			mhMap.controls.add(new FileOpenButton(), { float: 'left', floatIndex: 11});
			
			listBCtype = new TypeListBoxControl();
			mhMap.controls.add(listBCtype, {float: 'left', floatIndex: 8});
			filterMonitorType = new ymaps.Monitor(listBCtype.state);
			
			listBCstatus = new StatusListBoxControl();
			mhMap.controls.add(listBCstatus, { float: 'left', floatIndex: 9});
			filterMonitorStatus = new ymaps.Monitor(listBCstatus.state);
			
			filterMonitorType.add('filters', function(filters) {
				filters = ymaps.util.extend({}, filters, 
                                listBCstatus.state.get('filters'), 
                                listBCauthor.state.get('filters'),
                                listBCfixage.state.get('filters'));
				objectManager.setFilter(getFilterFunction(filters));
			});
			filterMonitorStatus.add('filters', function(filters) {
				filters = ymaps.util.extend({}, filters, 
								listBCtype.state.get('filters'), 
								listBCauthor.state.get('filters'),
								listBCfixage.state.get('filters'));
				objectManager.setFilter(getFilterFunction(filters));
			});

        },
        function (error) {
			console.log(error);
        },this);

    var searchControl = mhMap.controls.get('searchControl'),
    author = {},
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
          f.options.balloonContentLayout = 'my#featureBCLayout';
          f.options.preset = "islands#" + ((statSelector.isSelected()) ? type[f.properties.data.type].color : status[f.properties.data.status].color) + "StretchyIcon";
          obj.features.push(f);
        } catch (e) {
          //			console.log('[Ошибка]: ' + e.name + ":" + e.message + "\n" + e.stack);
        }
      }
      objectManager.add(JSON.stringify(obj));
      updateAuthorsList();
    },
    listBIfixage = getNames(fixage).map(FixageListBoxItem),
    listBCfixage = CreateFixageListBoxControl(listBIfixage),
    filterMonitorFixage = new ymaps.Monitor(listBCfixage.state),
    listBIauthor,
    listBCauthor,
    filterMonitorAuthor,
    updateAuthorsList = function() {
      mhMap.controls.remove(listBCauthor);
      listBIauthor = getNames(author).map(AuthorListBoxItem);
      listBCauthor = CreateAuthorListBoxControl(listBIauthor);
      listBCauthor.events.remove(['select', 'deselect']);
      listBCauthor.events.add(['select', 'deselect'], function(e) {
        var listBoxItem = e.get('target');
        var filters = ymaps.util.extend({}, listBCauthor.state.get('filters'));
        filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
        listBCauthor.state.set('filters', filters);
      });
      filterMonitorAuthor = new ymaps.Monitor(listBCauthor.state);
      filterMonitorAuthor.add('filters', function(filters) {
        filters = ymaps.util.extend({}, filters, 
                                    listBCtype.state.get('filters'), 
                                    listBCstatus.state.get('filters'), 
                                    listBCfixage.state.get('filters'));
        objectManager.setFilter(getFilterFunction(filters));
      });
      mhMap.controls.add(listBCauthor, {
        float: 'left',
        floatIndex: 1
      });
    },
    getFilterFunction = function(categories) {
      return function(obj) {
        var r = searchControl.getRequestString();
        var re = new RegExp(r, "i"),
          fa = getDateRange(obj.properties.data.date, fixage),
          a = author[obj.properties.data.moshelper.uid].name,
          t = type[obj.properties.data.type].name,
          s = status[obj.properties.data.status].name,
          f = (r == undefined) ? true : re.test(obj.properties.data.auto_number);
        return categories[a] && categories[t] && categories[s] && categories[fa] && f
      }
    },
	reader = new FileReader(),
	dsSource,
	handleFiles = function() {
	  var file, fileList = this.files;
	  if(fileList.length == 1){
	    file = fileList.item(0);
		if (file.type == "application\/json") {	dsSource = "JSON"; } else {dsSource = "CSV";}
	    reader.readAsText(file);
		}
	},
	handleDataset = function() {
      if (dsSource == "JSON") { dataObj = JSON.parse(reader.result); fillPlacemarks(dataObj, false);}
	  else {CSVparse(reader.result, false);}
      boundMap(mhMap, objectManager.getBounds());
	},
	CSVparse = function(content, clear = true){
		var f, csvObj = Papa.parse(content,{delimiter:";", header:true, fastMode:false});
		if (clear) objectManager.removeAll();
		obj = JSON.parse('{"type": "FeatureCollection","features": []}');
		for (var i of csvObj.data) {
        try {
			author[1] = {"uid":1, "name":"CSV"};
			var coord = i["Координата"].split(","), date = new Date(i["Дата"].replace(/\./g,"-")),
			getStatus = function(csv){
				switch (csv){
					case "Загружается": return 1; break;
					case "Проверяется": return 2; break;
					case "Оштрафован": return 3; break;
					case "На рассмотрении": return 4; break;
					case "Отклонено": return 5; break;
					case "На модерации": return 7; break;
					case "Некачественный материал": return 8; break;
					case "Был зафиксирован ранее": return 9; break;
					case "Несоответствие типа нарушения": return 10; break;
					case "Обжалован": return 11; break;
					default: return 6;
				}
			},
			getType = function(csv){
				switch (csv){
					case "В зоне действия знака «Остановка запрещена»": return 1; break;
					case "В зоне действия знака «Стоянка запрещена»": return 2; break;
					case "Остановка запрещена (желтая линия)": return 3; break;
					case "Контроль оплаты парковки": return 4; break;
					case "На тротуаре": return 5; break;
					case "На пешеходном переходе": return 6; break;
					case "На газоне": return 7; break;
					case "Стоянка в зоне такси": return 9; break;
					case "Стоянка на местах для инвалидов": return 11; break;
					default: return 100;
				}
			};
			f = {"type": "Feature", "id": i["ID"], "geometry": {"type": "Point", "coordinates": [coord[1], coord[0]]}, 
				"properties": {
				"data":{
					"moshelper": {"uid": 1, "name": "CSV", "picture": "" },
					"auto_number": i["Номер авто"],
					"photo": "",
					"status": getStatus(i["Статус"]),
					"type" : getType(i["Вид_нарушения"]),
					"date": date.getTime(),
					"updated": date.getTime(),
					"fined_times": (getStatus(i["Статус"]) == 3)? 1:0,
					"fix_times": 1,
					"address": i["Адрес"]
					}
				}
			};
			  f.properties.balloonContentHeader = type[f.properties.data.type].name + ": <a href=pakpm://" + f.id + ">" + f.properties.data.auto_number.toUpperCase() + "</a>";
			  f.properties.balloonContentBody = status[f.properties.data.status].name + "</br>" + f.properties.data.address+ "</br>" + date.toLocaleString();
			  f.properties.balloonContentFooter = "Автор: " + f.properties.data.moshelper.name;
			  f.properties.clusterCaption = type[f.properties.data.type].name + ": <a href=pakpm://" + f.id + ">" + f.properties.data.auto_number.toUpperCase() + "</a>";
			  f.properties.hintContent = type[f.properties.data.type].name + ": " + status[f.properties.data.status].name;
			  f.properties.iconContent = f.properties.data.auto_number.toUpperCase();
			  f.options = {};
			  f.options.balloonContentLayout = 'my#featureBCLayout';
			  f.options.preset = "islands#" + ((statSelector.isSelected()) ? type[f.properties.data.type].color : status[f.properties.data.status].color) + "StretchyIcon";
			  obj.features.push(f);
			} catch (e) {
          //			console.log('[Ошибка]: ' + e.name + ":" + e.message + "\n" + e.stack);
			}
		}
		objectManager.add(JSON.stringify(obj));
    updateAuthorsList();
	}

  updateAuthorsList();
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

  listBCfixage.events.add(['select', 'deselect'], function(e) {
    var listBoxItem = e.get('target');
    var filters = ymaps.util.extend({}, listBCfixage.state.get('filters'));
    filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
    listBCfixage.state.set('filters', filters);
  });
  filterMonitorFixage.add('filters', function(filters) {
    filters = ymaps.util.extend({}, filters, 
                                listBCtype.state.get('filters'), 
                                listBCauthor.state.get('filters'),
                                listBCstatus.state.get('filters'));
    objectManager.setFilter(getFilterFunction(filters));
  });

  document.getElementById("dataset").addEventListener("change", handleFiles, false);
  reader.addEventListener("loadend", handleDataset, false);

  
  mhMap.geoObjects.add(objectManager);
  mhMap.controls.add(listBCfixage, {
	float: 'left',
	floatIndex: 7
  });
}
});
