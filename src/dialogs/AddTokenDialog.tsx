import * as React from 'react'
import { Button, createStyles, WithStyles, withStyles, TextField, Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions } from '@material-ui/core'
import { useSdk } from '../utils/sdk'
import { loadTokenInfo, trackToken } from '../logic/tokenRepository'

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
    onClose: () => void
}

const AddTokenDialog: React.FC<Props> = ({ open, onClose }) => {
    const sdk = useSdk()
    const [tokenAddress, setTokenAddress] = React.useState("")
    const handleClose = React.useCallback(() => {
        setTokenAddress("")
        onClose()
    }, [onClose, setTokenAddress])
    const addToken = React.useCallback(async () => {
        try {
            await loadTokenInfo(sdk.eth, tokenAddress)
            await trackToken(tokenAddress)
            handleClose()
        } catch (e) {
            console.error(e)
        }
    }, [sdk, tokenAddress, setTokenAddress, handleClose])
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            scroll="paper"
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description">
            <DialogTitle id="scroll-dialog-title">Add a Token</DialogTitle>
            <DialogContent dividers={true}>
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                >
                    <TextField
                        label="Token address"
                        onChange={(e) => {
                            setTokenAddress(e.target.value)
                        }}>
                        {tokenAddress}
                    </TextField>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="default">
                    Cancel
                </Button>
                <Button onClick={addToken} color="primary">
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(AddTokenDialog)