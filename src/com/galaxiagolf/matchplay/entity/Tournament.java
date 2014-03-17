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
 */

@Entity
@Cache
public class Tournament
{
    @Id
    private Long id;

    @Load(unless=NoResults.class)
    private List<Ref<Match>> matches;

    @Ignore
    private List<Match> matchesInternal; // this will store the matches deserialised from JSON input messages, it won't be used for actual data storing

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

    public Tournament clean()
    {
        this.setPassKey(null);
        return this;
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
                        ! this.getRightTeamName().isEmpty() &&
                        this.getPassKey() != null &&
                        this.getPassKey().length() > 3
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
                ", matches=" + getMatchesInternal() +
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
    public List<Ref<Match>> getMatchRefs()
    {
        return matches;
    }

    @ApiResourceProperty(ignored = AnnotationBoolean.TRUE)
    public void setMatchRefs(List<Ref<Match>> refs)
    {
        matches.clear();
        matches = refs;
    }

    public List<Match> getMatches()
    {
        List<Match> ret = new ArrayList<>();
        Iterator<Ref<Match>> it = matches.iterator();
        while (it.hasNext())
        {
            Ref<Match> m = it.next();
            if ( m.isLoaded() && m.getValue() != null )
                ret.add(m.getValue().clean());
        }

        return ret;

    }

    @ApiResourceProperty(ignored = AnnotationBoolean.TRUE)
    public List<Match> getMatchesInternal()
    {
        return matchesInternal;
    }

    public void setMatches(List<Match> matches)     // only used to deserialize JSON input messages, it won't be used for actual data storing
    {
        this.matchesInternal = matches;
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


