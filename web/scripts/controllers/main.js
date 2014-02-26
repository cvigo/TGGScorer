
var MsgText =
{
    MORETHANPLAYED:"No se pueden llevar más hoyos de ventaja que jugados!!",
    READY :"Preparado",
    WORKING:"Preparado",
    SCORE_SENT:"Marcador enviado!",
    GAMEOVER:"El partido tendría que haber acabado ya!!"
};

var alertTimeout = 3000;


var appModule = angular.module("MainViewModule", ["BackendModule", "ScorerFilters", "ngCookies"]);

appModule.controller("MainCtrl",
                     ["$scope",
                         "$routeParams",
                         "$window",
                         "$timeout",
                         "$animate",
                         "$cookies",
                         "$http",
                         "Tournament",
                         "Result",
                         function (
                             $scope,
                             $routeParams,
                             $window,
                             $timeout,
                             $animate,
                             $cookies,
                             $http,
                             Tournament,
                             Result
                         )
{
    //data properties
    $scope.tournamentDataSrv = null; // this will store the tournament data retrieved from the server
    $scope.resultsSrv = []; // this will store de results received from the server
    $scope.playerList = []; // this feeds the players filter in the model
    $scope.groups = [];   // this creates a visual representation of the matches, sorted and grouped by tee time. It keeps references to the tournamentDataSrv data
    $scope.refreshing = "null";
    $scope.tobeRemoved = [];

    $scope.frequentTeams = ["Cosacos", "Bucaneros", "Corsarios", "Filibusteros"];

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

    // template control properties
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
                if ( Math.abs( $scope.groups[i].matches[j].result.r) > remainingHoles  ) // match is done: advantage > holes remaining
                {
                    if ($scope.groups[i].matches[j].result.r < 0 ) {++scoreLeft;}
                    else {++scoreRight;}
                }
                else if ( Math.abs( $scope.groups[i].matches[j].result.r) == remainingHoles  ) // check if any player is "dormie" to account for the 1/2 point he assured
                {
                    if ($scope.groups[i].matches[j].result.r < 0 ) {scoreLeft+=0.5;}
                    else if ($scope.groups[i].matches[j].result.r > 0) {scoreRight+=0.5;}
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
 * @param {number} tournamentId The tournament id
 *
 * @description
 * Loads the tournament data, excepting the results, from the server
 */
    $scope.loadTournament = function(tournamentId)
    {
        $scope.tournamentDataSrv = Tournament.get({tournamentID:tournamentId, getResults:false},
            function(tournamentData)
            {
                // get results in a single call
                // Result.query wont't not work because GAE does not return an array. Instead it returns an object that
                // contains a property called "items" which is the array
                Result.get({tournamentID:tournamentId},
                           function(resultsArray)  // success callback
                           {
                               $scope.resultsSrv = resultsArray.items;

                               // results come in the same order than matches in Tournament call
                               for (match in $scope.tournamentDataSrv.matches)
                               {
                                   //store the reference to the result, so futures updates to the results object are automatically loaded into the template
                                   $scope.tournamentDataSrv.matches[match].result = $scope.resultsSrv[match];
                               }
                               $scope.createGroups();
                           },
                           function(errMsg) //error callback
                           {
                               $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                           }
                );


                //TODO: store and retrieve colors in Server

                // this is the right location for the following block to make it run in parallel with the Results retrieval from the server
                $scope.addPlayers();
            },
            function(errMsg) //error callback
            {
                $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
            }
        );
    }
/**
 * @ngdoc function
 * @name $scope.reloadResults
 * @function
 *
 * @description
 * Loads the tournament results (only results)
 */
    $scope.reloadResults = function()
    {
        $scope.refreshing = "rotating"; // this applies "rotating" class to the refresh button

        Result.get({tournamentID:$routeParams.tournamentID},
            function(resultsArray)  // success callback
            {
                $scope.refreshing = "null";
                angular.forEach(resultsArray.items, function (result, index)
                {
                    //we can trust TS, as the server does not write POSTs that do not actually send a different hole or result than the ones already stored
                    // this if is just used to trigger or not trigger the annimations in the scorer screen. Results are always reloaded
                    if ( ($scope.resultsSrv[index].ts == null && result.ts != null) || $scope.resultsSrv[index].ts < result.ts) //TS
                    {
                        $scope.markAsChanged($scope.resultsSrv[index].id);

                        $timeout(function () // give some time to the animations before updating the numbers
                                 {
                                     //$scope.resultsSrv = resultsArray.items; // Don't do this, because $scope.resultsSrv would the copied
                                     //a new array instance, and references to results in $scope.tournamentDataSrv. would be lost
                                     $scope.resultsSrv[index].r = result.r; // this also makes $scope.tournamentDataSrv.matches[index].result.r = result.r etc...
                                     $scope.resultsSrv[index].h = result.h;
                                     $scope.resultsSrv[index].ts = result.ts;
                                 },
                                 2000
                        );
                    }
                    else
                    {
                        // Results are always reloaded regardless of the timestamps
                        $scope.resultsSrv[index].r = result.r;
                        $scope.resultsSrv[index].h = result.h;
                        $scope.resultsSrv[index].ts = result.ts;
                    }

                });
            },
            function(errMsg) //error callback
            {
                $scope.refreshing = "null";
                $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
            }

        );
    }

    /**
     * @ngdoc function
     * @name $scope.markAsChanged
     * @param {number} matchId Match ID number to be marked as modified
     * @function
     *
     * @description
     * Animates the match row for a nice result update
     */
    $scope.markAsChanged = function(matchId)
    {
        $("#match_desktop_"+matchId).addClass("ng-hide-add");
        $("#match_mobile_"+matchId).addClass("ng-hide-add");
        $timeout(function()
                 {
                     $("#match_desktop_"+matchId).removeClass("ng-hide-add");
                     $("#match_desktop_"+matchId).addClass("ng-hide-remove");
                     $("#match_mobile_"+matchId).removeClass("ng-hide-add");
                     $("#match_mobile_"+matchId).addClass("ng-hide-remove");
                     $timeout(function()
                              {
                                  $("#match_desktop_"+matchId).removeClass("ng-hide-remove");
                                  $("#match_mobile_"+matchId).removeClass("ng-hide-remove");
                              },
                              2000
                     );
                 },
                 2000
        );
    }

    /**
     * @ngdoc function
     * @name $scope.sendResult
     * @function
     * @param {number} groupNumber The group number as displayed in the template (= array index +1)
     * @param {Object event} DOM element that fired the event
     *
     * @description
      * Sends the group results to the Server
     */
    $scope.sendResult = function(groupNumber, event)
    {
        var btn = $(event.srcElement);
        btn.button("loading");
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
                    //$("#alertPanel").show();
                    btn.button("sent");
                    $timeout(function () {btn.button("reset")}, 2000);
                },
                function(errMsg) //error callback
                {
                    $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                    //$("#alertPanel").show();
                    btn.button("error");
                    $timeout(function () {btn.button("reset")}, 2000);
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
            var match = $scope.tournamentDataSrv.matches[matchid];

            if (match.startTime > lastStartTime) // is is a new group
            {
                ++groupIndex;
                $scope.groups.push( {number:groupIndex+1, startTime:match.startTime, matches:[] } );
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
        $scope.passKey = $cookies.passKey;
        $scope.setPassKeyHeader();
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
            $scope.playerList.push($scope.tournamentDataSrv.matches[match].leftPlayer);
            $scope.playerList.push($scope.tournamentDataSrv.matches[match].rightPlayer);
        }

        $('input.typeahead-players').typeahead({
                                                   name: 'players',
                                                   local: $scope.playerList
                                               });

    }


/**
 * @ngdoc function
 * @name $scope.getGroupHeading
 * @function
 * @param {number} index The group number
 * @description
 * Builds a string containg, for the given group, the player names in the form {player1} vs {player2} - {player3} vs {player4}
 * @returns {String} string with the player names
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
 * @param {String} leftPlayer Left player name
 * @param {String} rightPlayer Right player name
 * @param {number} result if <0 left player ahead, if >0 right player ahead. O all square
 * @param {number} hole last hole played
 *
 * @description
 * Builds a string that represents the current score in a pretty way (1 UP, A/S, 2&1, etc)
 *
 * @returns {string, bool} pretty score, true if match is resolved
 */
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
                return {text:"A/S", finished:hole == 18};
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
 * @param {number} amount number of holes to increase/decrease
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
                $scope.displayAlertMessage("warning", MsgText.GAMEOVER, alertTimeout);
                break;

            case "ADV BIGGER THAN HOLES PLAYED": // match should have finished, no sense increasing advantage
                $scope.displayAlertMessage("warning", MsgText.MORETHANPLAYED, alertTimeout);
                break;

        }
    }

/**
 * @ngdoc function
 * @name $scope.putMatch
 * @function
 *
 * @param {match} match result to update, reference
 * @param {number} amount <0 increases left player advantage, >0 increases right player advantage. 0 makes no update!
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
                $scope.displayAlertMessage("warning", MsgText.GAMEOVER, alertTimeout);

        break;

            case "ADV BIGGER THAN HOLES PLAYED": // match should have finished, no sense increasing advantage
                $scope.displayAlertMessage("warning", MsgText.MORETHANPLAYED, alertTimeout);
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
 * @returns {string} "OK" or descriptive error code
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


    /**
     * @ngdoc function
     * @name $scope.getLeadingTeamName
     * @function
     *
     * @param {match} the match
     *
     * @description
     * Returns the team name of the player who is ahead in the match
     *
     * @return {string} Team name, or "allsquare" if the match is AS
     */
    $scope.getLeadingTeamName = function(match)
    {
        if (match.result.r > 0)
            return $scope.tournamentDataSrv.rightTeamName;
        else if (match.result.r < 0)
            return $scope.tournamentDataSrv.leftTeamName;
        else
        return "allsquare";

    }

    /**
     * @ngdoc function
     * @name $scope.displayAlertMessage
     * @function
     *
     * @param {string} type message type (info, danger, warning, success)
     * @param {String} text message text
     * @param {number} timeOut message box will hide after timeOut in miliseconds. Pass 0 to keep it
     *
     * @description
     * Returns the team name of the player who is ahead in the match
     *
     */
    $scope.displayAlertMessage = function(type, text, timeOut)
    {
        if ($scope.alertTimeout != null)
        {
            $timeout.cancel($scope.alertTimeout);
        }

        $scope.alertVisible = true;
        //$window("#alertPanel").dis
        $scope.lastMessage = {type:type, text:text};

        if (timeOut > 0)
            $scope.alertTimeout = $timeout(function(){$scope.alertVisible = false;}, timeOut);
    }

    /**
     * @ngdoc function
     * @name $scope.searchTournament
     * @function
     *
     * @param {passKey} the passkey to be used as search param
     * @description
     * Searches a tournament by passkey. If succeeds, opens the player view screen
     *
     */
    $scope.searchTournament = function(passKey)
    {
        $("#btn-send").button("loading");

        Tournament.get({tournamentID:$routeParams.tournamentID, passKey:passKey},
                       function(reply) // success callback
                       {
                           $("#btn-send").button("found");
                           $cookies.passKey = $scope.passKey;
                           window.location = '#/playerView/' + reply.id;
                       },
                       function(errMsg) //error callback
                       {
                           $("#btn-send").button("error");
                           $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                           $timeout(function () {$("#btn-send").button("reset")}, 2000);
                       }
        );
    }

    /**
     * @ngdoc function
     * @name $scope.passkeyChange
     * @param {passKey} the passkey typed
     * @function
     *
     * @description
     * Searches a tournament by passkey. If succeeds, opens the player view screen
     *
     */
    $scope.passkeyChange = function(passKey)
    {
        $scope.alertVisible = false;
        //$("#btn-send").button("reset");
        $scope.searchTournamentEnabled = passKey.length > 3;

    }

    $scope.setPassKeyHeader = function()
    {
        $http.defaults.headers.post["x-PassKey"] = $scope.passKey;
        $http.defaults.headers.put["x-PassKey"] = $scope.passKey;
        $http.defaults.headers.delete =  {"x-PassKey": $scope.passKey};
        $http.defaults.headers.patch["x-PassKey"] = $scope.passKey;
    }


    $scope.dateOptions =
    {
        "year-format": "YYYY",
        "starting-day": 1,
        "show-weeks": false,
        "toggle-weeks-text": "'Semanas'"

    };

    $scope.openDatePicker = function($event)
    {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.datePickerOpened = true;
    };

    $scope.addMatchToGroup = function(groupIndex, matchIndex)
    {
        if ($scope.groups[groupIndex].matches == null || $scope.groups[groupIndex].matches == undefined)
            $scope.groups[groupIndex].matches = [];

        var len = $scope.tournamentDataSrv.matches.push({orderInGroup: matchIndex, rightPlayer:"", leftPlayer:"", startTime: $scope.groups[groupIndex].startTime});
        $scope.groups[groupIndex].matches.splice(matchIndex, 0,$scope.tournamentDataSrv.matches[len-1]);
        $scope.reindexMatches(groupIndex);
        var h = "stop"
    }

    $scope.storeForRemoval = function(match)
    {
        if (match.id != null && match.id != "")
            $scope.tobeRemoved.push(match.id);
    }

    $scope.removeMatchFromGroup = function(groupIndex, matchIndex)
    {
        $scope.storeForRemoval($scope.groups[groupIndex].matches[matchIndex]);

        var matches = $scope.groups[groupIndex].matches;
        if ( matches.length===1 ) // I am removing the last one
        {
            matches[0].leftPlayer = matches[0].rightPlayer = "";
            matches[0].orderInGroup = 0;
            matches[0].startTime = $scope.groups[groupIndex].startTime;
        }
        else
            matches.splice(matchIndex, 1);

        $scope.reindexMatches(groupIndex);
    }

    $scope.reindexMatches = function(groupIndex)
    {
        var matches = $scope.groups[groupIndex].matches;
        angular.forEach(matches, function (result, index)
        {
            matches[index].orderInGroup = index;
            matches[index].startTime = $scope.groups[groupIndex].startTime;
        });

    }

    $scope.reindexGroups = function()
    {
        angular.forEach($scope.groups, function (result, index)
        {
            groups[index].orderInGroup = index+1;
            //TODO
            // matches[index].startTime = $scope.groups[groupIndex].startTime;
        });

    }

    $scope.addGroup = function(groupIndex)
    {
        var startTime;
        if ($scope.groups == null || $scope.groups == undefined)
        {
            $scope.groups = [];
            startTime = $scope.tournamentDataSrv.tournamentDate;
        }
        else
            startTime = groupIndex == 0 ? new Date($scope.groups[0].startTime - 10*60*1000) : new Date($scope.groups[groupIndex-1].startTime.getTime() + 10*60*1000) ;
        $scope.groups.splice(groupIndex, 0, {startTime: startTime});
        $scope.addMatchToGroup(groupIndex, 0);
        $scope.reindexGroups();
    }

    $scope.removeGroup = function(groupIndex)
    {
        var matches = $scope.groups[groupIndex].matches;
        angular.forEach(matches, function (result, index)
        {
            $scope.storeForRemoval(matches[index]);
        });

        if ( $scope.groups.length===1 ) // I am removing the last one
        {
            $scope.groups[0].matches.length = 0;
            $scope.groups[0].startTime = $scope.tournamentDataSrv.tournamentDate;
            $scope.groups[0].number = 1;
            $scope.addMatchToGroup(0, 0);
        }
        else
            $scope.groups.splice(groupIndex, 1);

        $scope.reindexGroups();
    }

    $scope.newTournament = function()
    {
        $scope.tournamentDataSrv = new Tournament();
        $scope.tournamentDataSrv.leftTeamName = "";
        $scope.tournamentDataSrv.rightTeamName = "";
        $scope.tournamentDataSrv.passKey = $scope.passKey;
        $scope.tournamentDataSrv.gameDate = new Date();
        $scope.tournamentDataSrv.matches = [{leftPlayer:"", rightPlayer:"", startTime:tournamentDataSrv.gameDate, orderInGroup:0, result:{h:0, h:0, ts:new Date()}}];

        $scope.createGroups();
    }

    $scope.putTournament = function()
    {
        $scope.tournamentDataSrv.passKey = $scope.passKey; // this is the only property kept on its own $scope variable

        $scope.tournamentDataSrv.$save(
            function(reply)
            {
                $scope.lastMessage = {type:"success", text:MsgText.SCORE_SENT};
                //btn.button("sent");
                //$timeout(function () {btn.button("reset")}, 2000);
            },
            function(errMsg) //error callback
            {
                $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                //btn.button("error");
                //$timeout(function () {btn.button("reset")}, 2000);
            });


    }



}]);

