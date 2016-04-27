/**
 * Created by alasd on 17/04/2016.
 */
angular.module('demo',['MathsFunctionSonification'])
.controller('demoCtrl',['formantSynth','subtractiveSynth','$scope',function(formantSynth,subtractiveSynth,$scope){
    $scope.playgroundEquation = "tanh(2*sin(x))/tanh(5)";
    $scope.playgroundOut = {};
    $scope.formant = true;
    $scope.tiltControl = false;

    $scope.xRange = 16;
    $scope.yRange = 4;

    $scope.toggleFormant = function(){
        $scope.formant = !$scope.formant;
    };



    $scope.playtime = 2;
    $scope.playrate= (1/$scope.playtime)*100;
    $scope.$watch('playrate',function(){
        $scope.playtime= 1/($scope.playrate/100);
    });

    //tilt control
    window.addEventListener("deviceorientation", handleOrientation, true);
    function handleOrientation(event){
        if($scope.tiltControl){
            $scope.$apply(function(){
                $scope.playrate = 50 + event.gamma+10;
            });
        }
    }
}]);
