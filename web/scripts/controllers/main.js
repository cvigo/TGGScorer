
var MsgText =
{
    MORETHANPLAYED:"No se pueden llevar más hoyos de ventaja que jugados!!",
    READY :"Preparado",
    WORKING:"Preparado",
    SCORE_SENT:"Marcador enviado!",
    GAMEOVER:"El partido tendría que haber acabado ya!!",

    LOADING:"Cargando resultados...",
    NO_UPDATES:"... No hay nuevos resultados",
    NEW_RESULTS:"... se han recibido nuevos resultados"
};


var appModule = angular.module("MainViewModule", ["BackendModule", "ScorerFilters", "ngCookies", "SharedData"]);

var errorMsgTime = 2000;
var animationTime = 1000;

appModule.controller("MainCtrl",
                     ["$scope",
                         "$routeParams",
                         "$window",
                         "$timeout",
                         "$interval",
                         "$animate",
                         "$cookies",
                         "$http",
                         "Tournament",
                         "Result",
                         "SharedProperties",
                         function (
                             $scope,
                             $routeParams,
                             $window,
                             $timeout,
                             $interval,
                             $animate,
                             $cookies,
                             $http,
                             Tournament,
                             Result,
                             SharedProperties
                         )
{
    var alertTimeout = 3000;
    var refreshInterval = 10000;
    var autoRefresh;
    var autoRefreshTimer;

    $scope.nextRefresh = refreshInterval/1000;

    //data properties
    $scope.tournamentDataSrv = SharedProperties.getTournamentDataSrv(); // this will store the tournament data retrieved from the server
    $scope.resultsSrv = SharedProperties.getResultsSrv(); // this will store de results received from the server
    $scope.playerList = []; // this feeds the players filter in the model
    $scope.groups = [];   // this creates a visual representation of the matches, sorted and grouped by tee time. It keeps references to the tournamentDataSrv data
    $scope.refreshing = "null";
    $scope.passKey = "";

    $scope.frequentTeams = ["Cosacos", "Bucaneros", "Corsarios", "Filibusteros"];

/*    SharedProperties.getGroups() = [
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
 * @return {{scoreL: number, scoreR: number}} projected points accumulated by team on the left, projected points accumulated by team on the right
 */
    $scope.projectedResult = function()
    {
        var scoreLeft = 0;
        var scoreRight = 0;
        for (var i=0, len=SharedProperties.getGroups().length; i<len; ++i)
        {

            for (var j=0, len2=SharedProperties.getGroups()[i].matches.length; j<len2; ++j)
            {
                if (SharedProperties.getGroups()[i].matches[j].result.r < 0 ) {++scoreLeft;}
                else if (SharedProperties.getGroups()[i].matches[j].result.r > 0) {++scoreRight;}
                else {scoreLeft += 0.5; scoreRight += 0.5;}

            }
        }
        return {scoreL:scoreLeft, scoreR:scoreRight};
    };

/**
 * @ngdoc function
 * @name $scope.finalResult
 * @function
 *
 * @description
 * Calculates the points that each team has secured. If a player is "dormie", he is given 0.5
 * (that will be 1 unless he loses all remaining holes)
 *
 * @return {{scoreL: number, scoreR: number}} secured points by team on the left, secured points by team on the right
 */
    $scope.finalResult = function()
    {
        var scoreLeft = 0;
        var scoreRight = 0;
        for (var i=0, len=SharedProperties.getGroups().length; i<len; ++i)
        {
            for (var j=0, len2=SharedProperties.getGroups()[i].matches.length; j<len2; ++j)
            {
                var remainingHoles = (18 - SharedProperties.getGroups()[i].matches[j].result.h);
                if ( Math.abs( SharedProperties.getGroups()[i].matches[j].result.r) > remainingHoles  ) // match is done: advantage > holes remaining
                {
                    if (SharedProperties.getGroups()[i].matches[j].result.r < 0 ) {++scoreLeft;}
                    else {++scoreRight;}
                }
                else if ( Math.abs( SharedProperties.getGroups()[i].matches[j].result.r) == remainingHoles  ) // check if any player is "dormie" to account for the 1/2 point he assured
                {
                    if (SharedProperties.getGroups()[i].matches[j].result.r < 0 ) {scoreLeft+=0.5;}
                    else if (SharedProperties.getGroups()[i].matches[j].result.r > 0) {scoreRight+=0.5;}
                    else {scoreLeft += 0.5; scoreRight += 0.5;}   // match is halved
                }

            }
        }
        return {scoreL:scoreLeft, scoreR:scoreRight};
    };

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
        $scope.refreshStatus = MsgText.LOADING;
        SharedProperties.setTournamentDataSrv(Tournament.get({tournamentID:tournamentId, getResults:false},
            function(tournamentData)
            {
                // get results in a single call
                // Result.query won't not work because GAE does not return an array. Instead it returns an object that
                // contains a property called "items" which is the array
                Result.get({tournamentID:tournamentId},
                           function(resultsArray)  // success callback
                           {
                               SharedProperties.setResultsSrv(resultsArray.items);
                               $scope.resultsSrv = SharedProperties.getResultsSrv();

                               // results come in the same order than matches in Tournament call
                               for (var match in SharedProperties.getTournamentDataSrv().matches)
                               {
                                   //store the reference to the result, so futures updates to the results object are automatically loaded into the template
                                   SharedProperties.getTournamentDataSrv().matches[match].result = SharedProperties.getResultsSrv()[match];
                               }
                               $scope.createGroups();       //TODO pasar al servicio
                               $scope.groups = SharedProperties.getGroups();

                               $scope.scheduleAutoRefresh();
                               $scope.refreshStatus = " ";
                           },
                           function(errMsg) //error callback
                           {
                               $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                           }
                );


                // this is the right location for the following block to make it run in parallel with the Results retrieval from the server
                $scope.tournamentDataSrv = SharedProperties.getTournamentDataSrv();   //todo pasar al servicio
                $scope.addPlayers();
            },
            function(errMsg) //error callback
            {
                $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
            }
        ));
    };

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
        $scope.refreshStatus = MsgText.LOADING;

        Result.get({tournamentID:$routeParams.tournamentID},
            function(resultsArray)  // success callback
            {
                $scope.refreshStatus = MsgText.NO_UPDATES;
                $scope.refreshing = "null";
                $scope.scheduleAutoRefresh();
                angular.forEach(resultsArray.items, function (result, index)
                {
                    //we can trust TS, as the server does not write POSTs that do not actually send a different hole or result than the ones already stored
                    // this if is just used to trigger or not trigger the animations in the scorer screen. Results are always reloaded
                    if ( (SharedProperties.getResultsSrv()[index].ts == null && result.ts != null) || SharedProperties.getResultsSrv()[index].ts < result.ts) //TS
                    {
                        $scope.refreshStatus = MsgText.NEW_RESULTS;
                        $scope.markAsChanged(SharedProperties.getResultsSrv()[index].id);

                        $timeout(function () // give some time to the animations before updating the numbers
                                 {
                                     //SharedProperties.getResultsSrv() = resultsArray.items; // Don't do this, because SharedProperties.getResultsSrv() would be copied
                                     //a new array instance, and references to results in SharedProperties.getTournamentDataSrv(). would be lost
                                     SharedProperties.getResultsSrv()[index].r = result.r; // this also makes SharedProperties.getTournamentDataSrv().matches[index].result.r = result.r etc...
                                     SharedProperties.getResultsSrv()[index].h = result.h;
                                     SharedProperties.getResultsSrv()[index].ts = result.ts;
                                 },
                                 animationTime
                        );
                    }
                    else
                    {
                        // Results are always reloaded regardless of the timestamps
                        SharedProperties.getResultsSrv()[index].r = result.r;
                        SharedProperties.getResultsSrv()[index].h = result.h;
                        SharedProperties.getResultsSrv()[index].ts = result.ts;
                        $scope.markAsUnchanged(SharedProperties.getResultsSrv()[index].id);
                    }

                });
            },
            function(errMsg) //error callback
            {
                $scope.refreshing = "null";
                $scope.refreshStatus = " ";
                $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                $scope.scheduleAutoRefresh();

            }

        );
    };


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
        var matchDesktop = $("#match_desktop_"+matchId);
        var matchMobile = $("#match_mobile_"+matchId);

        matchDesktop.addClass("ng-hide-add");
        matchMobile.addClass("ng-hide-add");
        $timeout(function()
                 {
                     matchDesktop.removeClass("ng-hide-add");
                     matchDesktop.addClass("ng-hide-remove");
                     matchMobile.removeClass("ng-hide-add");
                     matchMobile.addClass("ng-hide-remove");
                     $("#match_desktop_"+matchId+"_lastupdate").addClass("blinking");
                     $timeout(function()
                              {
                                  matchDesktop.removeClass("ng-hide-remove");
                                  matchMobile.removeClass("ng-hide-remove");
                              },
                              animationTime
                     );
                 },
                 animationTime
        );
    };

    $scope.markAsUnchanged = function(matchId)
    {
        $("#match_desktop_"+matchId+"_lastupdate").removeClass("blinking");
    };

    /**
     * @ngdoc function
     * @name $scope.sendResult
     * @function
     * @param {number} groupNumber The group number as displayed in the template (= array index +1)
     * @param {Object} event DOM element that fired the event
     *
     * @description
      * Sends the group results to the Server
     */
    $scope.sendResult = function(groupNumber, event)
    {
        var btn = $(event.target);
        btn.button("loading");

        // GAE endpoints return arrays inside an "items" property. I cannot just "save" the resource I retrieved in loadTournament
        for (var match in SharedProperties.getGroups()[groupNumber-1].matches)
        {
            // THIS WOULD BE THE IDEAL CASE, BUT... SharedProperties.getGroups()[groupNumber-1].matches[match].result.$save();

            var res = new Result({tID:$routeParams.tournamentID, id:SharedProperties.getGroups()[groupNumber-1].matches[match].id});

            res.h = SharedProperties.getGroups()[groupNumber-1].matches[match].result.h;
            res.r = SharedProperties.getGroups()[groupNumber-1].matches[match].result.r;

            res.$save(
                function(reply)
                {
                    $scope.lastMessage = {type:"success", text:MsgText.SCORE_SENT};
                    btn.button("sent");
                    $timeout(function () {btn.button("reset")}, errorMsgTime);
                },
                function(errMsg) //error callback
                {
                    $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                    btn.button("error");
                    $timeout(function () {btn.button("reset")}, errorMsgTime);
                });
        }
    };

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
        SharedProperties.setGroups([]);

        var lastStartTime = 0;
        var groupIndex = -1;

        $scope.sortMatches();

        for (matchid in SharedProperties.getTournamentDataSrv().matches)
        {
            var match = SharedProperties.getTournamentDataSrv().matches[matchid];

            if (match.startTime > lastStartTime) // is is a new group
            {
                ++groupIndex;
                SharedProperties.getGroups().push( {number:groupIndex+1, startTime:match.startTime, matches:[] } );
                SharedProperties.getGroups()[groupIndex].matches.push(match);
                lastStartTime = match.startTime;
            }
            else
            {
                // push the match w/o increasing the group index
                SharedProperties.getGroups()[groupIndex].matches.push(match);
            }

        }
    };

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
        SharedProperties.getTournamentDataSrv().matches.sort(function(a, b)
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
 * @name $scope.initModel
 * @function
 *
 * @description
 * prepares de scorer model, getting data from the server, preparing the groups and the list of players for the filter
 */
    $scope.initModel = function(autorefresh)
    {
        if ($routeParams.tournamentID == "new")
        {
            SharedProperties.setTournamentDataSrv(new Tournament());
            SharedProperties.getTournamentDataSrv().leftTeamName = "";
            SharedProperties.getTournamentDataSrv().rightTeamName = "";
            SharedProperties.getTournamentDataSrv().passKey = $scope.passKey = "";
            SharedProperties.getTournamentDataSrv().gameDate = new Date();
            SharedProperties.getTournamentDataSrv().matches = [{leftPlayer:"", rightPlayer:"", startTime:SharedProperties.getTournamentDataSrv().gameDate, orderInGroup:0, result:{h:0, r:0, ts:new Date()}}];

            $scope.createGroups();
            $scope.tournamentDataSrv = SharedProperties.getTournamentDataSrv();
            $scope.groups = SharedProperties.getGroups();
            $scope.tournamentSaved = false;
        }
        else
        {
            $scope.loadTournament($routeParams.tournamentID);
            $scope.passKey = window.localStorage.getItem("passKey");

            if ( document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 ) // app running locally
                $scope.scorePanelURL = "https://tggscorer.appspot.com/#/scorerView/" + $routeParams.tournamentID;
            else
                $scope.scorePanelURL = window.location.protocol + "//" + window.location.host + "/#/scorerView/" + $routeParams.tournamentID;


            $scope.tournamentSaved = true;
        }

        $scope.setPassKeyHeader();

        $scope.doAutoRefresh = autorefresh;
    };

    $scope.initApp = function()
    {
        $scope.passKey = window.localStorage.getItem("passKey");
        $scope.passkeyChange($scope.passKey);
    };



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
        for (match in SharedProperties.getTournamentDataSrv().matches)
        {
            $scope.playerList.push(SharedProperties.getTournamentDataSrv().matches[match].leftPlayer);
            $scope.playerList.push(SharedProperties.getTournamentDataSrv().matches[match].rightPlayer);
        }
    };


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
        for (var i= 0, len=SharedProperties.getGroups()[index].matches.length; i<len; ++i)
        {
            ret += SharedProperties.getGroups()[index].matches[i].leftPlayer + " vs " + SharedProperties.getGroups()[index].matches[i].rightPlayer + " - ";
        }

        return ret;
    };



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
    };


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
    };

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
    };

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
            return SharedProperties.getTournamentDataSrv().rightTeamName;
        else if (match.result.r < 0)
            return SharedProperties.getTournamentDataSrv().leftTeamName;
        else
        return "allsquare";

    };

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
    };

    /**
     * @ngdoc function
     * @name $scope.searchTournament
     * @function
     *
     * @description
     * Searches a tournament by passkey. If succeeds, opens the player view screen
     *
     * @param passKey Tournament passkey udes in the search
     * @param successFn function called if search suceeds
     * @param errorFn function called if search fails
     */
    $scope.searchTournament = function(passKey, successFn, errorFn)
    {
        return Tournament.get({tournamentID:$routeParams.tournamentID, passKey:passKey}, successFn, errorFn);
    };

    $scope.playTournament = function(passKey)
    {
        $("#btn-send").button("loading");

        $scope.searchTournament(passKey,
                                function(reply) // success callback
                                {
                                    $("#btn-send").button("found");
                                    window.localStorage.setItem("passKey", $scope.passKey);
                                    window.location = '#/playerView/' + reply.id;
                                },
                                function(errMsg) //error callback
                                {
                                    $("#btn-send").button("error");
                                    $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                                    $timeout(function () {$("#btn-send").button("reset")}, errorMsgTime);
                                }
        );
    };


    $scope.editTournament = function(passKey, event)
    {
        var btn = $(event.target);
        btn.button("loading");

        $scope.searchTournament(passKey,
                                function(reply) // success callback
                                {
                                    btn.button("found");
                                    window.localStorage.setItem("passKey", $scope.passKey);
                                    window.location = '#/edit/' + reply.id;
                                },
                                function(errMsg) //error callback
                                {
                                    btn.button("error");
                                    $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                                    $timeout(function () {btn.button("reset")}, errorMsgTime);
                                }
        );
    };

    /**
     * @ngdoc function
     * @name $scope.passkeyChange
     * @param {string} passKey the passkey typed
     * @function
     *
     * @description
     * Searches a tournament by passkey. If succeeds, opens the player view screen
     *
     */
    $scope.passkeyChange = function(passKey)
    {
        $scope.alertVisible = false;
        $scope.searchTournamentEnabled = passKey.length > 3;
    };

    $scope.setPassKeyHeader = function()
    {
        $http.defaults.headers.post["x-PassKey"] = $scope.passKey;
        $http.defaults.headers.put["x-PassKey"] = $scope.passKey;
        $http.defaults.headers.delete =  {"x-PassKey": $scope.passKey};
        $http.defaults.headers.patch["x-PassKey"] = $scope.passKey;
    };


    $scope.dateOptions =
    {
        "year-format": "YYYY",
        "starting-day": 1,
        "show-weeks": false,
        "toggle-weeks-text": "Semanas"

    };

    $scope.openDatePicker = function($event)
    {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.datePickerOpened = true;
    };

    $scope.addMatchToGroup = function(groupIndex, matchIndex)
    {
        if (SharedProperties.getGroups()[groupIndex].matches == null || SharedProperties.getGroups()[groupIndex].matches == undefined)
            SharedProperties.getGroups()[groupIndex].matches = [];

        var len = SharedProperties.getTournamentDataSrv().matches.push({orderInGroup: matchIndex, rightPlayer:"", leftPlayer:"", startTime: SharedProperties.getGroups()[groupIndex].startTime});
        SharedProperties.getGroups()[groupIndex].matches.splice(matchIndex, 0,SharedProperties.getTournamentDataSrv().matches[len-1]);
        $scope.reindexMatches(groupIndex);
    };

    $scope.removeMatch = function(match)
    {
        SharedProperties.getTournamentDataSrv().matches.splice(SharedProperties.getTournamentDataSrv().matches.indexOf(match), 1);
    };

    $scope.removeMatchFromGroup = function(groupIndex, matchIndex)
    {
        $scope.removeMatch(SharedProperties.getGroups()[groupIndex].matches[matchIndex]);

        var matches = SharedProperties.getGroups()[groupIndex].matches;
        if ( matches.length===1 ) // I am removing the last one
        {
            matches[0].leftPlayer = matches[0].rightPlayer = "";
            matches[0].orderInGroup = 0;
            matches[0].startTime = SharedProperties.getGroups()[groupIndex].startTime;
        }
        else
            matches.splice(matchIndex, 1);

        $scope.reindexMatches(groupIndex);
    };

    $scope.reindexMatches = function(groupIndex)
    {
        var matches = SharedProperties.getGroups()[groupIndex].matches;
        var i=0;
        for (i=0; i<matches.length; ++i)
        {
            matches[i].orderInGroup = i;
            matches[i].startTime = SharedProperties.getGroups()[groupIndex].startTime;
        }

    };

    $scope.reindexGroups = function()
    {
        var i=0;
        for (i=0; i<SharedProperties.getGroups().length; ++i)
            $scope.reindexMatches(i);
    };

    $scope.addGroup = function(groupIndex)
    {
        var startTime;
        if (SharedProperties.getGroups() == null || SharedProperties.getGroups() == undefined || SharedProperties.getGroups().length == 0 )  // adding the first group
        {
            SharedProperties.setGroups([]);
            startTime = SharedProperties.getTournamentDataSrv().gameDate;
        }
        else
            startTime = groupIndex == 0 ? new Date(SharedProperties.getGroups()[0].startTime - 10*60*1000) : new Date(SharedProperties.getGroups()[groupIndex-1].startTime.getTime() + 10*60*1000) ;
        SharedProperties.getGroups().splice(groupIndex, 0, {startTime: startTime});
        $scope.addMatchToGroup(groupIndex, 0);
        $scope.reindexGroups();
    };

    $scope.removeGroup = function(groupIndex)
    {
        var matches = SharedProperties.getGroups()[groupIndex].matches;
        angular.forEach(matches, function (match, index)
        {
            $scope.removeMatch(match);
        });

        if ( SharedProperties.getGroups().length===1 ) // I am removing the last one
        {
            SharedProperties.getGroups()[0].matches.length = 0;
            SharedProperties.getGroups()[0].startTime = SharedProperties.getTournamentDataSrv().gameDate;
            SharedProperties.getGroups()[0].startTime.setHours(9,0,0,0);
                SharedProperties.getGroups()[0].number = 1;
            $scope.addMatchToGroup(0, 0);
        }
        else
            SharedProperties.getGroups().splice(groupIndex, 1);

        $scope.reindexGroups();
    };

    $scope.newTournament = function()
    {
        window.location = '#/edit/new';

    };

    $scope.putTournament = function()
    {
        $("#btn-save").button("loading");
        $scope.alertVisible = false;
        SharedProperties.getTournamentDataSrv().passKey = $scope.passKey; // this is the only property kept on its own $scope variable
        window.localStorage.setItem("passKey", $scope.passKey);
        $scope.setPassKeyHeader();
        $scope.propagateDates();
        $scope.createGroups();
        $scope.groups=SharedProperties.getGroups();
        $scope.reindexGroups();


        console.log("putTournament: " + SharedProperties.getTournamentDataSrv().toString());

        SharedProperties.getTournamentDataSrv().$save(
            function(reply)
            {
                $scope.lastMessage = {type:"success", text:MsgText.SCORE_SENT};
                $("#btn-save").button("sent");
                if($routeParams.tournamentID == "new")
                {
                    $timeout(function ()
                             {
                                 window.location = "#/edit/" + SharedProperties.getTournamentDataSrv().id;
                             }, 1000);
                }
                else
                {
                    $timeout(function () {$("#btn-save").button("reset")}, errorMsgTime);
                    $scope.createGroups();
                    $scope.groups=SharedProperties.getGroups();
                }
            },
            function(errMsg) //error callback
            {
                $scope.displayAlertMessage("danger", errMsg.data.error.message, 0);
                $("#btn-save").button("error");
                $timeout(function () {$("#btn-save").button("reset")}, errorMsgTime);
            });


    };

    $scope.propagateDates = function()
    {
        $scope.setMatchesTimeToGroupTime();
        $scope.setMatchesDateToTournamentDate();
    };

    $scope.setMatchesDateToTournamentDate = function()
    {
        var i=0;
        for (i=0; i<SharedProperties.getTournamentDataSrv().matches.length; ++i)
        {
            SharedProperties.getTournamentDataSrv().matches[i].startTime.setFullYear(SharedProperties.getTournamentDataSrv().gameDate.getFullYear());
            SharedProperties.getTournamentDataSrv().matches[i].startTime.setMonth(SharedProperties.getTournamentDataSrv().gameDate.getMonth());
            SharedProperties.getTournamentDataSrv().matches[i].startTime.setDate(SharedProperties.getTournamentDataSrv().gameDate.getDate());
            SharedProperties.getTournamentDataSrv().matches[i].startTime.setSeconds(0);
            SharedProperties.getTournamentDataSrv().matches[i].startTime.setMilliseconds(0);

            console.log("setMatchesDateToTournamentDate: " + SharedProperties.getTournamentDataSrv().matches[i].id + ": " + SharedProperties.getTournamentDataSrv().matches[i].leftPlayer + " vs " + SharedProperties.getTournamentDataSrv().matches[i].rightPlayer + "; time:" + SharedProperties.getTournamentDataSrv().matches[i].startTime);

        }
    };

    $scope.setMatchesTimeToGroupTime = function()
    {
        var i= 0, j=0;
        for (i=0; i<SharedProperties.getGroups().length; ++i)
            for (j=0; j<SharedProperties.getGroups()[i].matches.length; ++j)
            {
                SharedProperties.getGroups()[i].matches[j].startTime = SharedProperties.getGroups()[i].startTime;
                console.log("setMatchesTimeToGroupTime: " + SharedProperties.getGroups()[i].matches[j].leftPlayer + " vs " + SharedProperties.getGroups()[i].matches[j].rightPlayer + "; time:" + SharedProperties.getGroups()[i].matches[j].startTime);
            }
    };

    $scope.validateTournament = function()
    {
        return (
                SharedProperties.getTournamentDataSrv().leftTeamName != null && !SharedProperties.getTournamentDataSrv().leftTeamName.isEmpty()
                &&
                SharedProperties.getTournamentDataSrv().rightTeamName != null && !SharedProperties.getTournamentDataSrv().rightTeamName.isEmpty()
                &&
                SharedProperties.getTournamentDataSrv().passKey != null && !SharedProperties.getTournamentDataSrv().passKey.isEmpty()
                &&
                SharedProperties.getTournamentDataSrv().leftTeamName != null && !SharedProperties.getTournamentDataSrv().leftTeamName.isEmpty()
                &&
                SharedProperties.getTournamentDataSrv().leftTeamName != null && !SharedProperties.getTournamentDataSrv().leftTeamName.isEmpty()
                &&
                SharedProperties.getTournamentDataSrv().leftTeamName != null && !SharedProperties.getTournamentDataSrv().leftTeamName.isEmpty()
                &&
                SharedProperties.getTournamentDataSrv().leftTeamName != null && !SharedProperties.getTournamentDataSrv().leftTeamName.isEmpty()
            );
    };


    $scope.scheduleAutoRefresh = function()
    {
        if ( ! $scope.doAutoRefresh ) return;

        // Don't start a new autorefresh if we are already doing it
        if ( angular.isDefined(autoRefresh) ) return;

        $scope.restartAutoRefreshTimer();
        autoRefresh = $timeout(function ()
                                {
                                    autoRefresh = undefined;
                                    $scope.reloadResults();
                                },
                                refreshInterval);
    };

    $scope.restartAutoRefreshTimer = function()
    {
        if (angular.isDefined(autoRefreshTimer))
        {
            $interval.cancel(autoRefreshTimer);
            autoRefreshTimer = undefined;
        }
        $scope.nextRefresh = refreshInterval/1000;
        autoRefreshTimer = $interval(function ()
                                     {
                                         if ($scope.nextRefresh > 0)
                                         {
                                             $scope.nextRefresh--;
                                         }
                                         else
                                             $interval.cancel(autoRefreshTimer);
                                     },
                                     1000);

    };

    $scope.stopAutoRefresh = function()
    {
        if (angular.isDefined(autoRefresh))
        {
            $interval.cancel(autoRefresh);
            autoRefresh = undefined;
        }
        if (angular.isDefined(autoRefreshTimer))
        {
            $interval.cancel(autoRefreshTimer);
            autoRefreshTimer = undefined;
        }
    };

    $scope.$on('$destroy', function()
    {
        // Make sure that the interval is destroyed too
        $scope.stopAutoRefresh();
    });

    $scope.openScorerPanel = function()
    {
        //window.alert($scope.scorePanelURL);
        if ( document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 ) // app running locally
        {
            console.log("Opening " + $scope.scorePanelURL + " in _system");
            window.open($scope.scorePanelURL, '_system'); // this makes sure that PhoneGap opens the link in the mobile default browser
        }
        else
            window.open($scope.scorePanelURL, '_blank');
    };

}]);

