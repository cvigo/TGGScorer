package com.galaxiagolf.matchplay;


/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 02/06/13
 * Time: 19:13
 * To change this template use File | Settings | File Templates.
 */


import com.galaxiagolf.matchplay.entity.Match;
import com.galaxiagolf.matchplay.entity.SimpleResult;
import com.galaxiagolf.matchplay.entity.Tournament;
import com.galaxiagolf.matchplay.entity.TournamentPOJO;
import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.ApiMethod.HttpMethod;
import com.google.api.server.spi.config.ApiMethodCacheControl;
import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.NotFoundException;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.Ref;
import com.googlecode.objectify.Work;

import javax.inject.Named;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import static com.galaxiagolf.matchplay.OfyService.ofy;


@Api(
        name = "mpscorer",
        version = "v1",
        description = "Galaxia Golf Tournament online scorer API"
//        scopes = {"ss0", "ss1"},
//        audiences = {"aa0", "aa1"},
//        clientIds = {"cc0", "cc1"},
//        defaultVersion = AnnotationBoolean.TRUE
)
public class MatchPlayScorer
{
    private final String TOURNAMENT_LIST_URI = "tournament";
    private final String TOURNAMENT_ID_PARAM = "tournamentId";
    private final String TOURNAMENT_URI = TOURNAMENT_LIST_URI + "/{" + TOURNAMENT_ID_PARAM + "}"; // http://server/tournament/1
    
    private final String MATCH_LIST_URI = TOURNAMENT_URI + "/match"; // http://server/tournament/1/match
    private final String MATCH_ID_PARAM = "matchId";
    private final String MATCH_URI = MATCH_LIST_URI + "/{" + MATCH_ID_PARAM + "}"; // http://server/tournament/1/match/2
    
    private final String RESULT_LIST_URI = TOURNAMENT_URI + "/result"; // http://server/tournament/1/result
    private final String RESULT_URI = RESULT_LIST_URI + "/{" + MATCH_ID_PARAM + "}";  // http://server/tournament/1/result/2


    ///// TOURNAMENT STUFF /////

