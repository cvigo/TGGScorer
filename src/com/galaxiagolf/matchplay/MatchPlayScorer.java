package com.galaxiagolf.matchplay;


/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * User: carlosvigo
 * Date: 02/06/13
 * Time: 19:13
 * To change this template use File | Settings | File Templates.
 */


import com.galaxiagolf.matchplay.entity.Match;
import com.galaxiagolf.matchplay.entity.SimpleResult;
import com.galaxiagolf.matchplay.entity.Tournament;
import com.google.api.server.spi.ServiceException;
import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.ApiMethod.HttpMethod;
import com.google.api.server.spi.config.ApiMethodCacheControl;
import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.NotFoundException;
import com.google.api.server.spi.response.UnauthorizedException;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.Ref;
import com.googlecode.objectify.VoidWork;
import com.googlecode.objectify.Work;

import javax.annotation.Nullable;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;
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
            name = "mpscorerapi.postTournament",
            path = TOURNAMENT_LIST_URI,              // http://server/tournament/1/
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Tournament postTournament(Tournament newTournament) throws ServiceException
    {
        // check data integrity
        if ( !newTournament.validateAsNewObject() )
            throw new BadRequestException("invalid input parameters!" );

        return putTournament(null, null, newTournament);
/*
        Key<Tournament> ret = ofy().save().entity(newTournament).now();
        newTournament.setId(ret.getId());

        return newTournament;
*/
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
    public Tournament getTournament(@Named (TOURNAMENT_ID_PARAM) Long tournamentId, @Named("getResults") @Nullable Boolean getResults) throws NotFoundException
    {
        Tournament tournament =  ofy().load().type(Tournament.class).id(tournamentId).now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");

        if (getResults!= null && getResults == false)
        {
            Iterator<Match> matches = tournament.getMatches().iterator();
            while (matches.hasNext())
            {
                Match match = matches.next();

                match.setResult(null);
                match.setResultURI(TOURNAMENT_LIST_URI + "/" + tournamentId.toString() + "/result/" + match.getId().toString());
            }
        }
        return tournament.clean();
    }

    // Find method for a Tournament. Search criteria supported: passKey only
    @ApiMethod(
            name = "mpscorerapi.searchTournament",
            path = TOURNAMENT_LIST_URI,
            httpMethod = HttpMethod.GET
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Tournament searchTournament(@Named("passKey") @Nullable String passKey) throws NotFoundException
    {
        Tournament tournament =  ofy().load().group(Tournament.NoResults.class).type(Tournament.class).filter("passKey", passKey).first().now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");
        else
            return tournament.clean();
    }

    // Simple update method for a Tournament. It does not update tournament matches, just date and teams
    @ApiMethod(
            name = "mpscorerapi.putTournament",
            path = TOURNAMENT_URI,
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Tournament putTournament(HttpServletRequest req, @Named(TOURNAMENT_ID_PARAM) Long tournamentId, Tournament newData) throws ServiceException
    {
        Tournament theTournament = null;
        if (tournamentId==null)
        {
            if ( !newData.validateAsNewObject() )
                throw new BadRequestException("invalid input parameters!" );
            theTournament = new Tournament();
        }
        else
        {
            theTournament = ofy().load().type(Tournament.class).id(tournamentId).now();
            if (theTournament==null)
                throw new NotFoundException("tournament not found");
            checkAccessToken(req, theTournament);
        }

        // update only the properties passed in the REST call
        theTournament.updateFrom(newData);

        // Now the matches
        Iterator<Match> it = newData.getMatchesInternal().iterator();
        while (it.hasNext())
        {
            Match m = it.next();
            m.setPassKey(newData.getPassKey());


            if (m.getId()==null) // new match
            {
                if (!m.validateAsNewObject())
                    throw new BadRequestException("Match id=" + m.getId() + " is not well formed");

                Key<Match> matchKey = ofy().save().entity(m).now();
                theTournament.addMatch(matchKey);
            }
            else // existing match
            {
                Match match = ofy().load().type(Match.class).id(m.getId()).now();
                checkAccessToken(req, match);
                if (match == null)
                    throw new BadRequestException("Match id=" + m.getId() + " not found in database. Please send an empty ID if you want to create a new Match");

                match.updateFrom(m);
                match.setPassKey(newData.getPassKey());
                ofy().save().entity(match).now();
            }
        }

        // delete matches that didn't come in the PUT payload
        Iterator<Ref<Match>> it2 = theTournament.getMatchRefs().iterator();
        List<Ref<Match>> toKeep = new ArrayList<>();
        while ( it2.hasNext() )
        {
            boolean found = false;
            Ref<Match> m = it2.next();
            Long mId = m.getKey().getId(); // to avoid java.util.ConcurrentModificationException
            it = newData.getMatchesInternal().iterator();

            // not using .contains(Object o) to avoid indentifying changed items as deleted items.
            while ( it.hasNext() )
            {
                if (found = (it.next().getId() == m.getKey().getId()))
                    break;
            }

            if (found)
                toKeep.add(m);
            else
                ofy().delete().type(Match.class).id(mId).now();
        }

        theTournament.setMatchRefs(toKeep);
        ofy().save().entity(theTournament).now();
        return theTournament.clean();
    }

    private void checkAccessToken(HttpServletRequest req, Tournament theTournament) throws UnauthorizedException
    {
        System.out.println("Tournament pass key: " + theTournament.getPassKey());
        System.out.println("Validating request. x-PassKey=" + req.getHeader("x-PassKey"));
        if ( theTournament.getPassKey() != null && !theTournament.getPassKey().equals(req.getHeader("x-PassKey")) )
            throw new UnauthorizedException("upps... who are you?");
    }

    private void checkAccessToken(HttpServletRequest req, Match theMatch) throws UnauthorizedException
    {
        System.out.println("Match pass key: " + theMatch.getPassKey());
        System.out.println("Validating request. x-PassKey=" + req.getHeader("x-PassKey"));
        if ( theMatch.getPassKey() != null && !theMatch.getPassKey().equals(req.getHeader("x-PassKey")) )
            throw new UnauthorizedException("upps... who are you?");
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
    public void deleteTournament(final HttpServletRequest req, @Named(TOURNAMENT_ID_PARAM) final Long tournamentId, Tournament newData) throws ServiceException
    {
            // will make a few writes, so let's use a transaction for data integrity
            ofy().transact(new VoidWork()
            {
                @Override public void vrun()
                {
                    Tournament theTournament = ofy().load().group(Tournament.NoResults.class).type(Tournament.class).id(tournamentId).now();
                    if (theTournament == null)
                        throw new RuntimeException(new NotFoundException("tournament not found"));

                    try{checkAccessToken(req, theTournament);} catch (Exception e){throw new RuntimeException(e);}

                    List<Ref<Match>> matches = theTournament.getMatchRefs();

                    //Datastore transactions are limited to 5 entity groups
                    if (matches.size() > 4)
                        ofy().transactionless().delete().entities(matches);
                    else
                        ofy().delete().entities(matches);

                    ofy().delete().type(Tournament.class).id(tournamentId);
                }
            });
    }


    ///// INDIVIDUAL MATCHES STUFF /////

    // Add match method, for an existing tournament
    @ApiMethod(
            name = "mpscorerapi.postMatch",
            path = MATCH_LIST_URI,
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Tournament postMatch(final HttpServletRequest req, @Named(TOURNAMENT_ID_PARAM) final Long tournamentId, final Match newMatch) throws ServiceException
    {
        // check data integrity
        if ( !newMatch.validateAsNewObject() )
            throw new BadRequestException("invalid input parameters!" );

        newMatch.getResult().setTs(new Date());

        // will make a few writes, so let's use a transaction for data integrity
        Tournament th = ofy().transact(new Work<Tournament>()
        {
            @Override public Tournament run()
            {
                Tournament theTournament = ofy().load().group(Tournament.NoResults.class).type(Tournament.class).id(tournamentId).now();
                if (theTournament == null)
                    throw new RuntimeException(new NotFoundException("tournament not found"));

                try{checkAccessToken(req, theTournament);} catch (Exception e){throw new RuntimeException(e);}

                newMatch.setPassKey(theTournament.getPassKey());
                Key<Match> matchKey = ofy().save().entity(newMatch).now();
                theTournament.addMatch(matchKey);
                ofy().save().entity(theTournament).now();
                return theTournament;
            }
        });
        return th.clean();
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
    public Match getMatch(@Named(TOURNAMENT_ID_PARAM) final Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId) throws ServiceException
    {
        Match match =  ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
        {
            throw new NotFoundException("match not found");
        }

        return match.clean();

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
    public void deleteMatch(final HttpServletRequest req, @Named(TOURNAMENT_ID_PARAM) final Long tournamentId, @Named(MATCH_ID_PARAM) final Long matchId) throws ServiceException
    {
        // will make a few writes, so let's use a transaction for data integrity
        Tournament th = ofy().transact(new Work<Tournament>()
        {
            @Override public Tournament run()
            {
                Tournament theTournament = ofy().load().group(Tournament.NoResults.class).type(Tournament.class).id(tournamentId).now();
                if (theTournament == null)
                    throw new RuntimeException(new NotFoundException("tournament not found"));

                try{checkAccessToken(req, theTournament);} catch (Exception e){throw new RuntimeException(e);}

                if(theTournament.removeMatchRef(matchId))
                {
                    ofy().save().entity(theTournament).now();
                    ofy().delete().type(Match.class).id(matchId).now();
                    return theTournament;
                }
                else
                    throw new RuntimeException(new NotFoundException("tournament/match not found"));
            }
        });

    }

    // Updates the match data
    @ApiMethod(
            name = "mpscorerapi.putMatch",
            path = MATCH_URI,           // http://server/tournament/1/match/2
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Match putMatch(HttpServletRequest req, @Named(TOURNAMENT_ID_PARAM) Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId, Match newData) throws ServiceException
    {

        Match match = ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
            throw new NotFoundException("match not found");
        checkAccessToken(req, match);

        // update only the properties passed in the REST call
        match.updateFrom(newData);
        ofy().save().entity(match).now();
        return match.clean();
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
    public Tournament getTournamentNoResults(@Named(TOURNAMENT_ID_PARAM) Long tournamentId) throws ServiceException
    {
        Tournament tournament =  ofy().load().type(Tournament.class).id(tournamentId).now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");

        Iterator<Match> matches = tournament.getMatches().iterator();
        while (matches.hasNext())
        {
            Match match = matches.next();

            match.setResult(null);
            match.setResultURI(TOURNAMENT_LIST_URI + "/" + tournamentId.toString() + "/result/" + match.getId().toString());
        }
        return tournament.clean();
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
    public List<SimpleResult> getAllResults(@Named(TOURNAMENT_ID_PARAM) Long tournamentId) throws ServiceException
    {
        Tournament tournament =  ofy().load().type(Tournament.class).id(tournamentId).now();
        if (tournament==null)
            throw new NotFoundException("tournament not found");

        Iterator<Match> matches = tournament.getMatches().iterator();
        List<SimpleResult> ret = new ArrayList<>();

        while (matches.hasNext())
        {
            Match match = matches.next();
            ret.add(match.getResult());
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
    public SimpleResult getMatchResult(@Named(TOURNAMENT_ID_PARAM) Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId) throws ServiceException
    {
        Match match = ofy().load().type(Match.class).id(matchId).now();
        if (match==null)
            throw new NotFoundException("match not found");

        return match.getResult();
    }


    // Updates the match result only. This is used by the players when they press the "send result" button from their mobiles
    // so we do not return anything to save bandwidth. Match ID in the payload and Timestamp are ignored if sent by the client.
    @ApiMethod(
            name = "mpscorerapi.postMatchResult",
            path = RESULT_URI,
            httpMethod = HttpMethod.POST
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public void postMatchResult(HttpServletRequest req, @Named(TOURNAMENT_ID_PARAM) Long tournamentId, @Named(MATCH_ID_PARAM) Long matchId, SimpleResult newData) throws ServiceException
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
        checkAccessToken(req, match);

        if ( match.getResult().getH() != newData.getH() || match.getResult().getR() != newData.getR() )
        {
            match.setResult(newData);
            match.getResult().setTs(new Date());  // get current timestamp

            ofy().save().entity(match).now();
        }
    }


}


