package com.galaxiagolf.matchplay.entity;

import com.googlecode.objectify.annotation.Embed;

import java.util.Date;

/**
 * Created with IntelliJ IDEA.
 * User: carlosvigo
 * Date: 11/07/13
 * Time: 08:45
 * To change this template use File | Settings | File Templates.
 */
@Embed
public class SimpleResult
{
    private Long id; // match id
    private Integer h; // hole
    private Integer r; // result
    private Date ts; // timestamp

    public SimpleResult(Long id, Integer h, Integer r, Date ts)
    {
        this.id = id;
        this.h = h;
        this.r = r;
        this.ts = ts;
    }

    public SimpleResult()
    {
    }

    public SimpleResult(Integer hole, Integer result)
    {
        this.setR(result); this.setH(hole); this.setTs(new Date());
    }

    public Long getId()
    {
        return id;
    }

    public void setId(Long id)
    {
        this.id = id;
    }

    public Integer getH()
    {
        return h;
    }

    public Integer getR()
    {
        return r;
    }

    public Date getTs()
    {
        return ts;
    }

    public void setH(Integer h)
    {
        this.h = h;
    }

    public void setR(Integer r)
    {
        this.r = r;
    }

    public void setTs(Date ts)
    {
        this.ts = ts;
    }


    @Override public String toString()
    {
        return "SimpleResult{" +
                "id=" + id +
                ", h=" + h +
                ", r=" + r +
                ", ts=" + ts +
                '}';
    }

    public boolean isValid()
    {
        try
        {
            validate();
        }
        catch (Exception e)
        {
            return false;
        }
        return true;

    }
    public void validate() throws Exception
    {
        if (this.getH()==null || this.getH()==null)
            throw new Exception("do not send empty results!!");

        int remaining = 18-this.getH().intValue();
        int absScore = Math.abs(this.getR().intValue());

        if ( absScore - remaining > 2 ) // advantage cannot exceed remaining holes in more than 2 (2 UP @18th is ok)
            throw new Exception("advantage cannot exceed remaining holes in more than 2 (2 UP @18th is ok)");

        if ( absScore > this.getH().intValue() ) // obvious, cannot take 4 in advance if I played 3 holes
            throw new Exception("Advantage cannot be bigger than played holes");

        if ( remaining < 0 )
            throw new Exception("Invalid hole number");
    }
}
