package com.galaxiagolf.matchplay.entity;

import com.googlecode.objectify.Key;
import com.googlecode.objectify.Ref;
import com.googlecode.objectify.annotation.Cache;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Load;

import java.util.ArrayList;
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
public class Tournament extends TournamentPOJO
{
    //Inner classes for partial loads
    public static class NoResults{}

    @Id private Long id;
    @Load(unless=NoResults.class) private List<Ref<Match>> matches = new ArrayList<>();

    public Tournament()
    {
    }

    @Override public String toString()
    {
        return "Tournament{" +
                "id=" + id +
                ", matches=" + matches +
                '}';
    }

    public Tournament(TournamentPOJO pojo)
    {
        this.setGameDate(pojo.getGameDate());
        this.setLeftTeamName(pojo.getLeftTeamName());
        this.setRightTeamName(pojo.getRightTeamName());
        this.setId(null);
    }

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public List<Ref<Match>> getMatches()
    {
        return matches;
    }

    public void setMatches(List<Ref<Match>> matches)
    {
        this.matches = matches;
    }

    public void addMatch(Key<Match> newMatch)
    {
        this.getMatches().add(Ref.create(newMatch));
    }


}


