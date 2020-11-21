import * as React from 'react'
import { Button, createStyles, WithStyles, withStyles, TextField, Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions } from '@material-ui/core'
import { utils } from 'ethers'
import { useSdk } from '../utils/sdk'
import { loadTokenInfo, Token, encodeTransfer } from '../logic/tokenRepository'

const styles = createStyles({
    remove: {
        margin: '16px'
    },
    item: {
        flex: 1
    }
})

interface Props extends WithStyles<typeof styles> {
    open: boolean,
    tokenAddress: string,
    onClose: () => void
}

const SendTokenDialog: React.FC<Props> = ({ open, tokenAddress, onClose }) => {
    const sdk = useSdk()
    const [tokenInfo, setTokenInfo] = React.useState<Token | undefined>(undefined)
    const [receiver, setReceiver] = React.useState("")
    const [amount, setAmount] = React.useState("")
    const handleClose = React.useCallback(() => {
        setTokenInfo(undefined)
        setReceiver("")
        setAmount("")
        onClose()
    }, [onClose, setReceiver, setTokenInfo, setAmount])
    const sendToken = React.useCallback(async () => {
        if (!tokenInfo) return;
        try {
            const formattedAmount = utils.parseUnits(amount, tokenInfo.decimals)
            const transferTx = await encodeTransfer(tokenInfo.address, utils.getAddress(receiver), formattedAmount)
            await sdk.txs.send({ txs: [transferTx]})
            handleClose()
        } catch (e) {
            console.error(e)
        }
    }, [sdk, receiver, tokenInfo, amount, handleClose])
    React.useEffect(() => {
        const init = async() => {
            setTokenInfo(await loadTokenInfo(sdk.eth, tokenAddress))
        }
        init()
    }, [tokenAddress])
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            scroll="paper"
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description">
            <DialogTitle id="scroll-dialog-title">Send {tokenInfo?.symbol || ""}</DialogTitle>
            <DialogContent dividers={true}>
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                >
                    <TextField
                        label="Receiver"
                        onChange={(e) => {
                            setReceiver(e.target.value)
                        }}>
                        {tokenAddress}
                    </TextField>
                    <br />
                    <TextField
                        label="Amount"
                        onChange={(e) => {
                            setAmount(e.target.value)
                        }}>
                        {tokenAddress}
                    </TextField>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="default">
                    Cancel
                </Button>
                <Button onClick={sendToken} color="primary">
                    Send
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(SendTokenDialog)