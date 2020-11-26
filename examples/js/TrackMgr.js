// 车辆轨迹管理器
function TrackMgr(map3d, options) {
    this.map3d = map3d;
    this.options = options;
    this.popup = undefined;// 车辆信息面板
    this.mapModel = new Map();// 车辆模型集合
    this.config = {
        // 车牌颜色
        plateColor: ['未知', '蓝底白字', '黄底黑字', '白底黑字', '黑底白字', '绿底白字', '渐变绿底黑字', '黄绿双拼底黑字'],
        getPlateColor: (i) => {
            if (i < 0 || i >= this.config.plateColor.length) i = 0;
            return this.config.plateColor[i];
        },
        // 车牌类型
        plateType: ['未知类型', '单层蓝牌', '单层黑牌', '单层黄牌', '双层黄牌', '白色警牌', '白色武警', '个性化车牌', '单层军牌', '双层军牌', '领使馆牌', '港牌', '农用车牌、拖拉机', '澳门牌', '厂内牌', '双层白色武警', '其他类型', '新能源牌', '教练汽车车牌', '挂车车牌'],
        getPlateType: (i) => {
            if (i < 0 || i >= this.config.plateType.length) i = 0;
            return this.config.plateType[i];
        },
        // 车辆类型
        vehicleType: { 0: '未知', 1: '轿车', 2: '货车（大型货车）', 3: '面包车（微面）', 4: '客车', 5: '小货车', 6: 'SUV', 7: '中型客车（轻客、小型客车）', 8: '摩托车', 9: '其他', 10: '越野车', 11: '商务车', 12: '三轮车', 13: '皮卡车', 14: '挂车', 15: '混凝土搅拌车', 16: '罐车', 17: '随车吊', 18: '新能源车', 19: '非机动车', 20: '工程车', 201: '非机动车', 301: '行人' },
        getVehicleType: (i) => {
            return this.config.vehicleType[i] || this.config.vehicleType[0];
        },
        // 车辆颜色
        vehicleColor: {
            0: ['白色', '#ffffff'], 1: ['灰色(银色)', '#77787b'], 2: ['黄色', '#ffd400'], 3: ['粉色', '#ffc0cb'], 4: ['红色', '#ff0000'], 5: ['绿色', '#00ff00'], 6: ['蓝色', '#0000ff'], 7: ['棕色', '#804000'],
            8: ['黑色', '#000000'], 9: ['未知', '#ffffff'], 10: ['紫色', '#8b00ff'], 11: ['橙色', '#f47920'], 12: ['银色', '#e6e8fa'], 13: ['青色', '#008080'], 14: ['金色', '#c37e00'], 15: ['透明', '#000000'], 99: ['其他', '#ffffff']
        },
        getVehicleColor: (i) => {
            return this.config.vehicleColor[i] || this.config.vehicleColor[0];
        },
        // 目标类型
        objectType: ['未知', '机动车', '非机动车', '行人'],
        getObjectType: (i) => {
            if (i < 0 || i >= this.config.objectType.length) i = 0;
            return this.config.objectType[i];
        }
    }
    // 报警半径
    this.maxRadius = 5;
    this.getRadius = function () {
        var time = new Date().getTime() % 1000;
        return time * this.maxRadius / 1000;
    }
}

// 获取模型路径
TrackMgr.prototype.getModelUrl = function (vehicleType) {
    var vehicleType = parseInt(vehicleType);
    if (!this.config.vehicleType[vehicleType]) vehicleType = 0;
    return `${this.options.modelPath}/car${vehicleType}.gltf`;
}

