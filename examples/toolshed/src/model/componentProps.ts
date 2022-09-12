import { ActionType, AppStateType } from "../reducer";

export type consumeProps = {
    state: AppStateType;
};

export type dispatchProps = {
    dispatch: React.Dispatch<ActionType>;
};

export type dispatchAndConsume = consumeProps & dispatchProps;
