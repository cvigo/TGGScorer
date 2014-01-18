package com.galaxiagolf.push;

import com.galaxiagolf.URIs;
import com.galaxiagolf.entity.Channel;
import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.response.BadRequestException;
import com.google.api.server.spi.response.NotFoundException;
import com.google.appengine.api.channel.ChannelMessage;
import com.google.appengine.api.channel.ChannelService;
import com.google.appengine.api.channel.ChannelServiceFactory;
import com.googlecode.objectify.Key;

import javax.inject.Named;
import java.util.Date;
import java.util.Iterator;

import static com.galaxiagolf.matchplay.OfyService.ofy;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 16/11/13
 * Time: 23:48
 * Manages the push notifications via AppEngine channels
 */

@Api(
        name = "channels",
        version = "v1",
        description = "Galaxia Golf Tournament online scorer API - push notifications management"
//        scopes = {"ss0", "ss1"},
//        audiences = {"aa0", "aa1"},
//        clientIds = {"cc0", "cc1"},
//        defaultVersion = AnnotationBoolean.TRUE
)
public class PushSrv
{

    private static final int tokenLife = 7*60; // 7 hours, in minutes


    // Creates a channel token for the client, identified by client_id. Operation is idempotent (PUT)
    @ApiMethod(
            name = "mpscorerapi.getChannel",
            path = URIs.CHANNEL_TOKEN_URI,
            httpMethod = ApiMethod.HttpMethod.PUT
//            scopes = {"s0", "s1"},
//            audiences = {"a0", "a1"},
//            clientIds = {"c0", "c1"}
    )
    public Channel getChannel(@Named(URIs.TOURNAMENT_ID_PARAM) Long tournamentId, @Named(URIs.CHANNEL_ID_PARAM) String clientId) throws BadRequestException, NotFoundException
    {
        // create only if necessary
        Channel ch = ofy().load().type(Channel.class).filter("clientId", clientId).filter("tournamentId", tournamentId).first().now();

        if (ch==null)
        {
            ChannelService channelService = ChannelServiceFactory.getChannelService();
            String token = channelService.createChannel(getChannelKey(tournamentId, clientId), tokenLife);
            ch = new Channel(tournamentId, clientId, new Date(), token); //TODO: calculale token timeout;
            Key<Channel> key = ofy().save().entity(ch).now();
        }

        return ch;
    }

    public static String getChannelKey(Long tournamentId, String clientId)
    {
        return clientId + "_" + tournamentId.toString();
    }


    public static void sendUpdateToClients(Long tournamentId, String message) throws NotFoundException
    {
        Iterator<Channel> clients = ofy().load().type(Channel.class).filter("tournamentId", tournamentId).list().iterator();

        if (clients==null)
            throw new NotFoundException("tournament not found");

        ChannelService channelService = ChannelServiceFactory.getChannelService();

        while (clients.hasNext())
        {
            Channel client = clients.next();
            channelService.sendMessage(new ChannelMessage(getChannelKey(tournamentId, client.getClientId()), message));
        }

    }

}