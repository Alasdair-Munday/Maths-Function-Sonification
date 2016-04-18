/**
 * Created by alasd on 06/04/2016.
 */

var app = angular.module('MathsFunctionSonification')

app.directive('radialGauge',function(){
    return{
        restrict : 'E',
        scope: {
            max :'=',
            min : '=',
            value : '=',
            label : '='
        },
        controller : 'gaugeCtrl'
    }
});

app.controller('gaugeCtrl',['$scope','$attrs','$element',function($scope,$attrs,$element){

    var width = 150;
    var height = 150;
    var padding = 10;
    var diameter = width < height ? width - padding :height - padding ;
    var label = $scope.label;
    var fontSize = 10;
    var min = $scope.min = $scope.min | 0;
    var max = $scope.max = $scope.max| 1;
    var centre = (min+max)/2;
    var parent = d3.select($element[0]);


    var arcDef = d3.svg.arc()
        .innerRadius(diameter/2 - padding)
        .outerRadius(diameter/2)
        .startAngle(0);


    var svg = parent.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate("+ width/2 + ","+height/2+")");


    svg.append("circle")
        .attr("r",(diameter - padding)/2)
        .style("fill","#5D8680")
        .style("stroke","#B5C6C4")
        .style("stroke-width", padding);

    var arc = svg.append("path")
        .datum({endAngle:0})
        .attr("class", "rateGauge")
        .attr("d", arcDef)
        .style("fill", "#275952");

    var text = svg.append("text")
        .attr("text-anchor","middle")
        .text(label)
        .style('fill', '#fff');


    function redraw(){
        var angle = ( Math.PI / (max - centre))* ($scope.value - min);
        text.text(label + ": " + $scope.value.toFixed(2));
        arc.transition()
            .duration(100)
            .call(gaugeTween,angle);
    }

    $scope.$watch('value',redraw);

    $scope.$watch('min',function(newValue,oldValue){
        min = newValue;
        centre = (min + max) /2;
    });

    $scope.$watch('max',function(newValue,oldValue){
        max = newValue;
        centre = (min + max) /2;
    });


    function gaugeTween(transition,angle){
        transition.attrTween("d", function(arc){
            var interpolate = d3.interpolate(arc.endAngle,angle);
            return function(t){
                arc.endAngle = interpolate(t);
                return arcDef(arc);
            }
        })
    }

}]);