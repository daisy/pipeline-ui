import { createSlice } from '@reduxjs/toolkit'

export interface CounterState {
    count: number
}

const initialState = {
    count: 0,
} as CounterState

export const counter = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        increment: (state) => {
            state.count += 1
            console.log(`Increment. Count is now ${state.count}`)
        },
        decrement: (state) => {
            state.count -= 1
            console.log(`Decrement. Count is now ${state.count}`)
        },
    },
})

export const { increment, decrement } = counter.actions
