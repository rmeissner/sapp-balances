import { BaseTransaction } from "@gnosis.pm/safe-apps-sdk";
import { Eth } from "@gnosis.pm/safe-apps-sdk/dist/src/eth"
import { utils, Contract, BigNumber } from "ethers"

const erc20Abi = [
    // Some details about the token
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint256)",

    // Get the account balance
    "function balanceOf(address) view returns (uint)",

    // Send some of your tokens to someone else
    "function transfer(address to, uint amount)"
];

const erc20Interface = Contract.getInterface(erc20Abi);

const TOKEN_CACHE_PREFIX = "sapp_balances_token_repo.token_cache."
const TRACKED_TOKENS = "sapp_balances_token_repo.tracked_tokens"

export const ETH_INFO: Token = {
    address: "",
    symbol: "ETH",
    decimals: 18
}

export interface Balance {
    token: Token,
    balance?: string
}

export interface Token {
    address: string,
    decimals: number,
    symbol: string
}

export const loadTokenInfo = async (eth: Eth, address: string): Promise<Token> => {
    if (address === "") return ETH_INFO
    const cleanAddress = utils.getAddress(address)
    const storageString = localStorage.getItem(TOKEN_CACHE_PREFIX + cleanAddress)
    let token: Token | undefined;
    if (storageString) {
        try {
            token = JSON.parse(storageString)
        } catch (e) {
            localStorage.removeItem(TOKEN_CACHE_PREFIX + cleanAddress)
        }
    }
    if (!token) {
        const symbol = (await callErc20Method(eth, cleanAddress, "symbol"))[0]
        const decimals = (await callErc20Method(eth, cleanAddress, "decimals"))[0]
        token = {
            address: cleanAddress,
            symbol,
            decimals
        }
    }
    localStorage.setItem(TOKEN_CACHE_PREFIX + cleanAddress, JSON.stringify(token))
    return token
}

export const loadTokenBalance = async (eth: Eth, address: string, account: string): Promise<string> => {
    const cleanAccount = utils.getAddress(account)
    if (address === "") {
        const ethBalance = await eth.getBalance([account])
        return ethBalance
    }
    const cleanAddress = utils.getAddress(address)
    return (await callErc20Method(eth, cleanAddress, "balanceOf", [cleanAccount]))[0]
}

const callErc20Method = async (eth: Eth, address: string, method: string, params?: any[]): Promise<utils.Result> => {
    const result = await eth.call([{
        to: address,
        data: erc20Interface.encodeFunctionData(method, params)
    }])
    return erc20Interface.decodeFunctionResult(method, result)
}

const writeTrackedTokens = async (trackedTokens: Record<string, string>) => {
    localStorage.setItem(TRACKED_TOKENS, JSON.stringify(trackedTokens))
}

export const loadTrackedTokens = async (): Promise<Record<string, string>> => {
    const trackedTokensStorage = localStorage.getItem(TRACKED_TOKENS)
    let trackedTokens = { "": "" }
    if (trackedTokensStorage) {
        try {
            trackedTokens = JSON.parse(trackedTokensStorage)
        } catch (e) {
            localStorage.removeItem(TRACKED_TOKENS)
        }
    }
    return trackedTokens
}

export const trackToken = async (address: string) => {
    const trackedTokens = await loadTrackedTokens()
    const cleanAddress = utils.getAddress(address)
    if (cleanAddress in trackedTokens) return
    trackedTokens[cleanAddress] = ""
    writeTrackedTokens(trackedTokens)
}

export const untrackToken = async (address: string) => {
    const trackedTokens = await loadTrackedTokens()
    const cleanAddress = utils.getAddress(address)
    if (!(cleanAddress in trackedTokens)) return
    delete trackedTokens[cleanAddress]
    writeTrackedTokens(trackedTokens)
}

export const encodeTransfer = async (tokenAddress: string, receiver: string, amount: BigNumber): Promise<BaseTransaction> => {
    if (tokenAddress === "") return {
        to: receiver,
        value: amount.toHexString(),
        data: "0x"
    }
    return {
        to: tokenAddress,
        value: "0",
        data: erc20Interface.encodeFunctionData("transfer", [receiver, amount])
    }
}