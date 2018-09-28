ymaps.modules.define('plugin.CustomItemContentLayout', ['templateLayoutFactory', 'layout.storage'],
	function (provide, templateLayoutFactory,layoutStorage) {
        var customItemContentLayoutClass = templateLayoutFactory.createClass(
		'<h2 class=balloon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
		'<div class=balloon_body>' +
		'<p class=balloon_fines>{% if properties.data.fined_times > 0 %}Штрафов: {{ properties.data.fined_times }}{% endif %} Фиксаций: {{ properties.data.fix_times }}</p>' +
		'{{ properties.balloonContentBody|raw }}</div>' +
		'<div class=balloon_footer>{{ properties.balloonContentFooter|raw }}</div>',
			{
				build: function(){
					customItemContentLayoutClass.superclass.build.call(this);
				},
				clear: function () {
					customItemContentLayoutClass.superclass.clear.call(this);
				}
			});
		layoutStorage.add('my#featureBCLayout', customItemContentLayoutClass);
		provide(customItemContentLayoutClass);
});

// function CreateCustomListBoxItemLayout(){
	// return ymaps.templateLayoutFactory.createClass(
		// "<li><a>{{data.content}}</a></li>"
    // );
// }

ymaps.modules.define('plugin.GridSizeChanger', [
    'control.ListBox',
    'util.extend',
    'util.augment'
], 
function (provide, ListBox, extend, augment) {
    var GridSizeChanger = function () {
            GridSizeChanger.superclass.constructor.call(this, {
                data: { 			
					image: 'img/pie-chart.svg',
					content: 'Размер кластера',
					title: 'Размер ячейки кластера - диаграммы'
				},
				items: [
					new ymaps.control.ListBoxItem({data:{content: '64'} , options:{selectOnClick: false} }),
					new ymaps.control.ListBoxItem({data:{content:'128'} , options:{selectOnClick: false} }),
					new ymaps.control.ListBoxItem({data:{content:'256'} , options:{selectOnClick: false} }),
				]
            });
        };
    augment(GridSizeChanger, ListBox, {
        setParent: function (parent) {
            GridSizeChanger.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.get(0).events.group();
                    this._eventListener.add(['click'], this._onClick0, this);
                    this._eventListener = this.get(1).events.group();
                    this._eventListener.add(['click'], this._onClick1, this);
                    this._eventListener = this.get(2).events.group();
                    this._eventListener.add(['click'], this._onClick2, this);
                }
                this._onClick0();
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
        
		_onClick0: function () {
			this.getMap().geoObjects.get(0).options.set('gridSize', this.get(0).data.get('content'));
			if(!this.get(0).isSelected())this.get(0).select();
			this.get(1).deselect();
			this.get(2).deselect();
		},
		_onClick1: function () {
			this.getMap().geoObjects.get(0).options.set('gridSize', this.get(1).data.get('content'));
			this.get(0).deselect();
			if(!this.get(1).isSelected())this.get(1).select();
			this.get(2).deselect();
		},
		_onClick2: function () {
			this.getMap().geoObjects.get(0).options.set('gridSize', this.get(2).data.get('content'));
			this.get(0).deselect();
			this.get(1).deselect();
			if(!this.get(2).isSelected())this.get(2).select();
		},
    });
    provide(GridSizeChanger);
});

