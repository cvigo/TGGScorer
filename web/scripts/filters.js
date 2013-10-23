/**
 * User: carlosvigo
 * Date: 21/10/13
 * Time: 17:52
 * Angular custom display filters for proper result display
 */


var angularFilters = angular.module("ScorerFilters", []);

angularFilters.filter('prettyresult', function()
{
    return function(inputMatch)
    {
        var absResult = Math.abs(inputMatch.result.r);
        var remaining = 18-inputMatch.result.h;

        var headingPlayer = inputMatch.result.r > 0 ? inputMatch.rightPlayer: inputMatch.leftPlayer;

        if ( absResult == 0 )
            return "AS";
        else if ( absResult > remaining && remaining > 0 ) // game finished before 18th, display things like 2&1
            return headingPlayer + " " + absResult + "&" + remaining;
        else
            return headingPlayer + " " + absResult + " UP";  // game over at 18, just display the advantage
    }
});

angularFilters.filter('prettyhole', function()
{
    return function(inputMatch)
    {
        var absResult = Math.abs(inputMatch.result.r);
        var remaining = 18-inputMatch.result.h;

        if ( remaining == 0 || absResult > remaining  )
            return "Finalizado";
        else
            return "Hoyo "+ inputMatch.result.h;
    }
});
