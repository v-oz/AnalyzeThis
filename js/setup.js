$(window).on('load', function() {
      
ymaps.ready(init);

function init() {
  var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
      '<h2 class=balloon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
      '<div class=balloon_body>' +
      '<p class=balloon_fines>{% if properties.data.fined_times > 0 %}Штрафов: {{ properties.data.fined_times }}{% endif %} Фиксаций: {{ properties.data.fix_times }}</p>' +
      '{{ properties.balloonContentBody|raw }}</div>' +
      '<div class=balloon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    ),
    customListBoxItemLayout = ymaps.templateLayoutFactory.createClass(
      "<li><a>{{data.content}}</a></li>"
    );
  ymaps.layout.storage.add('my#featureBCLayout', customItemContentLayout);
  var dataObj, dataJSON,
    mhMap = new ymaps.Map('map', {
      center: [37.64, 55.76],
      zoom: 10,
      controls: ["rulerControl", "searchControl", "zoomControl", "geolocationControl", "fullscreenControl"]
    }, {
      searchControlProvider: 'yandex#map'
    }),
    objectManager = new ymaps.ObjectManager({
      clusterize: true,
      clusterIconLayout: 'default#pieChart',
      gridSize: 80,
      clusterDisableClickZoom: true,
      clusterOpenBalloonOnClick: true,
      clusterBalloonPanelMaxMapArea: 0,
      clusterBalloonContentLayoutWidth: 400,
      clusterBalloonItemContentLayout: 'my#featureBCLayout',
      clusterBalloonLeftColumnWidth: 150
    }),
    searchControl = mhMap.controls.get('searchControl'),
    statSelector = new ymaps.control.Button({
      data: {
        image: 'img/car.svg',
        content: 'По Типу',
        title: 'По типу нарушения или по статусу'
      },
      state: {
        selected: true
      },
      options: {
        maxWidth: [30, 100, 150]
      }
    }),
    fileOpener = new ymaps.control.Button({
      data: {
        image: 'img/upload.svg',
        content: 'Файл',
        title: 'Отрыть набор данных'
      },
      options: {
		selectOnClick: false,
        maxWidth: [30, 100, 150]
      }
    }),
    author = {},
    type = {
      1: {
        "name": "Остановка",
        "color": "red"
      },
      2: {
        "name": "Стоянка",
        "color": "orange"
      },
      3: {
        "name": "Желтая линия",
        "color": "yellow"
      },
      4: {
        "name": "П-Парковка",
        "color": "violet"
      },
      5: {
        "name": "Тротуар",
        "color": "night"
      },
      6: {
        "name": "Переход",
        "color": "darkBlue"
      },
      7: {
        "name": "Газон",
        "color": "green"
      },
      8: {
        "name": "Велополоса",
        "color": "black"
      },
      9: {
        "name": "Стоянка такси",
        "color": "brown"
      },
      11: {
        "name": "Стоянка для инвалидов",
        "color": "pink"
      }
    },
    status = {
      1: {
        "name": "Загружается",
        "color": "gray"
      },
      2: {
        "name": "Проверяется",
        "color": "gray"
      },
      3: {
        "name": "Оштрафован",
        "color": "red"
      },
      4: {
        "name": "На рассмотрении",
        "color": "orange"
      },
      5: {
        "name": "Отклонено",
        "color": "brown"
      },
      6: {
        "name": "Зарезервировано",
        "color": "black"
      },
      7: {
        "name": "На модерации",
        "color": "olive"
      },
      8: {
        "name": "Некачественный материал",
        "color": "violet"
      },
      9: {
        "name": "Был зафиксирован ранее",
        "color": "green"
      },
      10: {
        "name": "Несоответствие типа нарушения",
        "color": "pink"
      },
      11: {
        "name": "Обжалован",
        "color": "black"
      }
    },
    fixage = {
      1: {
        "name": "До 1 недели",
        "from": 60000, //1000*60 минута
        "to": 504000000 //1000*60*60*24*7 неделя
      },
      2: {
        "name": "От 1 до 2 недель",
        "from": 504000000,
        "to": 1008000000
      },
      3: {
        "name": "От 2 до 4 недель",
        "from": 1008000000,
        "to": 2190000000
      },
      4: {
        "name": "От 1 до 2 месяцев",
        "from": 2190000000,
        "to": 4380000000
      },
      5: {
        "name": "От 2 до 3 месяцев",
        "from": 4380000000,
        "to": 6570000000
      },
      6: {
        "name": "От 3 до 6 месяцев",
        "from": 6570000000,
        "to": 13140000000
      },
      7: {
        "name": "От 6 до 12 месяцев",
        "from": 13140000000,
        "to": 26280000000
      },
      8: {
        "name": "1-2 года",
        "from": 26280000000,
        "to": 52560000000
      },
      9: {
        "name": "2-4 года",
        "from": 52560000000,
        "to": 105120000000
      },
      10: {
        "name": "4-24 года",
        "from": 105120000000,
        "to": 630720000000 // Гыы
      },
    },
    getDataSet = function(dataSetUrl) {
      $.ajax({
        url: dataSetUrl,
        accepts: {
          encoding: 'gzip, deflate'
        }
      }).done(function(data) {
        dataObj = JSON.parse(data);
        fillPlacemarks(dataObj, false);
        boundMap();
      });
    },
    fillPlacemarks = function(obj, clear = true) {
      var path, features = obj.features;
      if (clear) objectManager.removeAll();
      obj.features = [];
      for (var f of features) {
        try {
          author[f.properties.data.moshelper.uid] = f.properties.data.moshelper;
          path = f.properties.data.photo.substring(0, f.properties.data.photo.indexOf("small"));
          f.properties.balloonContentHeader = type[f.properties.data.type].name + ": <a href=mh://" + f.id + ">" + f.properties.data.auto_number.toUpperCase() + "</a>";
          f.properties.balloonContentBody = status[f.properties.data.status].name + "</br><img class='img' src=" + f.properties.data.photo + "></br><img class='img' src=" + path + "/full/number_plate.jpeg" + ">" + ((f.properties.data.type == 1) ? "</br><img class='img' src=" + path + "/small/traffic_sign.jpeg" + ">" : "");
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
    getNames = function(obj) {
      var a = [];
      for (var i in obj) a.push(obj[i].name);
      return a;
    },
    listBItype = getNames(type)
    .map(function(title) {
      return new ymaps.control.ListBoxItem({
        data: {
          content: title,
          color: function() {
            for (var i in type) {
              if (type[i].name == title) return type[i].color
            }
          }
        },
        state: {
          selected: true
        }
      });
    }),
    listBCtype = new ymaps.control.ListBox({
      data: {
        image: 'img/car.svg',
        content: 'Типы',
        title: 'Фильтр типов нарушений'
      },
      items: listBItype,
      state: {
        expanded: false,
        filters: listBItype.reduce(function(filters, filter) {
          filters[filter.data.get('content')] = filter.isSelected();
          return filters;
        }, {})
      }
    }),
    listBIstatus = getNames(status)
    .map(function(title) {
      return new ymaps.control.ListBoxItem({
        data: {
          content: title,
          color: function() {
            for (var i in status) {
              if (status[i].name == title) return status[i].color
            }
          }
        },
        state: {
          selected: true
        }
      });
    }),
    listBCstatus = new ymaps.control.ListBox({
      data: {
        image: 'img/tick.svg',
        content: 'Статусы',
        title: 'Фильтр статусов фиксаций'
      },
      items: listBIstatus,
      state: {
        expanded: false,
        filters: listBIstatus.reduce(function(filters, filter) {
          filters[filter.data.get('content')] = filter.isSelected();
          return filters;
        }, {})
      }
    }),
    listBIfixage = getNames(fixage)
    .map(function(title) {
      return new ymaps.control.ListBoxItem({
        data: {
          content: title
        },
        state: {
          selected: true
        }
      });
    }),
    listBCfixage = new ymaps.control.ListBox({
      data: {
        image: 'img/calendar.svg',
        content: 'Возраст',
        title: 'Возраст фиксаций'
      },
      items: listBIfixage,
      state: {
        expanded: false,
        filters: listBIfixage.reduce(function(filters, filter) {
          filters[filter.data.get('content')] = filter.isSelected();
          return filters;
        }, {})
      }
    }),
    filterMonitorType = new ymaps.Monitor(listBCtype.state),
    filterMonitorStatus = new ymaps.Monitor(listBCstatus.state),
    filterMonitorFixage = new ymaps.Monitor(listBCfixage.state),
    listBIauthor,
    listBCauthor,
    filterMonitorAuthor,
    updateAuthorsList = function() {
      mhMap.controls.remove(listBCauthor);
      listBIauthor = getNames(author)
        .map(function(title) {
          return new ymaps.control.ListBoxItem({
            data: {
              content: title
            },
            state: {
              selected: true
            }
          });
        });
      listBCauthor = new ymaps.control.ListBox({
        data: {
          image: 'img/group.svg',
          content: 'Авторы',
          title: 'Фильтр авторов фиксаций'
        },
        items: listBIauthor,
        state: {
          expanded: false,
          filters: listBIauthor.reduce(function(filters, filter) {
            filters[filter.data.get('content')] = filter.isSelected();
            return filters;
          }, {})
        }
      });
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
    boundMap = function() {
      try {
        mhMap.setBounds(objectManager.getBounds(), {
          checkZoomRange: true,
          duration: 500
        }).then(function() {
          // Действие было успешно завершено.
        }, function(err) {
          // Не удалось показать заданный регион
        }, this);
      } catch (e) {}
    },
    getDateRange = function(d){
      var n = Date.now();
      for (var i in fixage){
        var f = n - fixage[i].from, 
        t = n - fixage[i].to;
        if((f > d) && (t < d)) return fixage[i].name;
      }
    },
    getFilterFunction = function(categories) {
      return function(obj) {
        var r = searchControl.getRequestString();
        var re = new RegExp(r, "i"),
          fa = getDateRange(obj.properties.data.date),
          a = author[obj.properties.data.moshelper.uid].name,
          t = type[obj.properties.data.type].name,
          s = status[obj.properties.data.status].name,
          f = (r == undefined) ? true : re.test(obj.properties.data.auto_number);
        return categories[a] && categories[t] && categories[s] && categories[fa] && f
      }
    },
	inputElement = document.getElementById("dataset"),
	reader = new FileReader(),
	handleFiles = function() {
	  var file, fileList = this.files;
	  if(fileList.length == 1){
	    file = fileList.item(0);
	    reader.readAsText(file);
		}
	},
	handleDataset = function() {
      dataObj = JSON.parse(reader.result);
      fillPlacemarks(dataObj, false);
      boundMap();
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
      boundMap();
    }
  }, this);

  listBCtype.events.add(['select', 'deselect'], function(e) {
    var listBoxItem = e.get('target');
    var filters = ymaps.util.extend({}, listBCtype.state.get('filters'));
    filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
    listBCtype.state.set('filters', filters);
  });
  filterMonitorType.add('filters', function(filters) {
    filters = ymaps.util.extend({}, filters, 
                                listBCstatus.state.get('filters'), 
                                listBCauthor.state.get('filters'),
                                listBCfixage.state.get('filters'));
    objectManager.setFilter(getFilterFunction(filters));
  });

  listBCstatus.events.add(['select', 'deselect'], function(e) {
    var listBoxItem = e.get('target');
    var filters = ymaps.util.extend({}, listBCstatus.state.get('filters'));
    filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
    listBCstatus.state.set('filters', filters);
  });
  filterMonitorStatus.add('filters', function(filters) {
    filters = ymaps.util.extend({}, filters, 
                                listBCtype.state.get('filters'), 
                                listBCauthor.state.get('filters'),
                                listBCfixage.state.get('filters'));
    objectManager.setFilter(getFilterFunction(filters));
  });

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

  statSelector.events.add(["select", "deselect"], function(event) {
    statSelector.data.set("content", (statSelector.isSelected()) ? "По Типу" : "По Статусу");
    objectManager.objects.each(function(object) {
      objectManager.objects.setObjectOptions(object.id, {
        preset: "islands#" + ((statSelector.isSelected()) ? type[object.properties.data.type].color : status[object.properties.data.status].color) + "StretchyIcon"
      });
    });
    objectManager.clusters.each(function(cluster) {
      objectManager.clusters.setClusterOptions(cluster.id, {
        clusterIconLayout: ''
      });
      objectManager.clusters.setClusterOptions(cluster.id, {
        clusterIconLayout: 'default#pieChart'
      });
    });
  }).add(["click"], function(event) {
    statSelector.data.set("image", (statSelector.isSelected()) ? 'img/tick.svg' : 'img/car.svg');
  });

  fileOpener.events.add(["click"], function(event) {
	  inputElement.click();
	});
  inputElement.addEventListener("change", handleFiles, false);
  reader.addEventListener("loadend", handleDataset, false);

  mhMap.geoObjects.add(objectManager);
  mhMap.controls.add(listBCfixage, {
    float: 'left',
    floatIndex: 7
  });
  mhMap.controls.add(listBCtype, {
    float: 'left',
    floatIndex: 8
  });
  mhMap.controls.add(listBCstatus, {
    float: 'left',
    floatIndex: 9
  });
  mhMap.controls.add(statSelector, {
    float: 'left',
    floatIndex: 10
  });
  mhMap.controls.add(fileOpener, {
    float: 'left',
    floatIndex: 11
  });
}
});
