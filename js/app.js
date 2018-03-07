var currentLocations = [];
var map;
var markers = [];
var infoWindow;
// 创建默认标记样式和高亮标记样式
var defaultIcon = 'http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png';
var highlightedIcon = 'http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png';

var txt=""
function handleErr()
{
    txt = "There was an error on this page.\n\n"
    txt += "You can't load the map successfully!\n\n"
    txt += "Click OK to continue.\n\n"
    alert(txt)
    return true
}

//加载地图API后立即执行该函数
function init(){
    // 创建地图对象
    map = new AMap.Map('map', {
        center: [116.397428, 39.90923],
        zoom: 11,
        mapStyle: 'amap://styles/fresh' // 设置地图样式
    });

    // 设置地图的显示内容
    map.setFeatures(['road','point'])

    // 添加工具条
    map.plugin(["AMap.ToolBar"], function() {
        toolopt = {
            position : 'RT',
            autoPosition : false,//是否自动定位，即地图初始化加载完成后，是否自动定位的用户所在地，在支持HTML5的浏览器中有效，默认为false
        }
        var tool = new AMap.ToolBar(toolopt);
        map.addControl(tool); 
    });

    // 创建默认信息窗体
    infoWindow = new AMap.InfoWindow({offset: new AMap.Pixel(0, -30)});

    // 添加地图标记,标记默认显示
    setMarkers(locations);
}

//创建地图标记
function setMarkers(location){
    for(let i = 0; i < location.length; i++){
        var position = location[i].position;
        var title = location[i].title;

        var marker = new AMap.Marker({
            icon: defaultIcon,
            map: map,
            position: position,
            title: title,
            offset: new AMap.Pixel(-12,-36)
        });
        markers.push(marker);
        markers[i].setMap(map);
        map.setFitView();

        // 为标记设置动画，打开地图时的坠落感
        marker.setAnimation('AMAP_ANIMATION_DROP');
      
        // 设置鼠标移入和移出标记的图标状态
        marker.on('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.on('mouseout', function() {
            this.setIcon(defaultIcon);
        });

        //点击标记显示信息窗口
        marker.on('click', markerClick);
    }
}

//点击按钮时需要有动画
function markerClick(e) {
    var title;
    //点击地图标记
    if (e.target) {
        title = e.target.G.title;
    }else{
        //点击列表选项
        title = e.title;
    }
    $.ajax({
        url: `http://119.29.166.254:9090/api/university/getByUniversityName?name=${title}`,
        type: 'POST',
        headers: { 'Api-User-Agent': 'Example/1.0' },
        dataType: 'json',
        success: function (data) {
            //console.log(data);
            var chooseData = data.filter(function(item){
                                return item.name === title;
                            });
            showUniversityInfo(chooseData);
        },
        error: function (e) {
            alert("The request fails!");
            console.log(e);
        }
    })
}

function showUniversityInfo(l){
    var city = l[0].city;
    var level = l[0].level;
    var name = l[0].name;
    var website = l[0].website;
    var chooseLocation = locations.filter(function(location){
                            if(location.title == name){
                                return location.position;
                            }
                        });
    infoWindow.setContent(
        `
            <div>
                <h4><strong>${name}</strong></h4>
                <p>level: ${level}</p>
                <p>city: ${city}</p>
                website: <a href=${website}>${website}</a>
            </div>
        `);
    infoWindow.open(map, chooseLocation[0].position);
}

//view model
var ViewModel = function(){
    //保留一个指针，保留一个访问外层“this”的方式
    var self = this;

    //侧边栏隐藏与显示
    this.shouldShowBox = ko.observable(true);

    this.show_box = function(){
        self.shouldShowBox(true);
    }

    this.hidden_box = function(){
        self.shouldShowBox(false);
    }

    this.userInput = ko.observable("");

    //监控数组，用于存放列表视图中的地点  
    this.locationList = ko.observableArray();
    locations.forEach(function(locationItem){
        self.locationList.push(locationItem);
    });

    //实时更新当前列表项和地图标记 
    this.currentLocationList = ko.computed(function () {
        return ko.utils.arrayFilter(self.locationList(), function (el, index) {  

            for (var i = 0; i < markers.length; i++) {
                if (markers[i].G.title.indexOf(self.userInput()) > -1) {
                    markers[i].setMap(map);
                }else{
                    markers[i].setMap(null);
                }
            }    

            return el.title.indexOf(self.userInput()) > -1;
        });
    });

    //点击列表选项，显示该标记
    this.showThisLocation = function(clickedItem) {
        console.log(clickedItem);
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].G.title.indexOf(clickedItem.title) > -1) {
                markers[i].setMap(map);

                markers[i].setAnimation('AMAP_ANIMATION_DROP');

                markerClick(clickedItem);
            }else{
                markers[i].setMap(null);
            }
        }
    }
}

ko.applyBindings(new ViewModel());

/*if ($("body")[0].offsetWidth < 450) {
    $("nav").toggleClass("hidden-box");
}*/
