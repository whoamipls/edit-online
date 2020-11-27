/*
 * @Author: ray
 * @Date: 2020-10-20 11:43:31
 * @LastEditTime: 2020-11-27 11:09:11
 * @LastEditors: Please set LastEditors
 * @Description: 事件管理器
 * @FilePath: \TMCrossroads3D\src\js\EventMgr.js
 */
function EventMgr(map3d, options) {
    this.map3d = map3d;
    this.entityPicked = undefined;
    this.init();
}

// 初始化事件
EventMgr.prototype.init = function () {
    var map3d = this.map3d;
    // 左键拾取
    map3d.addEventListener(TMEarth.EventType.LEFT_CLICK, (event) => {
        var entPicked = undefined;
        if (event.picked) {
            var params = { screen: event.position, degrees: event.degrees, cartesian: event.cartesian, properties: {} };
            // 拾取entity对象
            if (event.picked.id instanceof Cesium.Entity) {
                var entity = event.picked.id;
                params.properties = entity.properties.getValue();
                // 设置拾取状态
                entity.picked = !entity.picked;// 车辆被拾取，显示详细信息
                if (entity.picked) entPicked = entity;
            }
            // 拾取3dtiles对象
            else if (event.picked instanceof Cesium.Cesium3DTileFeature) {
                var feature = event.picked;
                if (Cesium.defined(feature) && Cesium.defined(feature.getProperty)) {
                    feature.getPropertyNames().forEach(name => {
                        params.properties[name] = feature.getProperty(name);
                    });
                }
            }
        }
        // 设置选中对象
        if (this.entityPicked && this.entityPicked != entPicked) this.entityPicked.picked = false;
        this.entityPicked = entPicked;
    });
    // 鼠标移动事件
    map3d.addEventListener(TMEarth.EventType.MOUSE_MOVE, (event) => {
        if (event.picked && event.picked.id instanceof Cesium.Entity) {
            map3d._container.style.cursor = "pointer";
        } else {
            map3d._container.style.cursor = "default";
        }
    });
}