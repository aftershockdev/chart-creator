let testData: Object[] = [];

async function fetchData() {
  try {
    const response = await fetch(
      "https://api.covid19api.com/live/country/ukraine/status/confirmed"
    );
    const data = await response.json();
    // let slicedData = data.length ? data.slice(0, 1000) : [];
    new ChartsCreator(".main", { data: data, type: "Bar" }).init();
    return data;
  } catch (error) {
    throw new Error(error);
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

  constructor(element: string, options: object) {
    let types: string[] = ["Line", "Bar", "Universal"];
    this.element = element;
    Object.assign(this, this.defaults, options, types);
    this.dataConfigurator();
  }

  private dataConfigurator(): void {
    const configData = this.data.map((el: any) => {
      const format = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
      const obj = {
        date: format(el.Date),
        value: el.Confirmed,
      };
      return obj;
    });
    this.data = configData;
    console.log(this);
  }

  public init(): void {
    const { margin } = this;

    const svg = (this.svg = d3
      .select(this.element)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("overflow", "visible")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`));

    let x = d3
      .scaleTime()
      .domain(d3.extent(this.data, (d: line) => d.date))
      .range([0, this.width]);

    let xAxis = svg
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x));

    let y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d: line) => +d.value)])
      .range([this.height, 0]);

    let yAxis = svg.append("g").call(d3.axisLeft(y));

    this.renderLineChart(x, y);
  }

  private renderLineChart(
    x:
      | d3.ScaleTime<number, number, never>
      | d3.ScaleLinear<number, number, never>,
    y:
      | d3.ScaleTime<number, number, never>
      | d3.ScaleLinear<number, number, never>
  ): void {
    const scaleX = (this.scaleY = d3.scaleTime().range([0, innerWidth]));

    const scaleY = (this.scaleY = d3.scaleLinear().range([innerHeight, 0]));

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
      let x0: any = x.invert(d3.pointer("mousemove", this)[0]),
        i = bisectDate(this.data, x0, 1),
        d0 = this.data[i - 1],
        d1 = this.data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      focus.attr(
        "transform",
        "translate(" + x(d.date) + "," + y(d.value) + ")"
      );
      focus.select(".tooltip-date").text(d.date);
      focus.select(".tooltip-likes").text(d.value + "$");
    }

    function idled() {
      idleTimeout = null;
    }

    function updateChart(): number {
      let extent = d3.selection;
      if (!extent) {
        if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350));
        x.domain([4, 8]);
      } else {
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
  }

  dimensions(): number[] {
    const { margin } = this;
    return [
      this.width - margin.left - margin.right,
      this.height - margin.top - margin.bottom,
    ];
  }

  render(data, options = {}) {}
}