    // Create new tournament method, it does not create any matches
    @ApiMethod(
            name = "mpscorerapi.createTournament",
            path = TOURNAMENT_LIST_URI,              // http://server/tournament/1/
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public TournamentPOJO createTournament(TournamentPOJO tournamentPojo) throws BadRequestException
    {
        // check data integrity
        if ( !tournamentPojo.validateAsNewObject() )
            throw new BadRequestException("invalid input parameters!" );

        Tournament tournament = new Tournament(tournamentPojo);
        Key<Tournament> ret = ofy().save().entity(tournament).now();
        tournament.setId(ret.getId());

        return tournament; //this is funny. We cannot declare Tournament as return value, because the class contains an List<Ref<Match>> property,
        // unsupported by endpoints, but we can return Tournament object, which contains the @Id Long id property, but is not in TournamentPOJO
    }


    // Simple get method for a Tournament. Gets everything, matches included
    @ApiMethod(
            name = "mpscorerapi.getTournament",
            path = TOURNAMENT_URI,
            httpMethod = HttpMethod.GET
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public TournamentPOJO getTournament(@Named(TOURNAMENT_ID_PARAM) Long tournamentId) throws NotFoundException
    {
        Tournament tournament =  ofy().load().type(Tournament.class).id(tournamentId).now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");
        else
            return tournament;
    }

    // Simple update method for a Tournament. It does not update tournament matches, just date and teams
    @ApiMethod(
            name = "mpscorerapi.updateTournament",
            path = TOURNAMENT_URI,
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public TournamentPOJO updateTournament(@Named(TOURNAMENT_ID_PARAM) Long tournamentId, TournamentPOJO newData) throws BadRequestException, NotFoundException
    {
        Tournament theTournament = ofy().load().type(Tournament.class).id(tournamentId).now();
        if (theTournament==null)
            throw new NotFoundException("tournament not found");

        // update only the properties passed in the REST call
        if (newData.getGameDate() != null ) theTournament.setGameDate(newData.getGameDate());
        if (newData.getLeftTeamName() != null && !newData.getLeftTeamName().isEmpty() ) theTournament.setLeftTeamName(newData.getLeftTeamName());
        if (newData.getRightTeamName() != null && !newData.getRightTeamName().isEmpty() ) theTournament.setRightTeamName(newData.getRightTeamName());

        ofy().save().entity(theTournament).now();
        return theTournament;
    }

    // Simple delete method for a Tournament. It does not delete tournament matches, be aware the orphans
    @ApiMethod(
            name = "mpscorerapi.deleteTournament",
            path = TOURNAMENT_URI,
            httpMethod = HttpMethod.DELETE
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public void deleteTournament(@Named(TOURNAMENT_ID_PARAM) Long tournamentId)
    {
        ofy().delete().type(Tournament.class).id(tournamentId).now();
    }


    ///// INDIVIDUAL MATCHES STUFF /////

    // Add match method, for an existing tournament
    @ApiMethod(
            name = "mpscorerapi.addMatch",
            path = MATCH_LIST_URI,
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public TournamentPOJO addMatch(@Named(TOURNAMENT_ID_PARAM) final Long tournamentId, final Match newMatch) throws BadRequestException, NotFoundException
    {
        // check data integrity
        if ( !newMatch.validateAsNewObject() )
            throw new BadRequestException("invalid input parameters!" );

        // will make a few writes, so let's use a transaction for data integrity
        Tournament th = ofy().transact(new Work<Tournament>()
        {
            @Override public Tournament run()
            {
                Tournament theTournament = ofy().load().group(Tournament.NoResults.class).type(Tournament.class).id(tournamentId).now();
                if (theTournament == null)
                {
                    ofy().getTransaction().rollback();
                    return null;
                }
                Key<Match> matchKey = ofy().save().entity(newMatch).now();
                theTournament.addMatch(matchKey);
                ofy().save().entity(theTournament).now();
                return theTournament;
            }
        });

        if (th==null)
            throw new NotFoundException("tournament not found");
        else
            return th;
    }

    //This just gets a single match, results included
    @ApiMethod(
            name = "mpscorerapi.getMatch",
            path = MATCH_URI,                  // http://server/tournament/1/match/2
            httpMethod = HttpMethod.GET
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Match getMatch(@Named(TOURNAMENT_ID_PARAM) final Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId) throws NotFoundException
    {
        Match match =  ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
            throw new NotFoundException("match not found");

        return match;

    }

    //This deletes a Match and all its reference keys in the tournament
    @ApiMethod(
            name = "mpscorerapi.deleteMatch",
            path = MATCH_URI,                  // http://server/tournament/1/match/2
            httpMethod = HttpMethod.DELETE
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public TournamentPOJO deleteMatch(@Named(TOURNAMENT_ID_PARAM) final Long tournamentId, @Named(MATCH_ID_PARAM) final Long matchId) throws NotFoundException
    {
        // will make a few writes, so let's use a transaction for data integrity
        Tournament th = ofy().transact(new Work<Tournament>()
        {
            @Override public Tournament run()
            {
                Tournament theTournament = ofy().load().group(Tournament.NoResults.class).type(Tournament.class).id(tournamentId).now();
                if (theTournament == null)
                {
                    ofy().getTransaction().rollback();
                    return null;
                }

                // as this is a very infrequent operation, the Match keys are not indexed, so we'd rather load them all and iterate.
                Iterator<Ref<Match>> matches = theTournament.getMatches().iterator();
                while (matches.hasNext())
                {
                    Ref<Match> matchRef = matches.next();
                    if ( matchRef.getKey().getId() == matchId )
                    {
                        theTournament.getMatches().remove(matchRef);
                        ofy().save().entity(theTournament).now();
                        ofy().delete().type(Match.class).id(matchId).now();
                        return theTournament;
                    }
                }
                return theTournament;
            }
        });

        if (th==null)
            throw new NotFoundException("tournament not found");
        else
            return th;
    }

    // Updates the match data
    @ApiMethod(
            name = "mpscorerapi.updateMatch",
            path = MATCH_URI,           // http://server/tournament/1/match/2
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Match updateMatch(@Named(TOURNAMENT_ID_PARAM) Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId, Match newData) throws BadRequestException, NotFoundException
    {
        Match match = ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
            throw new NotFoundException("match not found");

        // update only the properties passed in the REST call
        if (newData.getLeftPlayer() != null && !newData.getLeftPlayer().isEmpty()) match.setLeftPlayer(newData.getLeftPlayer());
        if (newData.getRightPlayer() != null && !newData.getRightPlayer().isEmpty()) match.setRightPlayer(newData.getRightPlayer());
        if (newData.getStartTime() != null) match.setStartTime(newData.getStartTime());
        if (newData.getOrderInGroup() != null) match.setOrderInGroup(newData.getOrderInGroup());
        if (newData.getHole() != null) match.setHole(newData.getHole());
        if (newData.getResult() != null) match.setResult(newData.getResult());
        match.setTimestamp(new Date());

        ofy().save().entity(match).now();
        return match;
    }



    ///// RESULTS STUFF, THE ONLY DATA UPDATED BY THE PLAYERS AT THE TOURNAMENT. DESIGNED TO SAVE BANDWIDTH

    // this does the same stuff as getTournament, but removes results from matches, to allow safe-caching of the return message
    // it returns the URIs to the matches results 
    @ApiMethod(
            name = "mpscorerapi.getTournamentNoResults",

            path = TOURNAMENT_URI + "/noresults",     // http://server/tournament/1/noresults/
            httpMethod = HttpMethod.GET,
            cacheControl = @ApiMethodCacheControl(noCache = false, maxAge = 24*3600 )
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public TournamentPOJO getTournamentNoResults(@Named(TOURNAMENT_ID_PARAM) Long tournamentId) throws NotFoundException
    {
        Tournament tournament =  ofy().load().type(Tournament.class).id(tournamentId).now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");

        Iterator<Ref<Match>> matches = tournament.getMatches().iterator();
        while (matches.hasNext())
        {
            Match match = matches.next().getValue();

            match.setHole(null);
            match.setResult(null);
            match.setTimestamp(null);
            match.setResultURI(TOURNAMENT_LIST_URI + "/" + tournamentId.toString() + "/result/" + match.getId().toString());
        }
        return tournament;
    }


    //This just gets all matches results, to avoid wasted bandwidth in player names etc.
    @ApiMethod(
            name = "mpscorerapi.getAllResults",
            path = RESULT_LIST_URI,  // http://server/tournament/1/result/
            httpMethod = HttpMethod.GET
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public List<SimpleResult> getAllResults(@Named(TOURNAMENT_ID_PARAM) Long tournamentId) throws NotFoundException
    {
        Tournament tournament =  ofy().load().type(Tournament.class).id(tournamentId).now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");

        Iterator<Ref<Match>> matches = tournament.getMatches().iterator();
        List<SimpleResult> ret = new ArrayList<>();

        while (matches.hasNext())
        {
            Match match = matches.next().getValue();
            ret.add(new SimpleResult(match.getId(), match.getHole(), match.getResult(), match.getTimestamp()));
        }

        return ret;

    }
    

    //This just gets one matches result, to avoid wasted bandwidth in player names etc.
    @ApiMethod(
            name = "mpscorerapi.getMatchResult",
            path = RESULT_URI, // http://server/tournament/1/result/2
            httpMethod = HttpMethod.GET
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public SimpleResult getMatchResult(@Named(TOURNAMENT_ID_PARAM) Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId) throws NotFoundException
    {
        Match match = ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
            throw new NotFoundException("match not found");

        return new SimpleResult(match.getId(), match.getHole(), match.getResult(), match.getTimestamp());
    }


    // Updates the match result only. This is used by the players when they press the "send result" button from their mobiles
    // so we do not return anything to save bandwidth. Match ID in the payload and Timestamp are ignored if sent by the client.
    @ApiMethod(
            name = "mpscorerapi.updateMatchResult",
            path = RESULT_URI,
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public void updateMatchResult(@Named(TOURNAMENT_ID_PARAM) Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId, SimpleResult newData) throws BadRequestException, NotFoundException
    {
        try
        {
            newData.validate();
        }
        catch (Exception e)
        {
            throw new BadRequestException(e.getMessage());
        }

        Match match = ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
            throw new NotFoundException("match not found");

        match.setHole(newData.getH());
        match.setResult(newData.getR());
        match.setTimestamp(new Date());  // get current timestamp

        ofy().save().entity(match).now();
        return;
    }


}


