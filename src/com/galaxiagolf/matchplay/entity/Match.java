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
    private String leftPlayer;

    private Date startTime;
    private Integer orderInGroup; // typically 0 or 1, as one group = 2 individual matches
    private SimpleResult result;
    private String resultURI;

    private String passKey;

    @Override public String toString()
    {
        return "Match{" +
                "id=" + id +
                ", leftPlayer='" + leftPlayer + '\'' +
                ", rightPlayer='" + rightPlayer + '\'' +
                ", startTime=" + startTime +
                ", orderInGroup=" + orderInGroup +
                ", resultURI='" + resultURI + '\'' +
                ", result=" + result +
                '}';
    }


    public SimpleResult getResult()
    {
        return result;
    }


    public String getPassKey()
    {
        return passKey;
    }

    public void setPassKey(String passKey)
    {
        this.passKey = passKey;
    }


    public void setResult(SimpleResult result)
    {
        this.result = result;
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
        if (this.getResult()== null)
        {
            this.setResult(new SimpleResult(0,0));
        }
        return (
                this.getLeftPlayer() != null &&
                ! this.getLeftPlayer().isEmpty() &&
                this.getRightPlayer() != null &&
                ! this.getRightPlayer().isEmpty() &&
                this.getStartTime() != null &&
                this.getOrderInGroup() >=0 &&
                this.getResult() != null &&
                this.getResult().isValid()
        );
    }


    public String getResultURI()
    {
        return resultURI;
    }

    public void setResultURI(String resultURI)
    {
        this.resultURI = resultURI;
    }

    public void updateFrom(Match newData)
    {
        if (this.getResult()== null)
            this.setResult(new SimpleResult(0,0));

        if (newData.getLeftPlayer() != null && !newData.getLeftPlayer().isEmpty()) setLeftPlayer(newData.getLeftPlayer());
        if (newData.getRightPlayer() != null && !newData.getRightPlayer().isEmpty()) setRightPlayer(newData.getRightPlayer());
        if (newData.getStartTime() != null) setStartTime(newData.getStartTime());
        if (newData.getOrderInGroup() != null) setOrderInGroup(newData.getOrderInGroup());
        if (newData.getResult() != null && newData.getResult().isValid()) setResult(newData.getResult());
        if (newData.getPassKey() != null && !newData.getPassKey().isEmpty() ) setPassKey(newData.getPassKey());

        getResult().setTs(new Date());
    }

    public Match clean()
    {
        this.setPassKey(null);
        return this;
    }


}
