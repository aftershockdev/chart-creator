var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var testData = [];
function fetchData() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("https://api.covid19api.com/live/country/ukraine/status/confirmed")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    // let slicedData = data.length ? data.slice(0, 1000) : [];
                    new ChartsCreator(".main", { data: data, type: "Bar" }).init();
                    return [2 /*return*/, data];
                case 3:
                    error_1 = _a.sent();
                    throw new Error(error_1);
                case 4: return [2 /*return*/];
            }
        });
    });
}
fetchData();
var ChartsCreator = /** @class */ (function () {
    function ChartsCreator(element, options) {
        this.defaults = {
            width: 900,
            height: 400,
            margin: {
                top: 15,
                right: 0,
                bottom: 35,
                left: 60,
            },
            axis: true,
            axisPadding: 5,
            xTicks: 5,
            yTicks: 3,
            lineCurve: d3.curveBasis,
        };
        var types = ["Line", "Bar", "Universal"];
        this.element = element;
        Object.assign(this, this.defaults, options, types);
        this.dataConfigurator();
    }
    ChartsCreator.prototype.dataConfigurator = function () {
        var configData = this.data.map(function (el) {
            var format = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
            var obj = {
                date: format(el.Date),
                value: el.Confirmed,
            };
            return obj;
        });
        this.data = configData;
        console.log(this);
    };
    ChartsCreator.prototype.init = function () {
        var margin = this.margin;
        var svg = (this.svg = d3
            .select(this.element)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("overflow", "visible")
            .append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")"));
        var x = d3
            .scaleTime()
            .domain(d3.extent(this.data, function (d) { return d.date; }))
            .range([0, this.width]);
        var xAxis = svg
            .append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(x));
        var y = d3
            .scaleLinear()
            .domain([0, d3.max(this.data, function (d) { return +d.value; })])
            .range([this.height, 0]);
        var yAxis = svg.append("g").call(d3.axisLeft(y));
        this.renderLineChart(x, y);
    };
    ChartsCreator.prototype.renderLineChart = function (x, y) {
        var scaleX = (this.scaleY = d3.scaleTime().range([0, innerWidth]));
        var scaleY = (this.scaleY = d3.scaleLinear().range([innerHeight, 0]));
        this.line = d3
            .line()
            .curve(this.lineCurve)
            .x(function (data) { return scaleX(data.date); })
            .y(function (data) { return scaleY(data.value); });
        var clip = this.svg
            .append("defs")
            .append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("x", 0)
            .attr("y", 0);
        var bisectDate = d3.bisector(function (d) { return d.date; }).left;
        var brush = d3
            .brushX()
            .extent([
            [0, 0],
            [this.width, this.height],
        ])
            .on("end", updateChart);
        var area = this.svg.append("g").attr("clip-path", "url(#clip)");
        var areaGenerator = d3
            .area()
            .x(function (d) { return x(d.date); })
            .y0(y(0))
            .y1(function (d) { return y(d.value); });
        var focus = this.svg
            .append("g")
            .attr("class", "focus")
            .style("display", "none");
        var idleTimeout;
        area
            .append("path")
            .datum(this.data)
            .attr("class", "myArea")
            .attr("fill", "red")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("d", areaGenerator);
        area.append("g").attr("class", "brush").call(brush);
        focus.append("circle").attr("r", 4).attr("fill", "grey");
        focus
            .append("rect")
            .attr("class", "tooltip")
            .attr("width", 100)
            .attr("height", 50)
            .attr("fill", "grey")
            .attr("x", 10)
            .attr("y", -22)
            .attr("rx", 4)
            .attr("ry", 4);
        focus
            .append("text")
            .attr("class", "tooltip-date")
            .attr("x", 30)
            .attr("y", 20);
        focus
            .append("text")
            .attr("class", "tooltip-likes")
            .attr("x", 30)
            .attr("y", 0);
        function mousemove() {
            var x0 = x.invert(d3.pointer("mousemove", this)[0]), i = bisectDate(this.data, x0, 1), d0 = this.data[i - 1], d1 = this.data[i], d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
            focus.select(".tooltip-date").text(d.date);
            focus.select(".tooltip-likes").text(d.value + "$");
        }
        function idled() {
            idleTimeout = null;
        }
        function updateChart() {
            var extent = d3.selection;
            if (!extent) {
                if (!idleTimeout)
                    return (idleTimeout = setTimeout(idled, 350));
                x.domain([4, 8]);
            }
            else {
                x.domain([x.invert(extent[0]), x.invert(extent[1])]);
                area.select(".brush").call(brush.move, null);
            }
            this.xAxis.transition().duration(1000).call(d3.axisBottom(x));
            area
                .select(".myArea")
                .transition()
                .duration(1000)
                .attr("d", areaGenerator);
        }
        this.svg
            // .on("dblclick", function (): any {
            //   x.domain(d3.extent(this.data, (d: line) => d.date));
            //   this.xAxis.transition().call(d3.axisBottom(x));
            //   area.select(".myArea").transition().attr("d", areaGenerator);
            // })
            .on("mouseover", function () {
            focus.style("display", null);
        })
            .on("mouseout", function () {
            focus.style("display", "none");
        })
            .on("mousemove", mousemove);
    };
    ChartsCreator.prototype.dimensions = function () {
        var margin = this.margin;
        return [
            this.width - margin.left - margin.right,
            this.height - margin.top - margin.bottom,
        ];
    };
    ChartsCreator.prototype.render = function (data, options) {
        if (options === void 0) { options = {}; }
    };
    return ChartsCreator;
}());
