package com.galaxiagolf.matchplay;

import com.galaxiagolf.entity.Channel;
import com.galaxiagolf.matchplay.entity.Match;
import com.galaxiagolf.matchplay.entity.Tournament;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyFactory;
import com.googlecode.objectify.ObjectifyService;


/**
 * Objectify registration stuff. Add here all @Entity classes to the static register methods
 */

public class OfyService
{
    static
    {
        factory().register(Match.class);
        factory().register(Tournament.class);
        factory().register(Channel.class);
        // add all @Entity classes here
    }

    public static Objectify ofy()
    {
        return ObjectifyService.ofy();
    }

    public static ObjectifyFactory factory()
    {
        return ObjectifyService.factory();
    }
}