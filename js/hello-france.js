var w =600;
var h =600;
var dataset = [];

//Creat SVG element 
var svg = d3.select("body")
		        .append("svg")
		        .attr("width",w)
		        .attr("height",h)

var label = d3.select("body")
              .append("div")
              .attr("id", "placeLabel")
var histo = d3.select("body")
              .append("svg")
              .attr("width",w*2)
              .attr("height",h/2)
              .attr("id", "histo")

d3.tsv("data/france.tsv")
  .row(function (d,i){
  	return {
  		codePostal:+d["Postal Code"],
  		inseeCode :+d.inseeCode,
  		place:d.place,
  		longitude:+d.x,
  		latitude:+d.y*-1,
  		population:+d.population,
  		densite:+d.density
  	};
  })
  .get(function(error,rows) {
  	console.log("Loaded " + rows.length + "rows");
  	x=d3.scale.linear().domain(d3.extent(rows,function(row) {return row.longitude;})).range([0,w]);
    y=d3.scale.linear().domain(d3.extent(rows,function(row) {return row.latitude;})).range([0,h]);
    size_density=d3.scale.pow().domain(d3.extent(rows,function(row) {return row.densite;})).range([0,30]).exponent(0.6);
    bar_density=d3.scale.sqrt().domain(d3.extent(rows,function(row) {return row.densite;})).range([0,30]);
    //couleur_density=d3.scale.linear().domain(d3.extent(rows,function(row) {return row.densite;})).range([0,100]);
    //bin=d3.histogram().domain(d3.extent(rows,function(row) {return row.densite;}));
    if (rows.length > 0) {
  		console.log("First row:" , rows[0])
  		console.log("Last row:" , rows[rows.length-1])
   	}
   	dataset=rows;
        
    draw();
  });


function draw(){
	svg.selectAll()
	   .data(dataset)
	   .enter()
	   .append("circle")
	   //.attr("width", 1)
	   //.attr("height",1)
              .attr("r", function(d) {return size_density(d.densite)})
	            .attr("cx", function(d) {return x(d.longitude) })
	            .attr("cy", function(d) {return y(d.latitude) })
              .style("fill", d3.rgb(50,20,150))
           //function(d) {return couleur_density(d.densite)}
      .on('click', function (d) {
            console.log("Place :" + d.place)
            d3.select(this).style("fill", "green")
            label.text("Le nom de la ville est "+d.place+" (Population: "+d.population+")")
      })
            //d3.select("#placeLabel").text(d.place)
            return
  histo.selectAll()
       .data(dataset)
       .enter()
       .append("div")
           //.attr("class","bar")
           .style("height",function(d) {return bar_density(d.densite)})

	}



