var margin = {top: 20, right: 40, bottom: 30, left: 20},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barWidth = Math.floor(width / 18) - 1;

var x = d3.scale.linear()
    .range([barWidth / 2, width - barWidth / 2]);

var y = d3.scale.linear()
    .range([height, 0]);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-width)
    .tickFormat(function(d) { return Math.round(d / 1e6) + "M"; });

// An SVG element with a bottom-right origin.
var svg = d3.select("#infografico").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// A sliding container to hold the bars by birthyear.
var birthyears = svg.append("g")
    .attr("class", "birthyears");

// A label for the current year.
var title = svg.append("text")
    .attr("class", "title")
    .attr("dy", ".71em")
    .attr("transform", "translate(" + 2*width/3 + ",0)")
    .text(2060);

function ageClass(year,indice){
    // como nossas idades estão indo de 16 a 90,
    // a 17 categoria é a de 70 anos.
    var indice_base = 17;
    var subtrator = (2060 - year)/5;
    if (indice < indice_base - subtrator) {
        return "facultativo";
    } else {
        return "obrigatorio";
    }
}

d3.csv("dados/population.csv", function(error, data) {

  // Convert strings to numbers.
  data.forEach(function(d) {
    d.people = +d.people;
    d.year = +d.year;
    d.age = +d.age;
    d.perc = +d.perc;
  });

  // Compute the extent of the data set in age and years.
  var age0 = d3.min(data, function(d) { return d.age; }),
      age1 = d3.max(data, function(d) { return d.age; }),
      year0 = d3.min(data, function(d) { return d.year; }),
      year1 = d3.max(data, function(d) { return d.year; }),
      year = year1;

  // Update the scale domains.
  x.domain([year1 - age0,year1 - age1]);
  y.domain([0, d3.max(data, function(d) { return d.people; })]);

  perc_data = d3.nest()
      .key(function(d){ return d.year; })
      .key(function(d) { return d.year - d.age; })
      .rollup(function(v) { return v.map(function(d) { return d.perc; }) })
      .map(data);

  // Produce a map from year and birthyear to [male, female].
  people_data = d3.nest()
      .key(function(d) { return d.year; })
      .key(function(d) { return d.year - d.age; })
      .rollup(function(v) { return v.map(function(d) { return d.people; }) })
      .map(data);

  // Add an axis to show the population values.
  svg.append("g")
      .attr("class", "y axis")
      //.attr("transform", "translate(" + width + ",0)")
      .call(yAxis)
    .selectAll("g")
    .filter(function(value) { return !value; })
      .classed("zero", true);

  // Add labeled rects for each birthyear (so that no enter or exit is required).
  var birthyear = birthyears.selectAll(".birthyear")
      .data(d3.range(year0 - age1, year1 + 1, 5))
    .enter().append("g")
      .attr("class", "birthyear")
      .attr("transform", function(birthyear) { return "translate(" + x(birthyear) + ",0)"; });

  // Building the bar for men and women
  birthyear.selectAll("rect")
      .data(function(birthyear) { return people_data[year][birthyear] || [0, 0]; })
    .enter().append("rect")
      .attr("x", -barWidth / 2)
      .attr("width", barWidth)
      .attr("y", y)
      .attr("class", function(v,d,i){ return ageClass(year,i); })
      .attr("height", function(value) { return height - y(value); });

  // Add labels to show birthyear.
  birthyear.append("text")
      .attr("y", height - 4)
      .text(function(birthyear) { return birthyear; });

  // Add label to show the percentage of each age group
  birthyear.append("text")
      .attr("y", height - 14)
      .attr("class","percentage")
      .text(function(birthyear){
          if (perc_data[year][birthyear]) {
              return Math.round(perc_data[year][birthyear][0] + perc_data[year][birthyear][1]) + "%";
          } else {
            return "--";
          }
      });

  // Add labels to show age (separate; not animated).
  svg.selectAll(".age")
    .data(function(){a = d3.range(20, age1 + 1, 5); a.push(16); return a;})
    .enter().append("text")
      .attr("class", "age")
      .attr("x", function(age) { return x(year - age); })
      .attr("y", height + 4)
    .attr("dy", ".71em")
    .text(function(age_label) { return age_label; });

  // Allow the arrow keys to change the displayed year.
  window.focus();
  d3.select(window).on("keydown", function() {
    switch (d3.event.keyCode) {
      case 37: year = Math.max(year0, year - 5); update(); break;
      case 39: year = Math.min(year1, year + 5); update(); break;
    }
  });

  function update() {
    if (!(year in people_data)) return;
    title.text(year);

    birthyears.transition()
        .duration(750)
        .attr("transform", "translate(" + (x(year1) - x(year)) + ",0)");

    birthyear.selectAll("rect")
        .data(function(birthyear) { return people_data[year][birthyear] || [0, 0]; })
      .transition()
        .duration(750)
        .attr("y", y)
        .attr("class", function(v,d,i){ return ageClass(year,i); })
        .attr("height", function(value) { return height - y(value); });

    birthyear.selectAll(".percentage")
      .text(function(birthyear){
          if (perc_data[year][birthyear]) {
              return Math.round(perc_data[year][birthyear][0] + perc_data[year][birthyear][1]) + "%";
          } else {
            return "--";
          }
    });
  }
});

