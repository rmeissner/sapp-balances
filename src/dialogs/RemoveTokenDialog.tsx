import * as React from 'react'
import { Button, createStyles, WithStyles, withStyles, TextField, Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions, Typography } from '@material-ui/core'
import { utils } from 'ethers'
import { useSdk } from '../utils/sdk'
import { loadTokenInfo, Token, encodeTransfer, untrackToken } from '../logic/tokenRepository'

const styles = createStyles({
    remove: {
        margin: '16px'
    },
    item: {
        flex: 1
    }
})

interface Props extends WithStyles<typeof styles> {
    token: Token | undefined,
    onClose: () => void
}

const RemoveTokenDialog: React.FC<Props> = ({ token, onClose }) => {
    const sdk = useSdk()
    const removeToken = React.useCallback(async () => {
        if (!token) return;
        try {
            await untrackToken(token.address)
            onClose()
        } catch (e) {
            console.error(e)
        }
    }, [sdk, token, onClose])
    return (
        <Dialog
            open={!!token?.address}
            onClose={onClose}
            scroll="paper"
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description">
            <DialogTitle id="scroll-dialog-title">Send {token?.symbol || ""}</DialogTitle>
            <DialogContent dividers={true}>
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                >
                    Are you sure that you want to remove {token?.symbol}<br />
                    <br />
                    <b>Address:</b><br />{token?.address.slice(0, 21)}<br />{token?.address.slice(21)}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="default">
                    Cancel
                </Button>
                <Button onClick={removeToken} color="primary">
                    Remove
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(RemoveTokenDialog)