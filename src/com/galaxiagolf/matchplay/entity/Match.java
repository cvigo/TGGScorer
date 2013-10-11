package com.galaxiagolf.matchplay.entity;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

import java.util.Date;


/**
 * Represents a single Match, containing player Nicks, tee time and zero-indexed order in the group (0 or 1)
 * It does not contain the match result. That is stored in MatchResults Objects
 */
@Entity
public class Match
{
    @Id private Long id;
    //@Parent Key<Tournament> tournamentKey;
    private String rightPlayer;

    private Date startTime;
    private Integer orderInGroup; // typically 0 or 1, as one group = 2 individual matches
    private Integer result;
    private Integer hole;
    private Date timestamp;
    private String resultURI;

    @Override public String toString()
    {
        return "Match{" +
                "id=" + id +
                ", leftPlayer='" + leftPlayer + '\'' +
                ", rightPlayer='" + rightPlayer + '\'' +
                ", startTime=" + startTime +
                ", orderInGroup=" + orderInGroup +
                ", hole=" + hole +
                ", result=" + result +
                ", resultURI='" + resultURI + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }


    public Integer getResult()
    {
        return result;
    }

//    public Key<Tournament> getTournamentKey()
//    {
//        return tournamentKey;
//    }
//
//    public void setTournamentKey(Key<Tournament> tournamentKey)
//    {
//        this.tournamentKey = tournamentKey;
//    }
    private String leftPlayer;

    public void setResult(Integer result)
    {
        this.result = result;
    }

    public Integer getHole()
    {
        return hole;
    }

    public void setHole(Integer hole)
    {
        this.hole = hole;
    }

    public Match()
    {
    }


    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public String getLeftPlayer()
    {
        return leftPlayer;
    }

    public void setLeftPlayer(String leftPlayer)
    {
        this.leftPlayer = leftPlayer;
    }

    public String getRightPlayer()
    {
        return rightPlayer;
    }

    public void setRightPlayer(String rightPlayer)
    {
        this.rightPlayer = rightPlayer;
    }

    public Date getStartTime()
    {
        return startTime;
    }

    public void setStartTime(Date startTime)
    {
        this.startTime = startTime;
    }

    public Integer getOrderInGroup()
    {
        return orderInGroup;
    }

    public void setOrderInGroup(Integer orderInGroup)
    {
        this.orderInGroup = orderInGroup;
    }


    public boolean validateAsNewObject()
    {
        return (
                this.getLeftPlayer() != null &&
                ! this.getLeftPlayer().isEmpty() &&
                this.getRightPlayer() != null &&
                ! this.getRightPlayer().isEmpty() &&
                this.getStartTime() != null &&
                this.getOrderInGroup() >=0
        );
    }

    public Date getTimestamp()
    {
        return timestamp;
    }

    public void setTimestamp(Date timestamp)
    {
        this.timestamp = timestamp;
    }

    public String getResultURI()
    {
        return resultURI;
    }

    public void setResultURI(String resultURI)
    {
        this.resultURI = resultURI;
    }


}
