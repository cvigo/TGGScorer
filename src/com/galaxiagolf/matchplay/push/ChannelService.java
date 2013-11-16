package com.galaxiagolf.matchplay.push;

import com.google.appengine.api.channel.ChannelServiceFactory;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 16/11/13
 * Time: 23:48
 * To change this template use File | Settings | File Templates.
 */
public class ChannelService
{
    static
    {
        ChannelService channelService = ChannelServiceFactory.getChannelService();
    }

    public static ChannelService()
    {
        return channelService;
    }
}