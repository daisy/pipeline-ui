const { App } = window

export function ReduxTest() {
    return (
        <div className="redux-test">
            <h1 id="counterValue"></h1>
            <button
                type="button"
                id="btnIncrement"
                onClick={(e) => App.reduxTest.increment()}
            >
                Increment
            </button>
            <button
                type="button"
                id="btnDecrement"
                onClick={(e) => App.reduxTest.decrement()}
            >
                Decrement
            </button>
        </div>
    )
}