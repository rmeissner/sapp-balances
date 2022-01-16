import React, { useCallback, useState } from 'react';
import './App.css';
import { utils } from 'ethers'
import { createStyles, withStyles, WithStyles, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { useSdk } from './utils/sdk';
import { loadTrackedTokens, loadTokenInfo, loadTokenBalance, Balance, Token } from './logic/tokenRepository';
import SendTokenDialog from './dialogs/SendTokenDialog';
import AddTokenDialog from './dialogs/AddTokenDialog';
import RemoveTokenDialog from './dialogs/RemoveTokenDialog';

const styles = createStyles({
  list: {
  },
  content: {
  },
  itemText: {
    textAlign: 'end'
  }
})

const TokenImage: React.FC<{ tokenAddress: string }> = ({ tokenAddress }) => {
  const [errored, setErrored] = useState(false)
  const url = `https://gnosis-safe-token-logos.s3.amazonaws.com/${tokenAddress}.png`
  return errored ? <></> : <img width={40} height={40} src={url} onError={() => setErrored(true)} />
}

const App: React.FC<WithStyles<typeof styles>> = ({ classes }) => {
  const sdk = useSdk()
  const [showAddToken, setShowAddToken] = useState<boolean>(false)
  const [manageTokens, setManageTokens] = useState<boolean>(false)
  const [transferToken, setTransferToken] = useState<Token | undefined>(undefined)
  const [removeToken, setRemoveToken] = useState<Token | undefined>(undefined)
  const [balances, setBalances] = useState<Balance[]>([])
  const loadBalances = React.useCallback(async () => {
    try {
      const trackedTokens = await loadTrackedTokens()
      const tokensInfo: Balance[] = await Promise.all(Object.entries(trackedTokens).map(async ([address]) => {
        return {
          token: await loadTokenInfo(sdk.eth, address)
        }
      }))
      const accountInfo = await sdk.safe.getInfo()
      const balances = await Promise.all(tokensInfo.map(async (info) => {
        try {
          console.log(info.token.address, accountInfo.safeAddress)
          const balance = await loadTokenBalance(sdk.eth, info.token.address, accountInfo.safeAddress)
          info.balance = utils.formatUnits(balance, info.token.decimals)
        } catch (e) {
          console.error(e)
        }
        return info
      }))
      setBalances(balances)
    } catch (e) {
      console.error(e)
    }
  }, [sdk])
  React.useEffect(() => {
    let timeout: number | undefined = undefined
    const scheduleUpdate = async () => {
      await loadBalances()
      timeout = setTimeout(scheduleUpdate, 10000);
    }
    scheduleUpdate()
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [loadBalances])
  return <>
    <List>
      {balances.map((b) => (
        <ListItem button={!(manageTokens && !b.token.address) as any} onClick={() => manageTokens ? setRemoveToken(b.token) : setTransferToken(b.token)}>
          {!manageTokens && (
            <ListItemIcon>
              <TokenImage tokenAddress={b.token.address} />
            </ListItemIcon>
          )}
          {manageTokens && !!b.token.address && (
            <ListItemIcon style={{ width: 24, height: 24, padding: 8 }}>
              <Delete />
            </ListItemIcon>
          )}
          <ListItemText className={classes.itemText} primary={`${b.balance || "0"} ${b.token.symbol}`} />
        </ListItem>
      ))}
      {balances.length === 0 && (
        <ListItem><CircularProgress /></ListItem>
      )}
      {manageTokens && (<>
        <ListItem><Button onClick={() => setShowAddToken(true)}>Add Token</Button></ListItem>
        <ListItem><Button onClick={() => setManageTokens(false)}>Done</Button></ListItem>
      </>)}
      {!manageTokens && (
        <ListItem><Button onClick={() => setManageTokens(true)}>Manage Tokens</Button></ListItem>
      )}
    </List>
    <AddTokenDialog open={showAddToken} onClose={() => {
      setShowAddToken(false)
      loadBalances()
      setManageTokens(false)
    }} />
    <SendTokenDialog open={!!transferToken} tokenAddress={transferToken?.address || ""} onClose={() => setTransferToken(undefined)} />
    <RemoveTokenDialog token={removeToken} onClose={() => {
      setRemoveToken(undefined)
      loadBalances()
      setManageTokens(false)
    }} />
  </>
}

export default withStyles(styles)(App)
