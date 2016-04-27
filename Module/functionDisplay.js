/**
 * Created by Alasdair Munday on 05/04/2016.
 */
angular.module('MathsFunctionSonification').directive('functionDisplay',function(){
    return {
        restrict:'E',
        templateUrl: 'templates/function_display.html',
        scope:{
            equationString: '=',
            yRange: '=rangeY',
            xRange: '=rangeX',
            output: '=?',
            sonify: '=?',
            formant: '=?',
            tiltControl: '=?',
            playTime: '=?'

        },
        controller:'functionDisplayCtrl'
    };
}).controller('functionDisplayCtrl',['subtractiveSynth','formantSynth','$scope','$element','$attrs',
    function(subtractiveSynth,formantSynthComponent,$scope,$element,$attr){
        var synth  = $scope.formant ? formantSynthComponent : subtractiveSynth;
        $scope.loop=false;
        var fMax = 400;
        var fMin = 100;
        $scope.selected = false;

        $scope.playTime = $scope.playTime | 10;

        var sonify = $scope.sonify = !($scope.sonify == false);

        var axies = {
            xMin : -5,
            xMax : 5,
            yMin : -1,
            yMax : 1
        };

        var eqnString = $scope.equationString;

        var options = {};
        function updateOptions(){
            options = {
                data: [
                    {
                        fn: eqnString,
                    }
                ],
                target: '#'+ $attr.id+ " .function-plot",
                yAxis: {domain: [axies.yMin, axies.yMax]},
                xAxis: {domain: [axies.xMin, axies.xMax]},
                width: 600,
                disableZoom: true
            }
        }

        function sonifyEquation(){
            options.data = [{
                fn: eqnString
            }];

            $scope.graph = functionPlot(options);

            $scope.graph.on('mouseover', function () {
                $scope.$parent.$broadcast('newPlay');
                if(sonify) {
                    $scope.selected=true;
                    synth.start();
                    synth.setNoteRange(fMax, fMin, axies.yMax, axies.yMin)
                }
            });

            $scope.graph.on('mousemove', function (x, y) {
                setX(x);
            });

            $scope.graph.on('mouseout', function () {
                if(!playId && sonify)
                    synth.stop();
            });

        }

        $scope.$watch("equationString", function(newValue, oldValue) {
            eqnString = newValue;
            updateOptions();
            sonifyEquation();
        });

        $scope.$watch("formant",function(value){
            synth.stop();
            synth  = $scope.formant ? formantSynthComponent : subtractiveSynth;
        });



        function setX(x){
            playhead = x;
            var h = 0.001;
            var yVal = Parser.evaluate(eqnString, { x: x  });
            var deltaY = Parser.evaluate(eqnString, {x: x+h});
            var thirdY = Parser.evaluate(eqnString, {x: x-h});

            var firstDerivativeVal = (deltaY - yVal)/ h;
            var secondDerivativeVal = ( deltaY - 2*yVal + thirdY)/ Math.pow(h,2);
            options.annotations = [{x:x, color:"#000000"}];
            functionPlot(options);

            synth.sonifyValues(yVal,firstDerivativeVal,secondDerivativeVal);
            synth.pan((x)/axies.xMax);

            if($scope.output) {
                $scope.$apply(function () {
                    $scope.output.y = yVal;
                    $scope.output.x = x;
                    $scope.output.firstDerivative = firstDerivativeVal;
                    $scope.output.secondDerivative = secondDerivativeVal;
                });
            }
        }

        function setRange(parameterString,value){

            switch(parameterString) {
                case 'x':
                    axies.xMax = value;
                    axies.xMin = -value;
                    break;
                case 'y' :
                    axies.yMax = value;
                    axies.yMin = -value;
                    break;
            }
            updateOptions();
            sonifyEquation();
        }

        $scope.$watch('xRange',function(){
            if($scope.xRange)
                setRange('x',$scope.xRange);
        });

        $scope.$watch('yRange',function(){
            if($scope.yRange)
                setRange('y',$scope.yRange);
        });

        if ($scope.xRange) {
            axies.xMax = $scope.xRange;
            axies.xMin = -$scope.xRange;
        }
        if ($scope.yRange) {
            axies.yMax = $scope.yRange;
            axies.yMin = -$scope.yRange;
        }

        var playhead = axies.xMin;
        var playId = null;
        var sampleRate = 20;
        var reverse = false;
        $scope.play = function(){
            $scope.$parent.$broadcast('newPlay');
            $scope.selected = true;
            playId = setInterval(nextFrame,1/(sampleRate*1000));
            synth.start();
            synth.setNoteRange(fMax,fMin,axies.yMax,axies.yMin);

        };
        $scope.pause = function(){
            clearInterval(playId);
            playId = null;
            synth.stop();
        };

        $scope.stop = function(){
            if(playId)
                $scope.pause();
            $scope.reset();
        };

        $scope.reset = function(){
            playhead = axies.xMin;
        };

        function nextFrame(){

            if(playhead > axies.xMax)
                $scope.loop ? $scope.reset(): $scope.stop();

            setX(playhead);
            playhead += (axies.xMax - axies.xMin)/(sampleRate*$scope.playTime);
        }


        $scope.$on("$destroy", function handler() {
            $scope.stop();
            $scope.selected = false;
        });

        $scope.$on('newPlay', function() {
            $scope.stop();
            $scope.selected = false;
        });



        var previous = false;
        Leap.loop(function(frame){
            if($scope.selected) {
                if (frame.pointables.length) {
                    previous = true;
                    var tool = frame.pointables[0];
                    synth.start();
                    setX(tool.stabilizedTipPosition[0] / 25);
                } else if (previous) {
                    previous = false;
                    synth.stop();
                }
            }
        });

        updateOptions();
        sonifyEquation();

    }]);

