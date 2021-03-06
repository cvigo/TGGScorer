var appScorer = angular.module("Scorer", ["MainViewModule", "ngRoute", "ngTouch", "ngAnimate", "ui.bootstrap"]);



appScorer.config(function ($routeProvider /*, $locationProvider*/)
{
    //$locationProvider.html5Mode(true);

    $routeProvider
      .when("/playerView/:tournamentID",
      {
        templateUrl: "views/main.html",
        controller: "MainCtrl"
      })
      .when("/scorerView/:tournamentID",
      {
        templateUrl: "views/scorer.html",
        controller: "MainCtrl"
      })
      .when("/edit/:tournamentID",
      {
        templateUrl: "views/tournament_editor.html",
        controller: "MainCtrl"
      })
      .otherwise(
      {
          templateUrl: "views/tournament_selection.html",
          controller: "MainCtrl"
      });
  });

// JSON dates conversion (got from the server
appScorer.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.defaults.transformResponse.push(function(responseData){
        convertDateStringsToDates(responseData);
        return responseData;
    });
    $httpProvider.defaults.withCredentials = true;
}]);

var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

function convertDateStringsToDates(input) {
    // Ignore things that aren't objects.
    if (typeof input !== "object") return input;

    for (var key in input) {
        if (!input.hasOwnProperty(key)) continue;

        var value = input[key];
        var match;
        // Check for string properties which look like dates.
        if (typeof value === "string" && (match = value.match(regexIso8601))) {
            var milliseconds = Date.parse(match[0])
            if (!isNaN(milliseconds)) {
                input[key] = new Date(milliseconds);
            }
        } else if (typeof value === "object") {
            // Recurse into object
            convertDateStringsToDates(value);
        }
    }
}