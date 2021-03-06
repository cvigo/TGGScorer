/**
 * User: carlosvigo
 * Date: 21/07/13
 * Time: 00:08
 * All communications with server are in this file
 */


var _SERVER = "";


if ( document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 ) // app running locally
{
    _SERVER = "https://tggscorer.appspot.com";
}


var _API_PATH = _SERVER + "/_ah/api/mpscorer";
var _API_VERSION = "v1";

var serverModule = angular.module("BackendModule", ["ngResource"]);


serverModule.factory("Tournament", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID",
              {tournamentID:"@id"});
});


serverModule.factory("Result", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID/result/:matchId",
              {
                  tournamentID:"@tID",
                  matchId:"@id"
              });
});

serverModule.factory("Match", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentID/match/:matchId",
              {
                  tournamentID:"@tID",
                  matchId:"@id"
              });
});

serverModule.makeId = function(length)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

serverModule.getClientId = function()
{
    var clientId = $cookies.clientId;

    if ( !angular.isString(clientId) )
    {
        clientId = this.makeId(10);
        $cookies.clientId = clientId;
    }

    return clientId;
};

serverModule.getChannel = function(tId)
{
    var channel = new Channel({tournamentId:tId, clientId:this.getClientId() });

    channel.$save(
        function(reply)
        {
            return reply;
        },
        function(errMsg)
        {
            return null;
        }
    );
};

serverModule.factory("Channel", function($resource)
{
    return $resource(_API_PATH + "/" + _API_VERSION + "/tournament/:tournamentId/channel_token/:clientId",
                     {tournamentId:"@tournamentId", clientId:"@clientId" });
});
