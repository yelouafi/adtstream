import Stream from '../stream'
import _ from './common'

Stream.fromDomTarget = function (target, event, untilP) {
  return Stream.bind(
    listener => target.addEventListener(event, listener),
    listener => target.removeEventListener(event, listener),
    untilP
  )
}