ymaps.modules.define('plugin.StatusTypeSelector', [
    'control.Button',
    'util.extend',
    'util.augment'
], 
function (provide, Button, extend, augment) {
	var type = SetArrays("type"),
    status = SetArrays("status"),
	StatusTypeSelector = function () {
            StatusTypeSelector.superclass.constructor.call(this, {
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
            });
        };
    augment(StatusTypeSelector, Button, {
        setParent: function (parent) {
            StatusTypeSelector.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.events.group();
                    this._eventListener.add(["select"], this._onSelect, this)
									   .add(["deselect"], this._onDeselect, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
			this._onSelect();
		},

		_onSelect: function () {
			this.data.set("content", "По Типу" );
			this.data.set("image", 'img/car.svg' );
			var om = this.getMap().geoObjects.get(0);
			om.objects.each(function(object) {
				om.getMap().geoObjects.get(0).objects.setObjectOptions(object.id, {
					preset: "islands#" + type[object.properties.data.type].color + "StretchyIcon"
				});
			});
			this.getMap().geoObjects.get(0).clusters.each(function(cluster) {
				om.clusters.setClusterOptions(cluster.id, {clusterIconLayout: ''});
				om.clusters.setClusterOptions(cluster.id, {clusterIconLayout: 'default#pieChart'});
			});
		},
		_onDeselect: function () {
			this.data.set("content", "По Статусу");
			this.data.set("image", 'img/tick.svg');
			var om = this.getMap().geoObjects.get(0);
			om.objects.each(function(object) {
				om.getMap().geoObjects.get(0).objects.setObjectOptions(object.id, {
					preset: "islands#" + status[object.properties.data.status].color + "StretchyIcon"
				});
			});
			this.getMap().geoObjects.get(0).clusters.each(function(cluster) {
				om.clusters.setClusterOptions(cluster.id, {clusterIconLayout: ''});
				om.clusters.setClusterOptions(cluster.id, {clusterIconLayout: 'default#pieChart'});
			});
		},
    });
    provide(StatusTypeSelector);
});


function CreateObjectManager(){
	return new ymaps.ObjectManager({
		clusterize: true,
		clusterIconLayout: 'default#pieChart',
		gridSize: 64,
		clusterDisableClickZoom: true,
		clusterOpenBalloonOnClick: true,
		clusterBalloonPanelMaxMapArea: 0,
		clusterBalloonContentLayoutWidth: 400,
		clusterBalloonItemContentLayout: 'my#featureBCLayout',
		clusterBalloonLeftColumnWidth: 150
	});
}

function CreateFileOpenButton(){
	return new ymaps.control.Button({
      data: {
        image: 'img/upload.svg',
        content: 'Файл',
        title: 'Отрыть набор данных'
      },
      options: {
		selectOnClick: false,
        maxWidth: [30, 100, 150]
      }
    });
}

function SetArrays(arr){
	switch(arr){
	case "type": return {
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
      },
      100: {
        "name": "Состав не определен",
        "color": "black"
      }
    }; break;
    case "status": return {
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
    }; break;
	case "fixage": return {
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
    };break;
	default: return {};
	}
}

function getNames (obj) {
	var a = [];
	for (var i in obj) a.push(obj[i].name);
	return a;
}

var TypeListBoxItem = function(title) {
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
}

function CreateTypeListBoxControl(listBItype){
	return new ymaps.control.ListBox({
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
    })
}

var StatusListBoxItem = function(title) {
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
}

function CreateTypeListBoxControl(listBIstatus){
	return new ymaps.control.ListBox({
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
    })
}

var FixageListBoxItem = function(title) {
	return new ymaps.control.ListBoxItem({
		data: {
			content: title
		},
		state: {
			selected: true
		}
	});
}

function CreateFixageListBoxControl(listBIfixage){
	return new ymaps.control.ListBox({
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
    })
}

var AuthorListBoxItem = function(title) {
	return new ymaps.control.ListBoxItem({
		data: {
			content: title
		},
		state: {
			selected: true
		}
	});
}

function CreateAuthorListBoxControl(listBIauthor){
	return new ymaps.control.ListBox({
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
	})
}

function getDateRange (d, fixage){
	var n = Date.now();
	for (var i in fixage){
		var f = n - fixage[i].from, 
		t = n - fixage[i].to;
		if((f > d) && (t < d)) return fixage[i].name;
	}
}

var boundMap = function(map, bounds) {
	try {
		map.setBounds(bounds, {
		checkZoomRange: true,
		duration: 500
		}).then(function() {
		// Действие было успешно завершено.
		}, function(err) {
		// Не удалось показать заданный регион
	}, this);
	} catch (e) {}
}
