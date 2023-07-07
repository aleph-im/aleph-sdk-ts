/**
 * Wrapper for web3 Providers abstraction
 */
export abstract class BaseProviderWallet {
  /**
   * Connects the Provider and fetch an account
   */
  abstract connect(): Promise<void>

  /**
   * Decrypts data using the Provider
   * @param  {Buffer} data data to decrypt
   */
  abstract decrypt(data: Buffer | string): Promise<string>
  /**
   * Asks the provider for a public key
   */
  abstract getPublicKey(): Promise<string>

  /**
   * Signs a message using the Provider
   * @param  {Buffer|string} data The message to sign
   */
  abstract signMessage(data: Buffer | string): Promise<string>

  /**
   * Asks the provider if its Metamask or not.
   * This can be false positive.
   */
  abstract isMetamask(): boolean
}
