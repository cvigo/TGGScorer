package com.galaxiagolf;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 19/11/13
 * Time: 10:01
 * To change this template use File | Settings | File Templates.
 */
public class URIs
{
    public final static String TOURNAMENT_LIST_URI = "tournament";
    public final static String TOURNAMENT_ID_PARAM = "tournamentId";
    public final static String TOURNAMENT_URI = TOURNAMENT_LIST_URI + "/{" + TOURNAMENT_ID_PARAM + "}"; // http://server/tournament/1
    public final static String CHANNEL_TOKEN_LIST_URI = TOURNAMENT_URI + "/channel_token"; // http://server/tournament/1/channel_token
    public final static String CHANNEL_ID_PARAM = "clientId";
    public final static String CHANNEL_TOKEN_URI = CHANNEL_TOKEN_LIST_URI + "/{" + CHANNEL_ID_PARAM + "}"; // http://server/tournament/1/channel_token/2
    public final static String MATCH_ID_PARAM = "matchId";
    public final static String MATCH_LIST_URI = TOURNAMENT_URI + "/match"; // http://server/tournament/1/match
    public final static String MATCH_URI = MATCH_LIST_URI + "/{" + MATCH_ID_PARAM + "}"; // http://server/tournament/1/match/2
    public final static String RESULT_LIST_URI = TOURNAMENT_URI + "/result"; // http://server/tournament/1/result
    public final static String RESULT_URI = RESULT_LIST_URI + "/{" + MATCH_ID_PARAM + "}";  // http://server/tournament/1/result/2
}
