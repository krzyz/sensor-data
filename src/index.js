import * as d3 from 'd3'

function drawGraph(svgElement, sensorsData) {

    var ylabelwidth = 50;

    var svg = d3.select(svgElement),
        margin = {top: 20, right: 20, bottom: 110, left: 40},
        margin2 = {top: 430, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right - (sensorsData.length-1) * ylabelwidth,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;

    var parseDate = d3.timeParse("%s");

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]);

    var ys = [];
    var y2s = [];
    var yAxes = []
    var valuelines = []
    var valueline2s = []

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
    });

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
    .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    var colors = ["crimson", "steelblue", "green", "slategray", "orchid", "chocolate", "orange"];

    function applyData(sensorsData) {
        Array.prototype.forEach.call(sensorsData, (sensor, i) => {
            var data = sensor.data;

            Array.prototype.forEach.call(data, d => {
                d.date = parseDate(d.date);
                d.value = +d.value;
            });

            if (i == 0) {
                console.log(data);
                x.domain(d3.extent(data, function(d) { return d.date; }));
                console.log(x.domain());
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

            ys[i].domain(d3.extent(data, function(d) { return d.value; }));
            y2s[i].domain(ys[i].domain());

            focus.append("path")
                .datum(data)
                .attr("class", "line" + i)
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("clip-path", "url(#clip)")
                .attr("d", valuelines[i]);


            var axDistanceRight = 0;
            if (i > 0 ) {
                axDistanceRight += width + ylabelwidth*(i-1);
            }

            focus.append("g")
                .attr("class", "axis axis--y axis"+i)
                .attr("transform", "translate(" + axDistanceRight + " ,0)")
                .call(yAxes[i])
                .call(g => g.select(".tick:last-of-type text").clone()
                    .attr("y", -15)
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .text(sensor.unit));


            context.append("path")
                .datum(data)
                .attr("class", "line" + i)
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("clip-path", "url(#clip)")
                .attr("d", valueline2s[i]);
        });
    }

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        //focus.select(".line").attr("d", valuelines[0]);
        for (var i = 0; i < sensorsData.length; i++) {
            focus.select(".line"+i).attr("d", valuelines[i]);
        }
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

        function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        for (var i = 0; i < sensorsData.length; i++) {
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
}

module.exports = {
    drawGraph: drawGraph
};