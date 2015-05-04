import Stream from '../stream'
import _ from './common'

Stream.domevent = function (target, event, untilP) {
  return Stream.event(
    listener => target.addEventListener(event, listener),
    listener => target.removeEventListener(event, listener),
    untilP
  )
}