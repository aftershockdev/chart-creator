let testData: Object[] = [];

async function fetchData() {
  try {
    const response = await fetch(
      "https://api.covid19api.com/total/country/south-africa/status/confirmed?from=2020-03-21T00:00:00Z&to=2021-03-01T00:00:00Z"
    );
    const data = await response.json();
    new ChartsCreator(".main", { data: data, type: "Bar" }).init();
    return data;
  } catch (error) {
    console.log(error);
  }
}
fetchData();

interface ObjectConstructor {
  assign(...objects: Object[]): Object;
}

interface line {
  date: number;
  value: number;
}
interface bar {
  date: number;
  value: string;
}

interface SettingsInterface extends ChartsInterface {
  width: number;
  height: number;
  margin: {
    [key: string]: number;
  };
  axis: boolean;
  axisPadding: number;
  xTicks: number;
  yTicks: number;
  lineCurve: d3.CurveFactoryLineOnly;
}

interface ChartsInterface {
  element: string;
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  scaleY:
    | d3.ScaleTime<number, number, never>
    | d3.ScaleLinear<number, number, never>;
  scaleX:
    | d3.ScaleTime<number, number, never>
    | d3.ScaleLinear<number, number, never>;
}

class ChartsCreator implements ChartsInterface {
  element: string;
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  line: d3.Line<any>;
  scaleY:
    | d3.ScaleTime<number, number, never>
    | d3.ScaleLinear<number, number, never>;
  scaleX:
    | d3.ScaleTime<number, number, never>
    | d3.ScaleLinear<number, number, never>;
  data: object[];
  margin: {
    [key: string]: number;
  };
  width: number;
  height: number;
  axis: boolean;
  axisPadding: number;
  xTicks: number;
  yTicks: number;
  lineCurve: d3.CurveFactoryLineOnly;

  defaults = {
    width: 1300,
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

  constructor(element: string, options: object) {
    let types: string[] = ["Line", "Bar", "Universal"];
    this.element = element;
    Object.assign(this, this.defaults, options, types);
    this.dataConfigurator();
  }

  public init(): void {
    const { margin } = this;
    const svg = (this.svg = d3
      .select(this.element)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("overflow", "visible"));
    this.createBarChart(this.data);
    // this.createLineChart(this.data);
  }

  private dataConfigurator(): void {
    const configData = this.data.map((el: any) => {
      // const format = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
      const obj = {
        date: el.Date,
        value: el.Cases,
      };
      return obj;
    });
    configData.sort((a, b) => b.value - a.value);
    this.data = configData;
  }

  private createLineChart(data: object[] | any): void {
    let x = d3
      .scaleTime()
      .domain(d3.extent(this.data, (d: line) => d.date))
      .range([0, this.width]);

    let xAxis = this.svg
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x));

