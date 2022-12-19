import { createSlice } from '@reduxjs/toolkit'

export const counter = createSlice({
    name: 'counter',
    initialState: {
        count: 0,
    },
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
