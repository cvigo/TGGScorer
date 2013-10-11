package com.galaxiagolf.matchplay.entity;

import java.util.Date;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 11/07/13
 * Time: 01:07
 * Need to create a POJO class for Tournament, as AppEngine endpoints cannot serialize Objectify types (Key, Ref, etc.)
 */
public class TournamentPOJO
{
    private Date gameDate;
    private String leftTeamName;
    private String rightTeamName;
    //TODO: add background colours for the teams and URL to the logo

    public TournamentPOJO()
    {
    }

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
}