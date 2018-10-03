var CreateObjectManager = function(){
	return new ymaps.ObjectManager({
		clusterize: true,
		clusterIconLayout: 'default#pieChart',
		gridSize: 64,
		clusterDisableClickZoom: true,
		clusterOpenBalloonOnClick: true,
		clusterBalloonPanelMaxMapArea: 0,
		clusterBalloonContentLayoutWidth: 400,
		clusterBalloonItemContentLayout: 'mh#featureBCLayout',
		clusterBalloonLeftColumnWidth: 150
	});
},
getDateRange = function (d, fixage){
	var n = Date.now();
	for (var i in fixage){
		var f = n - fixage[i].from, 
		t = n - fixage[i].to;
		if((f > d) && (t < d)) return fixage[i].name;
	}
},
boundMap = function(map, bounds) {
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
},
getNames = function(obj) {
	var a = [];
	for (var i in obj) a.push(obj[i].name);
	return a;
},
_onSelectLBI = function (e) {
	var listBoxItem = e.get('target'),
	filters = ymaps.util.extend({}, this.state.get('filters'));
	filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
	this.state.set('filters', filters);
},
buildFilters = function(filters, filter) {
	filters[filter.data.get('content')] = filter.isSelected();
	return filters;
};

ymaps.modules.define('plugin.GridSizeChanger', [
    'control.ListBox',
    'util.extend',
    'util.augment'
], 
function (provide, ListBox, extend, augment) {
    var GridSizeChanger = function (objectManager) {
			this.objectManager = objectManager;
            GridSizeChanger.superclass.constructor.call(this, {
                data: { 			
					image: 'img/pie-chart.svg',
					content: 'Размер кластера',
					title: 'Размер ячейки кластера - диаграммы'
				},
				items: [
					new ymaps.control.ListBoxItem({data:{content: '64'} , options:{selectOnClick: false}, state:{selected: true}}),
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
					for(var i = 0; i<3; i++){
						this._eventListener = this.get(i).events.group();
						this._eventListener.add(['click'], this._onClickItem, this);
                    }
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
		_onClickItem: function (e) {
			var listBoxItem = e.get('target');
			for(var i = 0; i<3; i++){this.get(i).deselect();}
			this.objectManager.options.set('gridSize', listBoxItem.data.get('content'));
			if(!listBoxItem.isSelected())listBoxItem.select();
		}
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
	StatusTypeSelector = function (objectManager) {
			this.objectManager = objectManager;
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
                    this._eventListener.add(["select","deselect"], this._onSelect, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
			//this._onSelect(); 
		},

		_onSelect: function (e) {
			var color;
			switch(e.originalEvent.type){
				case "select":
					this.data.set("image", 'img/car.svg' );
					this.data.set("content", "По Типу" );
					break;
				case "deselect":
					this.data.set("image", 'img/tick.svg');
					this.data.set("content", "По Статусу");
					break;
				default: console.log(e);
			}
			var om = this.objectManager;
			om.objects.each(function(object) {
				switch(e.originalEvent.type){
					case "select": color = type[object.properties.data.type].color; break;
					case "deselect": color = status[object.properties.data.status].color; break;
					default: console.log(e);
				}
				om.getMap().geoObjects.get(0).objects.setObjectOptions(object.id, {
					preset: "islands#" + color + "StretchyIcon"
				});
			});
			om.clusters.each(function(cluster) {
				om.clusters.setClusterOptions(cluster.id, {clusterIconLayout: ''});
				om.clusters.setClusterOptions(cluster.id, {clusterIconLayout: 'default#pieChart'});
			});
		}
    });
    provide(StatusTypeSelector);
});

ymaps.modules.define('plugin.FileOpenButton', [
    'control.Button',
    'util.extend',
    'util.augment'
], 
function (provide, Button, extend, augment) {
	var FileOpenButton = function () {
            FileOpenButton.superclass.constructor.call(this, {
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
        };
    augment(FileOpenButton, Button, {
        setParent: function (parent) {
            FileOpenButton.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.events.group();
					this._eventListener.removeAll();
                    this._eventListener.add(['mouseup'], this._onClick, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
		_onClick: function (e) {
			if (e.originalEvent.type == "mouseup"){ // trim ghost click event (stopImmediatePropagation doesn't work)
				document.getElementById("dataset").click();
			}
		},
    });
    provide(FileOpenButton);
});

ymaps.modules.define('plugin.TypeListBoxControl', [
    'control.ListBox',
    'util.extend',
    'util.augment'
], 
function (provide, ListBox, extend, augment) {
    var type = SetArrays("type"), 
	listBItype = getNames(type).map(function(title) {
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
    TypeListBoxControl = function () {
            TypeListBoxControl.superclass.constructor.call(this, {
                data: { 			
					image: 'img/car.svg',
					content: 'Типы',
					title: 'Фильтр типов нарушений'
				},
				items: listBItype,
				state: {
					expanded: false,
					filters: listBItype.reduce(buildFilters, {})
				}
            });
        };
    augment(TypeListBoxControl, ListBox, {
        setParent: function (parent) {
            TypeListBoxControl.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.events.group();
                    this._eventListener.add(["select", "deselect"], _onSelectLBI, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
    });
    provide(TypeListBoxControl);
});

ymaps.modules.define('plugin.StatusListBoxControl', [
    'control.ListBox',
    'util.extend',
    'util.augment'
], 
function (provide, ListBox, extend, augment) {
    var status = SetArrays("status"), 
	listBIstatus = getNames(status).map(function(title) {
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
    StatusListBoxControl = function () {
            StatusListBoxControl.superclass.constructor.call(this, {
					data: {
						image: 'img/tick.svg',
						content: 'Статусы',
						title: 'Фильтр статусов фиксаций'
					},
						items: listBIstatus,
						state: {
							expanded: false,
						filters: listBIstatus.reduce(buildFilters, {})
				}
            });
        };
    augment(StatusListBoxControl, ListBox, {
        setParent: function (parent) {
            StatusListBoxControl.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.events.group();
                    this._eventListener.add(["select", "deselect"], _onSelectLBI, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
    });
    provide(StatusListBoxControl);
});

ymaps.modules.define('plugin.FixageListBoxControl', [
    'control.ListBox',
    'util.extend',
    'util.augment'
], 
function (provide, ListBox, extend, augment) {
    var fixage = SetArrays("fixage"), 
	listBIfixage = getNames(fixage).map(function(title) {
		return new ymaps.control.ListBoxItem({
			data: {
				content: title,
			},
			state: {
				selected: true
			}
		});
	}),
    FixageListBoxControl = function () {
            FixageListBoxControl.superclass.constructor.call(this, {
					data: {
						image: 'img/calendar.svg',
						content: 'Возраст',
						title: 'Возраст фиксаций'
					},
						items: listBIfixage,
						state: {
							expanded: false,
						filters: listBIfixage.reduce(buildFilters, {})
				}
            });
        };
    augment(FixageListBoxControl, ListBox, {
        setParent: function (parent) {
            FixageListBoxControl.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.events.group();
                    this._eventListener.add(["select", "deselect"], _onSelectLBI, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
    });
    provide(FixageListBoxControl);
});

ymaps.modules.define('plugin.AuthorListBoxControl', [
    'control.ListBox',
    'util.extend',
    'util.augment'
], 
function (provide, ListBox, extend, augment) {
    var AuthorListBoxControl = function (author) {
		this.listBIauthor = getNames(author).map(function(title) {
		return new ymaps.control.ListBoxItem({
			data: {
				content: title,
			},
			state: {
				selected: true
			}
		});
	});
            AuthorListBoxControl.superclass.constructor.call(this, {
					data: {
						image: 'img/group.svg',
						content: 'Авторы',
						title: 'Фильтр авторов фиксаций'
					},
						items: this.listBIauthor,
						state: {
							expanded: false,
						filters: this.listBIauthor.reduce(buildFilters, {})
				}
            });
        };
    augment(AuthorListBoxControl, ListBox, {
        setParent: function (parent) {
            AuthorListBoxControl.superclass.setParent.call(this, parent);
            if (parent) {
                if (!this._eventListener) {
                    this._eventListener = this.events.group();
                    this._eventListener.add(["select", "deselect"], _onSelectLBI, this);
                }
            } else if (this._eventListener) {this._eventListener.removeAll();}
		},
    });
    provide(AuthorListBoxControl);
});

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
		layoutStorage.add('mh#featureBCLayout', customItemContentLayoutClass);
		provide(customItemContentLayoutClass);
});

// function CreateCustomListBoxItemLayout(){
	// return ymaps.templateLayoutFactory.createClass(
		// "<li><a>{{data.content}}</a></li>"
    // );
// }

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
