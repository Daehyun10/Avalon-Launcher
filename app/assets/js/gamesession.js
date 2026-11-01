'use strict'

// Keep one launch active until its game process has stopped.
class GameSession {
    constructor({ onChange, onStarted, onStopped, onError }) {
        this.busy = false
        this.child = null
        this.onChange = onChange
        this.onStarted = onStarted
        this.onStopped = onStopped
        this.onError = onError
    }

    tryStart() {
        if(this.busy) return false
        this.busy = true
        this.onChange(true)
        return true
    }

    release() {
        if(this.child != null) return
        this.busy = false
        this.onChange(false)
    }

    track(child) {
        if(this.child != null) throw new Error('A game process is already running.')
        this.child = child
        let stopped = false
        const stop = (error = null) => {
            if(stopped) return
            stopped = true
            this.child = null
            this.release()
            this.onStopped()
            if(error != null) this.onError(error)
        }
        child.once('spawn', () => {
            if(!stopped) this.onStarted()
        })
        child.once('error', stop)
        child.once('close', () => stop())
    }
}

module.exports = GameSession
