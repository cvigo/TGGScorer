
var MsgText =
{
    MORETHANPLAYED:"No se pueden llevar más hoyos de ventaja que jugados!!",
    READY :"Preparado",
    WORKING:"Preparado",
    SCORE_SENT:"Marcador enviado!",
    GAMEOVER:"El partido tendría que haber acabado ya!!"
};


var appModule = angular.module("MainViewModule", ["BackendModule"]);

appModule.controller("MainCtrl", ["$scope", "$routeParams", "TournamentMin", "Result", function ($scope, $routeParams, TournamentMin, Result)
{
    //data properties
    $scope.tournamentDataSrv = null; // this will store the tournament data retrieved from the server
    $scope.resultsSrv = []; // this will store de results received from the server
    $scope.playerList = []; // this feeds the players filter in the model
    $scope.groups = [];
/*    $scope.groups = [
        {
            number: 1,
            matches:
                [
                    {leftPlayer: "cvigo", rightPlayer:"Alanch", result:{h:2, r:0, ts:0}},
                    {leftPlayer: "Vampiro", rightPlayer:"Richygbravo", result:{h:1, r:1, ts:0}}
                ]
        },
        {
            number: 2,
            matches:
                [
                    {leftPlayer: "Bastion", rightPlayer:"Axel Foley", result:{h:1, r:1, ts:0}},
                    {leftPlayer: "chuitemo", rightPlayer:"caminero", result:{h:1, r:1, ts:0}}
                ]
        },
        {
            number: 3,
            matches:
                [
                    {leftPlayer: "Action", rightPlayer:"Eduardo Gonzalez", result:{h:1, r:1, ts:0}},
                    {leftPlayer: "Alf", rightPlayer:"Cucaracho", result:{h:1, r:1, ts:0}}
                ]
        },
        {
            number: 4,
            hole: 1,
            matches:
                [
                    {leftPlayer: "MrRayas", rightPlayer:"Roquet", result:{h:1, r:1, ts:0}},
                    {leftPlayer: "Kinki", rightPlayer:"Borja Tostau", result:{h:1, r:1, ts:0}}
                ]
        }
    ];*/
    $scope.rightTeam = "";
    $scope.leftName = "";
    $scope.rightColor = "";
    $scope.leftColor = "";

    // template control properties
    $scope.oneAtATime = false;  //
    $scope.lastMessage = {type:"success", text:MsgText.WORKING};





/**
 * @ngdoc function
 * @name $scope.projectedResult
 * @function
 *
 * @description
 * Calculates the score projection given the current individual match progress.
 *
 * @return {int, int} projected points accumulated by team on the left, projected points accumulated by team on the right
 */
    $scope.projectedResult = function()
    {
        var scoreLeft = 0;
        var scoreRight = 0;
        for (var i=0, len=$scope.groups.length; i<len; ++i)
        {

            for (var j=0, len2=$scope.groups[i].matches.length; j<len2; ++j)
            {
                if ($scope.groups[i].matches[j].result.r < 0 ) {++scoreLeft;}
                else if ($scope.groups[i].matches[j].result.r > 0) {++scoreRight;}
                else {scoreLeft += 0.5; scoreRight += 0.5;}

            }
        }
        return {scoreL:scoreLeft, scoreR:scoreRight};
    }

/**
 * @ngdoc function
 * @name $scope.finalResult
 * @function
 *
 * @description
 * Calculates the points that each team has secured. If a player is "dormie", he is given 0.5
 * (that will be 1 unless he loses all remaining holes)
 *
 * @return {int, int} secured points by team on the left, secured points by team on the right
 */
    $scope.finalResult = function()
    {
        var scoreLeft = 0;
        var scoreRight = 0;
        for (var i=0, len=$scope.groups.length; i<len; ++i)
        {
            for (var j=0, len2=$scope.groups[i].matches.length; j<len2; ++j)
            {
                var remainingHoles = (18 - $scope.groups[i].matches[j].result.h);
                if ( Math.abs( $scope.groups[i].matches[j].result) > remainingHoles  ) // match is done: advantage > holes remaining
                {
                    if ($scope.groups[i].matches[j].result < 0 ) {++scoreLeft;}
                    else {++scoreRight;}
                }
                else if ( Math.abs( $scope.groups[i].matches[j].result) == remainingHoles  ) // check if any player is "dormie" to account for the 1/2 point he assured
                {
                    if ($scope.groups[i].matches[j].result < 0 ) {scoreLeft+=0.5;}
                    else if ($scope.groups[i].matches[j].result > 0) {scoreRight+=0.5;}
                    else {scoreLeft += 0.5; scoreRight += 0.5;}   // match is halved
                }

            }
        }
        return {scoreL:scoreLeft, scoreR:scoreRight};
    }

/**
 * @ngdoc function
 * @name $scope.loadTournament
 * @function
 * @param {long} tournamentId The tournament id
 *
 * @description
 * Loads the tournament data, excepting the results, from the server
 */
    $scope.loadTournament = function(tournamentId)
    {
        $scope.tournamentDataSrv = TournamentMin.get({tournamentID:tournamentId},
            function(tournamentData)
            {
                // get results in a single call
                // Result.query wont't not work because GAE does not return an array. Instead it returns an object that
                // contains a property called "items" which is the array
                Result.get({tournamentID:tournamentId},
                           function(resultsArray)  // success callback
                           {
                               $scope.resultsSrv = resultsArray.items;

                               // results come in the same order than matches in TournamentMin call
                               for (match in $scope.tournamentDataSrv.matches)
                               {
                                   //store the reference to the result, so futures updates to the results object are automatically loaded into the template
                                   $scope.tournamentDataSrv.matches[match].value.result = $scope.resultsSrv[match];
                               }
                               $scope.createGroups();
                           },
                           function(errMsg) //error callback
                           {
                               $scope.lastMessage = {type:"error", text:errMsg.data.error.message};
                           }
                );

                // this is the right location for the following block to make it run in parallel with the Results retrieval from the server
                $scope.rightTeam = tournamentData.rightTeamName;
                $scope.leftName = tournamentData.leftTeamName;

                //TODO: store and retrieve colors in Server
                $scope.rightColor = "";
                $scope.leftColor = "";

                $scope.addPlayers();
            },
            function(errMsg) //error callback
            {
                $scope.lastMessage = {type:"error", text:errMsg.data.error.message};
            }
        );
    }
/**
 * @ngdoc function
 * @name $scope.reloadResults
 * @function
 * @param {long} tournamentId The tournament id
 *
 * @description
 * Loads the tournament results (only results)
 */
    $scope.reloadResults = function()
    {
        Result.get({tournamentID:$routeParams.tournamentID},
            function(resultsArray)  // success callback
            {
                //$scope.resultsSrv = resultsArray.items; // Don't do this, because $scope.resultsSrv would the copied
                //a new array instance, and references to results in $scope.tournamentDataSrv. would be lost
                for (r in resultsArray.items)
                {
                    $scope.resultsSrv[r].r = resultsArray.items[r].r;
                    $scope.resultsSrv[r].h = resultsArray.items[r].h;
                    $scope.resultsSrv[r].ts = resultsArray.items[r].ts;
                }

            },
            function(errMsg) //error callback
            {
                $scope.lastMessage = {type:"error", text:errMsg.data.error.message};
            }
        );
    }

    /**
     * @ngdoc function
     * @name $scope.sendResult
     * @function
     * @param {long} groupNumber The group number as displayed in the template (= array index +1)
     *
     * @description
      * Sends the group results to the Server
     */
    $scope.sendResult = function(groupNumber)
    {
        // GAE endpoints not returning arrays whey they should, really sucks. This crappy code is caused by GAE
        for (var match in $scope.groups[groupNumber-1].matches)
        {
            // THIS WOULD BE THE IDEAL CASE, BUT... $scope.groups[groupNumber-1].matches[match].result.$save();

            var res = new Result({tID:$routeParams.tournamentID, id:$scope.groups[groupNumber-1].matches[match].id});

            res.h = $scope.groups[groupNumber-1].matches[match].result.h;
            res.r = $scope.groups[groupNumber-1].matches[match].result.r;

            res.$save(
                function(reply)
                {
                    $scope.lastMessage = {type:"success", text:MsgText.SCORE_SENT};
                },
                function(errMsg) //error callback
                {
                    $scope.lastMessage = {type:"error", text:errMsg.data.error.message};
                });
        }
    }

    /**
     * @ngdoc function
     * @name $scope.createGroups
     * @function
     *
     * @description
     * creates fourballs groups using the match start time and orderingroup fields
     */
    $scope.createGroups = function()
    {
        $scope.groups = [];

        var lastStartTime = 0;
        var groupIndex = -1;

        $scope.sortMatches();

        for (matchid in $scope.tournamentDataSrv.matches)
        {
            var match = $scope.tournamentDataSrv.matches[matchid].value;

            if (match.startTime > lastStartTime) // is is a new group
            {
                ++groupIndex;
                $scope.groups.push( {number:groupIndex+1, matches:[] } );
                $scope.groups[groupIndex].matches.push(match);
                lastStartTime = match.startTime;
            }
            else
            {
                // push the match w/o increasing the group index
                $scope.groups[groupIndex].matches.push(match);
            }

        }
    }

    /**
     * @ngdoc function
     * @name $scope.sortMatches
     * @function
     *
     * @description
     * sorts the matches by start time then by order in group
     */
    $scope.sortMatches = function()
    {
        $scope.tournamentDataSrv.matches.sort(function(a, b)
                            {
                                if (a.value.startTime < b.value.startTime)
                                    return -1;
                                else if (a.value.startTime > b.value.startTime)
                                    return 1;
                                else
                                {
                                    if (a.value.orderInGroup < b.value.orderInGroup)
                                        return -1;
                                    else if (a.value.orderInGroup > b.value.orderInGroup)
                                        return 1;
                                    else
                                        return 0;
                                }
                            });
    }


/**
 * @ngdoc function
 * @name $scope.initModel
 * @function
 *
 * @description
 * prepares de scorer model, getting data from the server, preparing the groups and the list of players for the filter
 */
    $scope.initModel = function()
    {
        $scope.loadTournament($routeParams.tournamentID);
    }
/**
 * @ngdoc function
 * @name $scope.allPlayers
 * @function
 *
 * @description
 * creates the plain players list from the match groups retrieved from server. Useful to build filters
 */
    $scope.addPlayers = function()
    {
        var match;
        for (match in $scope.tournamentDataSrv.matches)
        {
            $scope.playerList.push($scope.tournamentDataSrv.matches[match].value.leftPlayer);
            $scope.playerList.push($scope.tournamentDataSrv.matches[match].value.rightPlayer);
        }
    }


/**
 * @ngdoc function
 * @name $scope.getGroupHeading
 * @function
 *
 * @param {int} index The group number
 *
 * @description
 * Builds a string containg, for the given group, the player names in the form {player1} vs {player2} - {player3} vs {player4}
 *
 * @return {String} string with the player names
 */
    $scope.getGroupHeading = function(index)
    {
        var ret="";
        for (var i= 0, len=$scope.groups[index].matches.length; i<len; ++i)
        {
            ret += $scope.groups[index].matches[i].leftPlayer + " vs " + $scope.groups[index].matches[i].rightPlayer + " - ";
        }

        return ret;
    }



/**
 * @ngdoc function
 * @name $scope.getScoreText
 * @function
 *
 * @param {int} result if <0 left player ahead, if >0 right player ahead. O all square
 * @param {int} hole last hole played
 *
 * @description
 * Builds a string that represents the current score in a pretty way (1 UP, AS, 2&1, etc)
 *
 * @return {string, bool} pretty score, true if match is resolved
 */
//TODO: define this as Angular filter
    $scope.getScoreText = function(leftPlayer, rightPlayer, result, hole)
    {
        var absResult = Math.abs(result);
        var remaining = 18-hole;

        var headingPlayer = result > 0 ? rightPlayer: leftPlayer;

        if ( absResult > remaining  ) // match is done and no halve possible
        {
            if (remaining > 0) //game over before 18th, display x&y
                return {text:(headingPlayer + " " + absResult + "&" + remaining), finished:true};
            else
                return {text:(headingPlayer + " " + absResult + " UP"), finished:true};
        }
        else // match in progress or halved at 18th
        {
            if (absResult==0) // halved, finished only if at 18th
                return {text:"AS", finished:remaining == 0};
            else
                return {text:(headingPlayer + " " + absResult + " UP"), finished:false};

        }
    }


/**
 * @ngdoc function
 * @name $scope.updateHole
 * @function
 *
 * @param {match} match to update, reference
 * @param {int} amount number of holes to increase/decrease
 *
 * @description
 * updates the last hole played for the given match, keeping the number between 0 and 18, making sure the combination
 * result-hole is consistent
 */
    $scope.updateHole = function(match, amount)
    {
        var updatedMatch = {result:{r:(match.result.r), h:match.result.h+amount}};
        switch ( $scope.validateResult(updatedMatch) )
        {
            case "OK":
                match.result.h = Math.max(0, Math.min(18, match.result.h + amount));
                $scope.lastMessage = {type:"success", text:MsgText.READY};
                break;

            case "ADV TOO BIG": // match should have finished, decreasing hole number???
                $scope.lastMessage = {type:"error", text:MsgText.GAMEOVER};
                break;

            case "ADV BIGGER THAN HOLES PLAYED": // match should have finished, no sense increasing advantage
                $scope.lastMessage = {type:"error", text:MsgText.MORETHANPLAYED};
                break;

        }
    }

/**
 * @ngdoc function
 * @name $scope.updateMatch
 * @function
 *
 * @param {match} match result to update, reference
 * @param {int} amount <0 increases left player advantage, >0 increases right player advantage. 0 makes no update!
 *
 * @description
 * updates the result for the given match, making sure the combination result-hole is consistent
 */
    $scope.updateMatch = function(match, amount)
    {
        var updatedMatch = {result:{r:(match.result.r+amount), h:match.result.h}};
        switch ( $scope.validateResult(updatedMatch) )
        {
            case "OK":
                match.result.r = Math.max(-10, Math.min(10, match.result.r + amount));
                $scope.lastMessage = {type:"success", text:MsgText.READY};
                break;

            case "ADV TOO BIG": // match should have finished, no sense increasing advantage
                $scope.lastMessage = {type:"error", text:MsgText.GAMEOVER};
                break;

            case "ADV BIGGER THAN HOLES PLAYED": // match should have finished, no sense increasing advantage
                $scope.lastMessage = {type:"error", text:MsgText.MORETHANPLAYED};
                break;

        }
    }

/**
 * @ngdoc function
 * @name $scope.validateResult
 * @function
 *
 * @param {match} match result to validate
 *
 * @description
 * checks if the match result is coherent (advantage < = holes played, advantage <= holes to play - 1, etc.
 *
 * @return {string} "OK" or descriptive error code
 */
    $scope.validateResult = function(match)
    {
        var remaining = 18-match.result.h;
        var absScore = Math.abs(match.result.r);

        if ( absScore - remaining > 2 ) // advantage cannot exceed remaining holes in more than 2 (2 UP @18th is ok)
            return "ADV TOO BIG";

        if ( absScore > match.result.h ) // obvious, cannot take 4 in advance if I played 3 holes
            return "ADV BIGGER THAN HOLES PLAYED";

        if ( remaining < 0 )
            return "INVALID HOLE NUMBER";

        return "OK";
    }


  }]);

