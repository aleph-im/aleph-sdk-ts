export class QueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QueryError'
  }
}

export class MessageNotFoundError extends QueryError {
  constructor(message: string) {
    super(message)
    this.name = 'MessageNotFoundError'
  }
}

export class BroadcastError extends Error {
  errors: string[]
  constructor(errors: string[]) {
    super(errors.join(', '))
    this.errors = errors
    this.name = 'BroadcastError'
  }
}

export class InvalidMessageError extends BroadcastError {
  constructor(errors: string[]) {
    super(errors)
    this.name = 'InvalidMessageError'
  }
}

export class BadSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadSignatureError'
  }
}

export class FileTooLarge extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileTooLarge'
  }
}

export class DomainConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainConfigurationError'
  }
}

export class ForgottenMessageError extends QueryError {
  constructor(message: string) {
    super(message)
    this.name = 'ForgottenMessageError'
  }
}

export class InsufficientFundsError extends Error {
  required_funds: number
  available_funds: number
  constructor(required_funds: number, available_funds: number) {
    super(`Insufficient funds: required ${required_funds}, available ${available_funds}`)
    this.required_funds = required_funds
    this.available_funds = available_funds
    this.name = 'InsufficientFundsError'
  }
}