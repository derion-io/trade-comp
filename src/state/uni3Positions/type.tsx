import {IUniPosV3} from 'derivable-engine/dist/services/balanceAndAllowance'
export type Uni3PositionsType = {uni3Positions: {[key:string] :IUniPosV3}, currentUni3Position: string, uni3Loading: boolean}
export const initialState: Uni3PositionsType = {
    uni3Positions: {},
    currentUni3Position: '',
    uni3Loading: true
}
