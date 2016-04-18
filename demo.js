/**
 * Created by alasd on 17/04/2016.
 */
angular.module('demo',['MathsFunctionSonification'])
.controller('demoCtrl',['formantSynth','subtractiveSynth','$scope',function(formantSynth,subtractiveSynth,$scope){
    $scope.playgroundEquation = "tanh(2*sin(x))/tanh(5)";
    $scope.playgroundOut = {};
    $scope.formant = true;

    $scope.xRange = 1;
    $scope.yRange = 1;

    $scope.toggleFormant = function(){
        $scope.formant = !$scope.formant;
    }
}]);