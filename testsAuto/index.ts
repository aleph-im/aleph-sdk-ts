import * as accountTests from './accounts/index'

type testsFunc = () => Promise<boolean>

/**
 * Export all your customs tests here
 */
export { testsFunc, accountTests }
