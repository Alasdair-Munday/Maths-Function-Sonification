/**
 * Created by alasd on 17/04/2016.
 */
angular.module('demo',['MathsFunctionSonification'])
.controller('demoCtrl',['formantSynth','subtractiveSynth','$scope',function(formantSynth,subtractiveSynth,$scope){
    $scope.playgroundEquation = "tanh(2*sin(x))/tanh(5)";
    $scope.playgroundOut = {};
    $scope.formant = true;

    $scope.xRange = 16;
    $scope.yRange = 4;

    $scope.toggleFormant = function(){
        $scope.formant = !$scope.formant;
    };

    $scope.toggleOrientationSynth = function(){
        subtractiveSynth.toggle();
    };
    $scope.orientation = {};
    

    window.addEventListener("deviceorientation", handleOrientation, true);

    function handleOrientation(event) {
        $scope.$apply(function(){
          $scope.orientation.absolute = event.absolute;
          $scope.orientation.alpha    = event.alpha;
          $scope.orientation.beta     = event.beta;
          $scope.orientation.gamma   = event.gamma;
            subtractiveSynth.sonifyValues(event.alpha/360, event.beta/90, event.gamma/90);
        });

      // Do stuff with the new orientation data
    }
}]);
