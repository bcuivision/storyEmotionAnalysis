var width = 1200;
var height = 800;

var svg = d3.select("#chart-area").append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height);

console.log(document.getElementById("stories").value
);


var paragraphs = [];
var story = document.getElementById("stories").value;
var filepath = "data/"+story+".txt";

let selection = document.querySelector("select");
graph();

selection.addEventListener("change",() =>{
    //graph new story

    console.log(document.getElementById("stories").value);
    story = document.getElementById("stories").value;
    filepath = "data/"+story+".txt";

    $("#svg").empty();
    graph();
});

function graph()
{
    $.get(filepath, function(data) {

        //get story text from txt file
        paragraphs = data.split("\n");
    
        //get rid of whitespace
        for (var i = 0; i< paragraphs.length; i++)
        {
            if(paragraphs[i].length == 0 || paragraphs[i].trim().length == 0)
            {
                paragraphs.splice(i,1);
            }
        }
    
        //get sentiment score for each paragraph using API
        var pScores = [];
    
        for(var i = 0; i< paragraphs.length; i++)
        {
            const settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://text-sentiment.p.rapidapi.com/analyze",
                "method": "POST",
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "X-RapidAPI-Key": "cd78e348d2msh8591b3ea45b071ep1b08c9jsn3be66b6c5d37",
                    "X-RapidAPI-Host": "text-sentiment.p.rapidapi.com"
                },
                "data": {
                    "text": paragraphs[i]
                }
            };
            
            // $.ajax(settings).done(function (response) 
            // {
            //     pScores.push(JSON.parse(response));
            // });
    
            getScore(settings).then(
                function(value){
                    pScores.push(JSON.parse(value));
                }
            );
        }
    
        setTimeout(function(){
    
            var sortedData = new Array(pScores.length);
    
            //sort paragraphs in original story order
            for(index in pScores)
            {
                var p = pScores[index].text;
                var i = paragraphs.indexOf(p);

                var condition = true;

                while(condition)
                {
                    if(typeof(sortedData[i]) == "undefined")
                    {
                        sortedData[i] = pScores[index];
                        condition = false;
                    }
                    else{
                        i= paragraphs.indexOf(p,i+1);
                    }
                }
            }

            var unit = (width-60)/ sortedData.length;

            //axes & labels
            var scaleX = d3.scaleLinear()
                .domain([0, sortedData.length])
                .range([0, width-60]);
            
            var scaleY = d3.scaleLinear()
                .domain([-100, 100])
                .range([height-100, 0]);

            var x_axis = d3.axisBottom()
                .scale(scaleX);

            var y_axis = d3.axisLeft()
                .scale(scaleY);

            svg.append("g")
                .attr("transform", "translate(30, 400)")
                .call(x_axis);

            svg.append("g")
            .attr("transform", "translate(30, 50)")
                .call(y_axis);

            // create a tooltip
            var Tooltip = d3.select("#hover")
                .append("div")
                .style("opacity", 0)
                .attr("class", "tooltip")
                .style("background-color", "rgba(0, 0, 0,.8)")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "15px");
            
            //graph story emotion journey using d3
            var nodes = svg.selectAll("circle")
                .data(sortedData);

            //graph circles
            nodes.enter()
                .append("circle")
                .attr("r", function(d){
                    var radius = unit/6*d.totalLines;

                    if(radius<5)
                    {
                        radius = 5;
                    }
                    else if(radius>unit/2)
                    {
                        radius = unit/2;
                    }

                    return radius;
                })
                .attr("class", "paragraphs")
                .attr("cx",function(d,index)
                {
                    // return unit*index + 30;
                    return scaleX(index) + 30;
                })
                .attr("cy",function(d){
                    var e = 0;
    
                    // console.log(parseFloat(d.neg_percent) / 100);
    
                    if(d.neg > d.pos)
                    {
                        e = parseFloat(d.neg_percent) / 100;
                    }
                    else if(d.neg < d.pos)
                    {
                        e = -1 * parseFloat(d.pos_percent) / 100;
                    }
    
                    return height/2 + ((height/2-50)*e);
                })
                .attr("fill", function(d){

                    var opacity = 0;

                    if(d.neg > d.pos)
                    {
                        opacity = parseFloat(d.neg_percent) / 100;
                        return "rgba(221,131,34,"+opacity+")";
                    }
                    else if(d.neg < d.pos)
                    {
                        opacity = parseFloat(d.pos_percent) / 100;
                        return "rgba(34,124,221,"+opacity+")";
                    }
                    else
                    {
                        return "rgba(133,222,38,.3)";
                    }
                })
                .on("click", function(d)
                {
                    var data = d.path[0].__data__;

                    console.log("clicked");
                })
                .on("mouseover", function(d) 
                {
                    Tooltip
                        .style("opacity", 1);
                    d3.select(this)
                        .style("stroke", "black")
                        .style("opacity", 1)
                })
                .on("mousemove", function(d)
                {
                    var data = d.path[0].__data__;
                    Tooltip.html("Positive Percentage: "+data.pos_percent+"<br>Neutral Percentage: "+data.mid_percent+"<br>Negative Percentage: "+data.neg_percent);
                    // .style("left", (d3.mouse(this)[0]+70) + "px")
                    // .style("top", (d3.mouse(this)[1]) + "px");
                })
                .on("mouseleave", function(d)
                {
                    Tooltip
                        .style("opacity", 0)
                    d3.select(this)
                        .style("stroke", "none")
                        .style("opacity", 0.8);

                });
            
            nodes.exit().remove();

            var temp = document.querySelectorAll("circle");
            var links = [];
    
            // drawing links between nodes
            for(var j=0; j<temp.length-1; j++)
            {
                var l = d3.linkHorizontal()({
                    source: [temp[j].attributes[2].nodeValue, temp[j].attributes[3].nodeValue],
                    target: [temp[j+1].attributes[2].nodeValue, temp[j+1].attributes[3].nodeValue]
                  });

                  links.push(l);
            }

            for(var i = 0; i < links.length; i++)
            {
                svg.append('path')
                  .attr('d', links[i])
                  .attr('stroke', 'black')
                  .attr("stroke-dasharray", "5")
                  .attr('fill', 'none');
            }

            //labels
            svg.append("rect")
                .attr("fill", "rgba(0,0,0,.8)")
                .attr("x", width-65)
                .attr("y", height/2+5)
                .attr("width", 63)
                .attr("height", 25)
                .attr("stroke","black");
                
            svg.append("text")
                .text("Paragraphs")
                .attr("x", width-60)
                .attr("y", height/2+20)
                .attr("id", "xLabel")
                .attr("fill","white");

            svg.append("rect")
                .attr("fill", "rgba(0,0,0,.8)")
                .attr("x", 5)
                .attr("y", 10)
                .attr("width", 103)
                .attr("height", 25)
                .attr("stroke","black");
                
            svg.append("text")
                .text("Sentiment Score (%)")
                .attr("x", 10)
                .attr("y", 25)
                .attr("id", "xLabel")
                .attr("fill","white");

            //keys
            
        }, 1000);
    
     }, 'text');
}

async function getScore(s)
{
    return await $.ajax(s);
}
