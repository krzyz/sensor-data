import * as d3 from 'd3'

function drawGraph(svgElement, sensorsData, colors, document, yDomainFromZero = false) {

    let ylabelwidth = 50;

    let svg = d3.select(svgElement),
        margin = {top: 20, right: 20, bottom: 110, left: 40},
        margin2 = {top: 430, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right - (sensorsData.length-1) * ylabelwidth,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;

    let parseDate = d3.timeParse("%s");

    let x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]);

    let ys = [];
    let y2s = [];
    let yAxes = [];
    let valuelines = [];
    let valueline2s = [];

    let stylesTxt = '';

    Array.prototype.forEach.call(sensorsData, (sensor, i) => {
        ys.push(d3.scaleLinear().range([height, 0]));
        y2s.push(d3.scaleLinear().range([height2, 0]));

        if (i === 0) {
            yAxes.push(d3.axisLeft(ys[i]));
        } else {
            yAxes.push(d3.axisRight(ys[i]));
        }

        valuelines.push(
            d3.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return ys[i](d.value); })
        );

        valueline2s.push(
            d3.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y2s[i](d.value); })
        );

        stylesTxt += '\n' + svgElement + ' .axis' + i + ' text { fill: ' + colors[i]+ '; }';
    });

    let style=document.createElement('style');
    style.type='text/css';
    if(style.styleSheet){
        style.styleSheet.cssText=stylesTxt;
    }else{
        style.appendChild(document.createTextNode(stylesTxt));
    }
    document.getElementsByTagName('head')[0].appendChild(style);

    let xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2);

    let brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    let zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.append("defs").append("clipPath")
        .attr("id", "clip_" + svgElement)
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    let focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


    function applyData(sensorsData) {
        Array.prototype.forEach.call(sensorsData, (sensor, i) => {
            let data = sensor.data;

            Array.prototype.forEach.call(data, d => {
                d.date = parseDate(d.date);
                d.value = +d.value;
            });

            if (i === 0) {
                x.domain(d3.extent(data, function(d) { return d.date; }));
                x2.domain(x.domain());

                focus.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                context.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height2 + ")")
                    .call(xAxis2);

                context.append("g")
                    .attr("class", "brush")
                    .call(brush)
                    .call(brush.move, x.range());

                svg.append("rect")
                    .attr("class", "zoom")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(zoom);
            }

            if (yDomainFromZero === true) {
                let max = Number.NEGATIVE_INFINITY;
                Array.prototype.forEach.call(sensorsData, (sensor, i) => {
                    let newMax = d3.max(sensor.data, function(d) {return d.value; });
                    if (newMax > max) {
                        max = newMax;
                    }
                });
                ys[i].domain([0, max]);
            } else {
                ys[i].domain(d3.extent(data, function(d) { return d.value; }));
            }
            y2s[i].domain(ys[i].domain());

            focus.append("path")
                .datum(data)
                .attr("class", "line" + i)
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("clip-path", "url(#clip_" + svgElement + ")")
                .attr("d", valuelines[i]);


            let axDistanceRight = 0;
            let labXLeft = -30;
            if (i > 0 ) {
                axDistanceRight += width + ylabelwidth*(i-1);
                labXLeft = 0;
            }

            focus.append("g")
                .attr("class", "axis axis--y axis"+i)
                .attr("transform", "translate(" + axDistanceRight + " ,0)")
                .call(yAxes[i])

            focus.select(".axis"+i)
                .append("text")
                .attr("x", labXLeft)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(sensor.name + ' [' + sensor.unit + ']');


            context.append("path")
                .datum(data)
                .attr("class", "line" + i)
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("clip-path", "url(#clip_" + svgElement + ")")
                .attr("d", valueline2s[i]);
        });
    }

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        let s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        //focus.select(".line").attr("d", valuelines[0]);
        for (let i = 0; i < sensorsData.length; i++) {
            focus.select(".line"+i).attr("d", valuelines[i]);
        }
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

        function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        let t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        for (let i = 0; i < sensorsData.length; i++) {
            focus.select(".line"+i).attr("d", valuelines[i]);
        }
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    function type(d) {
        d.date = parseDate(d.date);
        d.value = +d.value;
        return d;
    }

    applyData(sensorsData);

    console.log(width);

}

module.exports = {
    drawGraph: drawGraph
};