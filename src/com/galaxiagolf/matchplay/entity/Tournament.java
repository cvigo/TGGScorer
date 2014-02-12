package com.galaxiagolf.matchplay.entity;

import com.google.api.server.spi.config.AnnotationBoolean;
import com.google.api.server.spi.config.ApiResourceProperty;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.Ref;
import com.googlecode.objectify.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 04/06/13
 * Time: 01:04
 * Need to create a POJO class for Tournament, as AppEngine endpoints cannot serialize Objectify types (Key, Ref, etc.)
 */

@Entity
@Cache
public class Tournament
{
    @Id private Long id;

    @Load(unless=NoResults.class)
    private List<Ref<Match>> matches;

    private Date gameDate;
    private String leftTeamName;
    private String rightTeamName;
    @Index private String passKey;

    public Date getGameDate()
    {
        return gameDate;
    }

    public void setGameDate(Date gameDate)
    {
        this.gameDate = gameDate;
    }

    public String getLeftTeamName()
    {
        return leftTeamName;
    }

    public void setLeftTeamName(String leftTeamName)
    {
        this.leftTeamName = leftTeamName;
    }

    public String getRightTeamName()
    {
        return rightTeamName;
    }

    public void setRightTeamName(String rightTeamName)
    {
        this.rightTeamName = rightTeamName;
    }

    public String getPassKey()
    {
        return passKey;
    }

    public void setPassKey(String passKey)
    {
        this.passKey = passKey;
    }

    //Inner classes for partial loads
    public static class NoResults{}

    // validates if the object can be stores, checking required properties
    public boolean validateAsNewObject()
    {
        return (
                this.getGameDate() != null &&
                        this.getLeftTeamName() != null &&
                        ! this.getLeftTeamName().isEmpty() &&
                        this.getRightTeamName() != null &&
                        ! this.getRightTeamName().isEmpty()
        );
    }

    public Tournament()
    {
        matches = new ArrayList<>();
    }

    @Override public String toString()
    {
        return "Tournament{" +
                "id=" + id +
                ", matches=" + getMatches() +
                '}';
    }


    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    @ApiResourceProperty(ignored = AnnotationBoolean.TRUE)
    public List<Ref<Match>> getMatchKeys()
    {
        return matches;
    }

    public List<Match> getMatches()
    {
        List<Match> ret = new ArrayList<>();
        Iterator<Ref<Match>> it = matches.iterator();
        while (it.hasNext())
        {
            Ref<Match> m = it.next();
            if ( m.isLoaded() )
                ret.add(m.getValue());
        }

        return ret;

    }


    public void addMatches(List<Match> newMatches)
    {
        Iterator<Match> it = newMatches.iterator();

        while (it.hasNext())
            addMatch(it.next());
    }

    public void addMatch(Key<Match> newMatch)
    {
        matches.add(Ref.create(newMatch));
    }
    public void addMatch(Match newMatch)
    {
        matches.add(Ref.create(newMatch));
    }

    public boolean removeMatchRef(Ref<Match> m)
    {
        return matches.remove(m);
    }

    public boolean removeMatchRef(Match m)
    {
        return removeMatchRef(m.getId());
    }

    public boolean removeMatchRef(Long id)
    {
        Iterator<Ref<Match>> it = matches.iterator();
        while (it.hasNext())
        {
            Ref<Match> matchRef = it.next();
            if ( matchRef.getKey().getId() == id )
                return matches.remove(matchRef);
        }
        return false;
    }

    public void updateFrom(Tournament newData)
    {
        if (newData.getGameDate() != null ) setGameDate(newData.getGameDate());
        if (newData.getLeftTeamName() != null && !newData.getLeftTeamName().isEmpty() ) setLeftTeamName(newData.getLeftTeamName());
        if (newData.getRightTeamName() != null && !newData.getRightTeamName().isEmpty() ) setRightTeamName(newData.getRightTeamName());
        if (newData.getPassKey() != null && !newData.getPassKey().isEmpty() ) setPassKey(newData.getPassKey());
    }
}


