import React, { useCallback, useState } from 'react';
import './App.css';
import { utils } from 'ethers'
import { createStyles, withStyles, WithStyles, Button, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { useSdk } from './utils/sdk';
import { loadTrackedTokens, loadTokenInfo, loadTokenBalance, Balance, Token } from './logic/tokenRepository';
import SendTokenDialog from './dialogs/SendTokenDialog';
import AddTokenDialog from './dialogs/AddTokenDialog';

const styles = createStyles({
  list: {
  },
  content: {
  },
  itemText: {
    textAlign: 'end'
  }
})

const TokenImage: React.FC<{tokenAddress: string}> = ({ tokenAddress }) => {
  const [errored, setErrored] = useState(false)
  const url = `https://gnosis-safe-token-logos.s3.amazonaws.com/${tokenAddress}.png`
  return errored ? <></> : <img width={40} height={40} src={url} onError={() => setErrored(true)} />
}

const App: React.FC<WithStyles<typeof styles>> = ({ classes }) => {
  const sdk = useSdk()
  const [showAddToken, setShowAddToken] = useState<boolean>(false)
  const [transferToken, setTransferToken] = useState<Token | undefined>(undefined)
  const [balances, setBalances] = useState<Balance[]>([])
  const loadBalances = React.useCallback(async () => {
    try {
      console.log("LOAD TOKENS")
      const trackedTokens = await loadTrackedTokens()
      const tokensInfo: Balance[] = await Promise.all(Object.entries(trackedTokens).map(async ([address]) => {
        return {
          token: await loadTokenInfo(sdk.eth, address)
        }
      }))
      setBalances(tokensInfo)
      const accountInfo = await sdk.getSafeInfo()
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
    loadBalances()
  }, [loadBalances])
  if (balances.length < 1) return (<CircularProgress />)
  return <>
    <List>
      {balances.map((b) => (
        <ListItem button={true} onClick={() => setTransferToken(b.token)}>
          <ListItemIcon>
            <TokenImage tokenAddress={b.token.address} />
          </ListItemIcon>
          <ListItemText className={classes.itemText} primary={`${b.balance || "0"} ${b.token.symbol}`} />
        </ListItem>
      ))}
      <ListItem><Button onClick={() => setShowAddToken(true)}>Add Token</Button></ListItem>
    </List>
    <AddTokenDialog open={showAddToken} onClose={() => { setShowAddToken(false); loadBalances() }} />
    <SendTokenDialog open={!!transferToken} tokenAddress={transferToken?.address || ""} onClose={() => setTransferToken(undefined)}/>
  </>
}

export default withStyles(styles)(App)
