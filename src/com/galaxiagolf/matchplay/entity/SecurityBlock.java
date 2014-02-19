package com.galaxiagolf.matchplay.entity;

/**
 * Created by carlosvigo on 12/02/14.
 * Used to pass security info to the endpoints that write data.
 */
public class SecurityBlock
{
    private String passKey;

    public String getPassKey()
    {
        return passKey;
    }

    public void setPassKey(String passKey)
    {
        this.passKey = passKey;
    }
}
