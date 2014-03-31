/**
 * Defines services to hold data shared across the app
 */


var dataModule = angular.module('SharedData', ["BackendModule", "ScorerFilters", "ngCookies"]);

dataModule.service('SharedProperties', function ()
{
    var tournamentDataSrv = null; // this will store the tournament data retrieved from the server
    var resultsSrv = []; // this will store de results received from the server
    var playerList = []; // this feeds the players filter in the model
    var groups = [];   // this creates a visual representation of the matches, sorted and grouped by tee time. It keeps references to the tournamentDataSrv data

    var loadResults = function(id, successCbk, errorCbk)
    {
        //if (tournamentDataSrv == null || tournamentDataSrv.matches == null) return null;

        resultsSrv = Result.get({tournamentID:id},
                                function(resultsArray)  // success callback
                                {
                                    resultsSrv = resultsArray.items;

                                    // results come in the same order than matches in Tournament call
                                    for (match in tournamentDataSrv.matches)
                                    {
                                        //store the reference to the result, so futures updates to the results object are automatically loaded into the template
                                        tournamentDataSrv.matches[match].result = resultsSrv[match];
                                    }
                                    createGroups();
                                    successCbk.call(resultsArray);
                                },
                                errorCbk
        );
    };

    /**
     * @ngdoc function
     * @name $scope.createGroups
     * @function
     *
     * @description
     * creates fourballs groups using the match start time and orderingroup fields
     */
    var createGroups = function()
    {
        groups = [];

        var lastStartTime = 0;
        var groupIndex = -1;

        sortMatches();

        for (matchid in tournamentDataSrv.matches)
        {
            var match = tournamentDataSrv.matches[matchid];

            if (match.startTime > lastStartTime) // is is a new group
            {
                ++groupIndex;
                groups.push( {number:groupIndex+1, startTime:match.startTime, matches:[] } );
                groups[groupIndex].matches.push(match);
                lastStartTime = match.startTime;
            }
            else
            {
                // push the match w/o increasing the group index
                groups[groupIndex].matches.push(match);
            }

        }

    };

    /**
     * @ngdoc function
     * @name sortMatches
     * @function
     *
     * @description
     * sorts the matches by start time then by order in group
     */
    sortMatches = function()
    {
        tournamentDataSrv.matches.sort(function (a, b)
                                       {
                                           if (a.startTime < b.startTime)
                                               return -1;
                                           else if (a.startTime > b.startTime)
                                               return 1;
                                           else
                                           {
                                               if (a.orderInGroup < b.orderInGroup)
                                                   return -1;
                                               else if (a.orderInGroup > b.orderInGroup)
                                                   return 1;
                                               else
                                                   return 0;
                                           }
                                       });
    };

    /**
     * @ngdoc function
     * @name $scope.allPlayers
     * @function
     *
     * @description
     * creates the plain players list from the match groups retrieved from server. Useful to build filters
     */
    addPlayers = function()
    {
        var match;
        for (match in tournamentDataSrv.matches)
        {
            playerList.push($scope.tournamentDataSrv.matches[match].leftPlayer);
            playerList.push($scope.tournamentDataSrv.matches[match].rightPlayer);
        }
    };




    return{
        loadTournament:function(id, successCbk, errorCbk)
        {
            tournamentDataSrv = Tournament.get({tournamentID:id, getResults:false},
                                               function(tournamentData)
                                               {
                                                   loadResults(id, function(resultsData)
                                                   {
                                                       addPlayers();
                                                       successCbk.call({tournament:tournamentData, results:resultsData});
                                                   },
                                                   errorCbk);
                                               },
                                               errorCbk
            );
            return tournamentDataSrv;
        },
        reloadResults:function(successCbk, errorCbk)
        {

        },
        getTournamentDataSrv:function()
        {
            return tournamentDataSrv;
        },
        setTournamentDataSrv:function(value)
        {
            tournamentDataSrv = value;
        },
        getResultsSrv:function()
        {
            return resultsSrv;
        },
        setResultsSrv:function(value)
        {
            resultsSrv = value;
        },
        getPlayerList:function()
        {
            return playerList;
        },
//        setPlayerList:function(value)
//        {
//            playerList = value;
//        },
        getGroups:function()
        {
            return groups;
        },
        setGroups:function(value)
        {
            groups = value;
        }
    };
});