// 创建车辆模型
TrackMgr.prototype.createModel = function (track) {
    var map3d = this.map3d;
    var position = Cesium.Cartesian3.fromDegrees(track.lng, track.lat, 0);
    // this.tk = new TMEarth.TwinklePoint(map3d, { position: position });
    var heading = Cesium.Math.toRadians(track.driveAngle), pitch = 0, roll = 0;
    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
    // 车辆模型      
    var entity = map3d.entities.add({
        position: position,
        orientation: orientation,
        properties: { id: track.trackID },
        model: {
            uri: this.getModelUrl(track.vehicleType),
            minimumPixelSize: 50,
            scale: 0.7,
            maximumScale: 100,
            color: Cesium.Color.fromCssColorString(this.config.getVehicleColor(track.vehicleColor)[1]),
            targetColor: Cesium.Color.fromCartesian4(new Cesium.Cartesian4(0.8431, 0.8431, 0.8431, 1)),//0.6294, 0.6304, 0.6304
        },
        polyline: {
            show: false,
            positions: [],
            material: Cesium.Color.fromCssColorString('#fc7b6c'),
            width: 1
        },
        label: {
            text: track.plateNumber,
            style: Cesium.LabelStyle.FILL,
            fillColor: Cesium.Color.fromCssColorString(track.plateTextColor), //Cesium.Color["RED"],
            backgroundColor: Cesium.Color.fromCssColorString(track.plateBgColor), // new Cesium.Color(0.165, 0.165, 0.165, 0.8),
            showBackground: true,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            font: "15px sans-serif",//"13px Helvetica",
            scale: 1.0,
            eyeOffset: new Cesium.Cartesian3(0.0, 2.0, 0.0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
    });
    entity.track = {
        vehicleType: track.vehicleType,
        vehicleColor: track.vehicleColor,
        plateNumber: track.plateNumber,
        plateTextColor: track.plateTextColor,
        plateBgColor: track.plateBgColor
    }
    return entity;
}

// 判断轨迹是否有效
TrackMgr.prototype.validPath = function (path) {
    if (!path || path.length < 2) return false;
    var p1 = path[0], p2 = path[path.length - 1];
    p1 = p1.items ? p1.items : p1;
    p2 = p2.items ? p2.items : p2;
    p1 = Cesium.Cartesian3.fromDegrees(p1[0], p1[1], 0);
    p2 = Cesium.Cartesian3.fromDegrees(p2[0], p2[1], 0);
    var dist = Cesium.Cartesian3.distance(p1, p2);
    return dist >= 1;
}

// 更新车辆模型
TrackMgr.prototype.updateModel = function (entity, track) {
    var map3d = this.map3d;
    // 更新模型
    if (entity.track.vehicleType != track.vehicleType) {
        entity.model.uri = this.getModelUrl(entity.track.vehicleType = track.vehicleType);
    }
    // 更新位置朝向
    var position = Cesium.Cartesian3.fromDegrees(track.lng, track.lat, 0.0);
    var heading = Cesium.Math.toRadians(track.driveAngle), pitch = 0.0, roll = 0.0;
    var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
    entity.position.setValue(position);
    entity.orientation.setValue(orientation);
    // 更新信息面板
    entity.label.show = entity.picked ? false : true;
    if (!entity.picked) {
        if (entity.track.plateNumber != track.plateNumber) entity.label.text.setValue(entity.track.plateNumber = track.plateNumber);
        if (entity.track.plateTextColor != track.plateTextColor) entity.label.fillColor.setValue(Cesium.Color.fromCssColorString(entity.track.plateTextColor = track.plateTextColor));
        if (entity.track.plateBgColor != track.plateBgColor) entity.label.backgroundColor.setValue(Cesium.Color.fromCssColorString(entity.track.plateBgColor = track.plateBgColor));
    } else {
        this.popup = this.popup || new TMEarth.HtmlElement(map3d, {
            position: Cesium.Cartesian3.fromDegrees(track.lng, track.lat, 0.0),
            contentHtml: "",
            eyeOffset: new Cesium.Cartesian3(0.0, 2.0, 0.0)
        });
        this.popup.contentHtml = this.getTrackPanel(track);
        this.popup.position = Cesium.Cartesian3.fromDegrees(track.lng, track.lat, 0.0);
    }
    // 更新颜色
    if (entity.track.vehicleColor != track.vehicleColor) entity.model.color.setValue(Cesium.Color.fromCssColorString(this.config.getVehicleColor(entity.track.vehicleColor = track.vehicleColor)[1]));
    // 更新轨迹
    if (entity.polyline.show = this.validPath(track.path)) {//if (entity.polyline.show = track.path && track.path.length > 1) {
        var positions = [];
        // var oldLen = track.path.length;
        // track.path = douglasPeucker(track.path, 0.02);
        // console.log(`${oldLen}, ${track.path.length}`);
        track.path.forEach(p => {
            var pos = p.items ? p.items : p;
            positions.push(Cesium.Cartesian3.fromDegrees(pos[0], pos[1], 0));
        });
        entity.polyline.positions = positions;
    }
    // 更新碰撞状态
    var alarm = track.plateNumber.indexOf('事故') >= 0;
    if (alarm && !entity.ellipse) {
        // 报警半径回调
        this.radiusCallback = this.radiusCallback || new Cesium.CallbackProperty(() => {
            return this.getRadius();
        }, false);
        // 报警颜色回调
        this.colorCallback = this.colorCallback || new Cesium.CallbackProperty(() => {
            var alpha = 1 - this.getRadius() / this.maxRadius;
            return Cesium.Color.RED.withAlpha(alpha);
        }, false);
        // 报警效果
        entity.ellipse = {
            semiMinorAxis: this.radiusCallback,
            semiMajorAxis: this.radiusCallback,
            height: 0.5,
            material: new Cesium.ImageMaterialProperty({
                color: this.colorCallback
            }),
            show: true
        }
    }
    if (entity.ellipse) {
        entity.ellipse.show.setValue(alarm);
    }
}

TrackMgr.prototype.printTime = function () {
    var nowTime = Date.now();
    this.prevTime = this.prevTime || nowTime;
    var span = (nowTime - this.prevTime) / 1000.0;
    this.prevTime = nowTime;
    console.log(span);
}

// 更新车辆位置
TrackMgr.prototype.update = function (tracks) {
    var map3d = this.map3d;
    var time = Date.now();
    var popupShow = false;
    tracks.forEach((track) => {
        var entity = null;
        var item = this.mapModel.get(track.trackID);
        if (item) {
            item.time = time;
            entity = item.entity;
            if (entity.picked) popupShow = true;
            this.updateModel(entity, track);
        } else {
            entity = this.createModel(track);
            this.mapModel.set(track.trackID, { time: time, entity: entity });
        }
    });
    // 删除过期数据
    this.mapModel.forEach((value, key) => {
        if (time != value.time) {
            map3d.entities.remove(value.entity);
            this.mapModel.delete(key);
        }
    });
    // 显示/隐藏面板
    if (this.popup) this.popup.show = popupShow;
}

TrackMgr.prototype.getTrackPanel = function (track) {
    return `<div class="vehicle-info-box">
        <div class="vehicle-info-box-title">车辆信息</div>
        <div class="vehicle-info">
            <li>
                <b>车辆号牌</b>
                <span>${track.plateNumber}</span></li>
            </li>
            <li>
                <b>当前时速</b>
                <span>${track.speed + ' km/h'}</span>
            </li>
            <li>
                <b>车牌颜色</b>
                <span>${this.config.getPlateColor(track.plateColor)}</span>
            </li>
            <li>
                <b>行驶距离</b>
                <span>${track.areaDist + ' m'}</span>
            </li>
            <li>
                <b>车牌类型</b>
                <span>${this.config.getPlateType(track.plateType)}</span>
            </li>
            <li>
                <b>当前加速度</b>
                <span>${track.at + 'm/s2'}</span>
            </li>
            <li>
                <b>车辆类型</b>
                <span>${this.config.getVehicleType(track.vehicleType)}</span>
            </li>
            <li>
                <b>等待时间</b>
                <span>${track.delayTime + ' s'}</span>
            </li>
            <li>
                <b>车辆颜色</b>
                <span>${this.config.getVehicleColor(track.vehicleColor)[0]}</span>
            </li>
            <li>
                <b>行程时间</b>
                <span>${track.travelTime + ' s'}</span>
            </li>
            <li>
                <b>车辆品牌</b>
                <span>${track.vehicleBrand}</span>
            </li>
            <li>
                <b>目标类型</b>
                <span>${this.config.getObjectType(track.objectType)}</span>
            </li>
            <li>
                <b>车辆子品牌</b>
                <span>${track.vehicleSubbrand}</span>
            </li>
            <li>
                <b>停车次数</b>
                <span>${track.stops}</span>
            </li>
            <li>
                <b>匹配车道</b>
                <span>${track.matchLaneName}</span>
            </li>
        </div>
    </div>`;
}