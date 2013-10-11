/**
 * User: carlosvigo
 * Date: 21/07/13
 * Time: 00:08
 * All communications with server are in this file
 */


var _API_PATH = "/_ah/api/mpscorer";
var _API_VERSION = "v1";

var serverModule = angular.module("BackendModule", ["ngResource"]);


serverModule.factory("TournamentFull", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID",
              {tournamentID:"@id"});
});

serverModule.factory("TournamentMin", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID/noresults",
              {tournamentID:"@id"});

});

serverModule.factory("Result", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID/result/:matchId",
              {tournamentID:"@tID", matchId:"@id"});
});

serverModule.factory("Match", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID/match/:matchId",
              {tournamentID:"@tID", matchId:"@id"});
});

