/*
 * @Author: ray
 * @Date: 2020-11-26 14:31:16
 * @LastEditTime: 2020-11-27 11:31:21
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
    this.lights = [], this.timers = [], this.models = [];
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
                this.lights.push(model);
            } else if (r.model.indexOf('DJS') >= 0) {
                var model = new TMEarth.TrafficTimer(map3d, options);
                this.timers.push(model);
            } else {
                this.model = new TMEarth.GltfPrimitive(map3d, options);
                this.models.push(model);
            }
        });
        // 更新信号灯状态
        setInterval(() => {
            var time = parseInt(Date.now() / 1000);
            var light = time % 3;
            time %= 1000;
            this.lights.forEach(i => {
                i.setValue(light);
            });
            this.timers.forEach(i => {
                i.setValue(time);
            });
        }, 1000);
    });
}

// 清除
FacilityMgr.prototype.remove = function () {
    if (this.lights) {
        this.lights.forEach(i => i.remove());
    }
    if (this.timers) {
        this.timers.forEach(i => i.remove());
    }
    if (this.models) {
        this.models.forEach(i => i.remove());
    }
}