/*
 * @Author: ray
 * @Date: 2020-11-26 14:31:16
 * @LastEditTime: 2020-11-30 14:42:48
 * @LastEditors: Please set LastEditors
 * @Description: 交通设施管理器
 * @FilePath: \edit-online\examples\js\FacilityMgr.js
 */
function FacilityMgr(map, options) {
    this.map = map;
    this.options = options;
    this.init();
}

FacilityMgr.prototype.init = function () {
    this.lights = new Map(), this.timers = new Map(), this.models = [];
    var modelPath = this.options.modelPath, indexFile = this.options.indexFile;
    Cesium.Resource.fetchJson({
        url: `${modelPath}/${indexFile}`,
    }).then((e) => {
        e.forEach(r => {
            var options = {
                url: `${modelPath}/${r.model}.gltf`,
                position: [r.lng, r.lat, r.altitude],
                rotation: [r.heading, r.pitch, 0],
                translation: [r.translation0, r.translation1, r.translation2],
                scale: r.scale ? r.scale : 1.0,
                prefix: "",
            }
            if (r.model.indexOf('HLD') >= 0) {
                var model = new TMEarth.TrafficLight(map3d, options);
                this.lights.set(r.id, model);
            } else if (r.model.indexOf('DJS') >= 0) {
                var model = new TMEarth.TrafficTimer(map3d, options);
                this.timers.set(r.id, model);
            } else {
                this.model = new TMEarth.GltfPrimitive(map3d, options);
                this.models.push(model);
            }
        });
        // // 更新信号灯状态
        // setInterval(() => {
        //     var time = parseInt(Date.now() / 1000);
        //     var light = time % 3;
        //     time %= 1000;
        //     this.lights.forEach(i => {
        //         i.setValue(light);
        //     });
        //     this.timers.forEach(i => {
        //         i.setValue(time);
        //     });
        // }, 1000);
    });
}

// 更新
FacilityMgr.prototype.update = function (lampStatus) {
    if (!lampStatus || !lampStatus.crossLamp) return;
    lampStatus.crossLamp.forEach(lamp => {
        // 更新红绿灯
        var light = this.lights.get(lamp.groupId);
        if (light && lamp.lampState != undefined) {
            var value = [0, 0, 0], i = 0;
            if ((i = ["R", "Y", "G"].indexOf(lamp.lampState)) >= 0) {
                value[i] = 1;// 亮
            } else if ((i = ["RF", "YF", "GF"].indexOf(lamp.lampState)) >= 0) {
                value[i] = 2;// 闪
            } else if (lamp.lampState == "RY") {
                value = [1, 1, 0];// 红黄亮
            }
            light.setValue(value);
        }
        // 更新计时器
        var timer = this.timers.get(lamp.groupId);
        if (timer && lamp.remainTime) {
            timer.setValue(remainTime);
        }
    });
}

// 清除
FacilityMgr.prototype.remove = function () {
    this.lights.forEach((val, key) => {
        val.remove();
    });
    this.lights.clear();
    this.timers.forEach((val, key) => {
        val.remove();
    });
    this.timers.clear();
    if (this.models) {
        this.models.forEach(i => i.remove());
    }
    this.models.length = 0;
}