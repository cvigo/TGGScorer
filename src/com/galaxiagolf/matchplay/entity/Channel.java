package com.galaxiagolf.matchplay.entity;

import com.googlecode.objectify.annotation.Cache;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;

import java.util.Date;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 18/11/13
 * Time: 15:35
 * Channel class is used to store AppEngine channel tokens in the persistence manager
 */
@Entity
@Cache
public class Channel
{
    @Id private Long id;
    @Index private Long tournamentId;
    @Index private String clientId;
    private String token; // actually we use the Storage manager auto generated key as channel token
    private Date expirationTime;

    public Channel()
    {
    }

    public Channel(Long tournamentId, String clientId, Date expirationTime, String token)
    {
        this.tournamentId = tournamentId;
        this.clientId = clientId;
        this.expirationTime = expirationTime;
        this.token = token;
    }

    public Long getTournamentId()
    {
        return tournamentId;
    }

    public void setTournamentId(Long tournamentId)
    {
        this.tournamentId = tournamentId;
    }

    public String getClientId()
    {
        return clientId;
    }

    public void setClientId(String clientId)
    {
        this.clientId = clientId;
    }

    public String getToken()
    {
        return token;
    }

    public void setToken(String token)
    {
        this.token = token;
    }

    public Date getExpirationTime()
    {
        return expirationTime;
    }

    public void setExpirationTime(Date expirationTime)
    {
        this.expirationTime = expirationTime;
    }

    @Override public String toString()
    {
        return "Channel{" +
                "clientId='" + clientId + '\'' +
                ", token='" + token + '\'' +
                ", expirationTime=" + expirationTime +
                '}';
    }
}