    let y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d: line) => +d.value)])
      .range([this.height, 0]);

    let yAxis = this.svg.append("g").call(d3.axisLeft(y));

    const scaleX = (this.scaleY = d3.scaleTime().range([0, innerWidth]));

    const scaleY = (this.scaleY = d3.scaleLinear().range([innerHeight, 0]));

    const dateFormatter = d3.timeFormat("%Y/%m/%d");

    this.line = d3
      .line<line>()
      .curve(this.lineCurve)
      .x((data) => scaleX(data.date))
      .y((data) => scaleY(data.value));

    let clip = this.svg
      .append("defs")
      .append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("x", 0)
      .attr("y", 0);

    let bisectDate = d3.bisector((d: line) => d.date).left;

    let brush = d3
      .brushX()
      .extent([
        [0, 0],
        [this.width, this.height],
      ])
      .on("end", updateChart);

    let area = this.svg.append("g").attr("clip-path", "url(#clip)");

    let areaGenerator = d3
      .area()
      .x((d: any) => x(d.date))
      .y0(y(0))
      .y1((d: any) => y(d.value));

    let focus = this.svg
      .append("g")
      .attr("class", "focus")
      .style("display", "none");

    let idleTimeout;

    area
      .append("path")
      .datum(data)
      .attr("class", "myArea")
      .attr("fill", "lightgrey")
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

    function mousemove(): void {
      let x0: any = x.invert(d3.pointer(event, this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      focus.attr(
        "transform",
        "translate(" + x(d.date) + "," + y(d.value) + ")"
      );
      focus.select(".tooltip-date").text(dateFormatter(d.date));
      focus.select(".tooltip-likes").text(d.value);
    }

    function idled() {
      idleTimeout = null;
    }

    function updateChart({
      selection,
    }: d3.D3BrushEvent<typeof selection>): number {
      let extent = selection;
      if (!extent) {
        if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350));
        x.domain([4, 8]);
      } else {
        x.domain([x.invert(extent[0]), x.invert(extent[1])]);
        area.select(".brush").call(brush.move, null);
      }
      xAxis.transition().duration(1000).call(d3.axisBottom(x));
      area
        .select(".myArea")
        .transition()
        .duration(1000)
        .attr("d", areaGenerator);
    }

    this.svg
      .on("dblclick", function (): void {
        x.domain(d3.extent(data, (d: line) => d.date));
        xAxis.transition().call(d3.axisBottom(x));
        area.select(".myArea").transition().attr("d", areaGenerator);
      })
      .on("mouseover", function (): void {
        focus.style("display", null);
      })
      .on("mouseout", function (): void {
        focus.style("display", "none");
      })
      .on("mousemove", mousemove);
  }

  private createBarChart(data: object[] | any): void {
    let maxLength: any = d3.max(data.map((d) => d.date.length));
    let marginOverview = { top: 30, right: 10, bottom: 20, left: 40 };
    let barWidth = maxLength * 5;
    let numBars = Math.round(this.width / barWidth);
    let isScrollDisplayed = barWidth * data.length > this.width;
    let heightOverview = 80 - marginOverview.top - marginOverview.bottom;
    let selectorHeight = 40;

    const dateFormatter = d3.timeFormat("%Y/%m/%d");

    let xscale = d3
      .scaleBand()
      .domain(
        data.slice(0, numBars).map(function (d) {
          return d.date;
        })
      )
      .range([0, this.width]);

    let yscale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data.slice(0, numBars), function (d: bar) {
          return +d.value;
        }),
      ])
      .range([this.height, 0]);

    let diagram = this.svg
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    diagram
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0, " + this.height + ")")
      .call(d3.axisBottom(xscale));

    diagram.append("g").attr("class", "y axis").call(d3.axisLeft(yscale));

    let bars = diagram.append("g");

    bars
      .selectAll("rect")
      .data(data.slice(0, numBars), function (d: bar) {
        return d.date;
      })
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", this.height)
      .attr("height", 0)
      .transition()
      .duration(750)
      .delay(function (d, i) {
        return i * 150;
      })
      .attr("x", function (d: any) {
        return xscale(d.date);
      })
      .attr("y", (d) => yscale(d.value))
      .attr("height", (d: line) => this.height - yscale(d.value))
      .attr("width", xscale.bandwidth() - 3);

    // if (isScrollDisplayed) {
    //   let xOverview = d3
    //     .scaleBand()
    //     .domain(
    //       data.map(function (d) {
    //         return d.label;
    //       })
    //     )
    //     .range([0, this.width]);

    //   let yOverview = d3.scaleLinear().range([heightOverview, 0]);
    //   yOverview.domain(yscale.domain());

    //   let subBars = diagram.selectAll(".subBar").data(data);

    //   subBars
    //     .enter()
    //     .append("rect")
    //     .classed("subBar", true)
    //     .attr({
    //       height: function (d) {
    //         return heightOverview - yOverview(d.value);
    //       },
    //       width: function (d) {
    //         return xOverview.rangeBand();
    //       },
    //       x: function (d) {
    //         return xOverview(d.label);
    //       },
    //       y: function (d) {
    //         return height + heightOverview + yOverview(d.value);
    //       },
    //     });

    //   var displayed = d3
    //     .scaleQuantize()
    //     .domain([0, this.width])
    //     .range(d3.range(data.length));

    //   diagram
    //     .append("rect")
    //     .attr(
    //       "transform",
    //       "translate(0, " + (this.height + this.margin.bottom) + ")"
    //     )
    //     .attr("class", "mover")
    //     .attr("x", 0)
    //     .attr("y", 0)
    //     .attr("height", selectorHeight)
    //     .attr(
    //       "width",
    //       Math.round(parseFloat(numBars * this.width) / data.length)
    //     )
    //     .attr("pointer-events", "all")
    //     .attr("cursor", "ew-resize")
    //     .call(d3.drag().on("drag", display));

    //   this.svg.on("scroll", display);
    // }
    // function display() {
    //   let x = parseInt(d3.select(this).attr("x")),
    //     nx = x + d3.event.dx,
    //     w = parseInt(d3.select(this).attr("width")),
    //     f,
    //     nf,
    //     new_data,
    //     rects;

    //   if (nx < 0 || nx + w > width) return;

    //   d3.select(this).attr("x", nx);

    //   f = displayed(x);
    //   nf = displayed(nx);

    //   if (f === nf) return;

    //   new_data = data.slice(nf, nf + numBars);

    //   xscale.domain(
    //     new_data.map(function (d) {
    //       return d.label;
    //     })
    //   );
    //   diagram.select(".x.axis").call(xAxis);

    //   rects = bars.selectAll("rect").data(new_data, function (d) {
    //     return d.label;
    //   });

    //   label = labels.selectAll(".label").data(new_data, function (d) {
    //     return d.label;
    //   });

    //   rects.attr("x", function (d) {
    //     return xscale(d.label);
    //   });
    //   label.attr("x", function (d) {
    //     return xscale(d.label);
    //   });

    //   rects
    //     .enter()
    //     .append("rect")
    //     .attr("class", "bar")
    //     .attr("x", function (d) {
    //       return xscale(d.label);
    //     })
    //     .attr("y", function (d) {
    //       return yscale(d.value);
    //     })
    //     .attr("width", xscale.rangeBand())
    //     .attr("height", function (d) {
    //       return height - yscale(d.value);
    //     });

    //   label
    //     .enter()
    //     .append("text")
    //     .attr("class", "label")
    //     .attr("x", function (d) {
    //       return xscale(d.label);
    //     })
    //     .style("fill", (d) => {
    //       return d.value ===
    //         d3.max(data, (d) => {
    //           return d.value;
    //         })
    //         ? "red"
    //         : "red";
    //     })
    //     .attr("y", function (d) {
    //       return yscale(d.value) - 5;
    //     })
    //     .text((d) => {
    //       return d.value;
    //     })
    //     .attr("width", xscale.rangeBand())
    //     .attr("height", function (d) {
    //       return height - yscale(d.value);
    //     });

    //   label.exit().remove();
    //   rects.exit().remove();
    // }
  }

  private dimensions(): number[] {
    const { margin } = this;
    return [
      this.width - margin.left - margin.right,
      this.height - margin.top - margin.bottom,
    ];
  }

  render(data, options = {}) {}
}
