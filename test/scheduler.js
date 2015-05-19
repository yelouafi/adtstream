import { Stream } from "../src"


export function Scheduler() {
  this.reset();
}

Scheduler.prototype.reset = function () {
  this.queue = [];
  this.time = 0;
  this.running = null; 
}


Scheduler.prototype.schedule = function (task, time) {
  var i = 0;
  while( i < this.queue.length && time >= this.queue[i].time )
    i++;
  this.queue.splice(i, 0, { task: task, time: time});
}


Scheduler.prototype.getLater = function (getter, delay, abs) {
  var time = delay + (!abs ? this.time : 0),
      task = new Promise( 
        resolve => this.schedule( () => resolve( getter() ), time )
      );
  return task;
}

Scheduler.prototype.rejectLater = function (getter, delay, abs) {
  var time = delay + (!abs ? this.time : 0),
      task = new Promise( 
        (resolve, reject) => this.schedule( () => {
          reject( getter() );
          return task;
        }, time )
      );
  
  return task;
}

Scheduler.prototype.delay = function (val, delay) {
  return this.getLater( () => val, delay, true);
}


Scheduler.prototype.run = function (log = false) {
  if(this.running)
    throw 'Scheduler is already running';
  clog('starting scheduler');
  
  var next = (idx, cb) => {
    if(idx < this.queue.length) {
      var qt = this.queue[idx];
      this.time = qt.time;
      clog(`at #${qt.time}, task #${idx}`);
      qt.task();
      setTimeout( () => next(idx+1, cb), 4 )
    } else {
      clog('scheduler stopped!')
      cb && cb();
    }
  };
  
  this.running = new Promise(res => {
    setTimeout( () => next(0, res), 0);
  });
  
  return this.running;
  
  function clog(msg) {
    log && console.log(msg);
  }
}


Scheduler.prototype.seq = function(arr, delay, interval) {
  var me = this;
  return from(0, delay);
  
  function from(index, millis) {
    var getter = () => {
      //console.log('from ', index, 'at #', me.time)
      return index < arr.length ? 
          Stream.Cons( arr[index], from(index+1, interval) ) : 
          Stream.Empty;
    }

    return Stream.Future( me.getLater(getter, millis) );
  }
}

Scheduler.prototype.range = function(min, max, delay, interval) {
  var me = this;
  return from(min, delay);
  
  function from(index, millis) {
    
    var getter = () =>
        index <= max ? 
          Stream.Cons( index, from(index+1, interval) ) : 
          Stream.Empty;
        
    return Stream.Future( me.getLater(getter, millis) );
  }
}

Scheduler.prototype.occs = function(occs) {

  var arrP = occs.map( o => this.delay(o[0], o[1])  );
  return from(0);
  
  function from(index) {
    let op;
    return index < arrP.length ? 
      ( op = arrP[index],
        Stream.Future( 
          op.then( v =>  
              v === 'end' ? Stream.Empty :
              v === 'error' ? Stream.Abort("error") :
              Stream.Cons( v, from(index+1)), 
            Stream.Abort 
          ) 
        )
      ) :
      Stream.Empty;
  }
}

Scheduler.prototype.captureSeq = function(s) {
  return new Promise((res, rej) => {
    var seq = [];
    s.forEach(
      v =>{  seq.push([v, this.time]) },
      err => { seq.push(err); res(seq); },
      () => { res(seq) }
    );
  });
}

Scheduler.prototype.mock = function () {
  ['seq', 'range', 'occs']
    .forEach( meth => Stream[meth] = this[meth].bind(this) );
}